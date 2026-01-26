import { Controller } from "@hotwired/stimulus"

import { Loader } from "@googlemaps/js-api-loader"
import { MarkerClusterer, SuperClusterAlgorithm } from "@googlemaps/markerclusterer"

import { getLocale, getURLParams, trigger } from "../../js/utils"
import photoManager from "../../js/photo-manager"
import { appState } from "../../js/app"

const MAX_CLUSTERER_ZOOM = 22
const MAX_INDIVIDUAL_MARKERS = 999

const GOOGLE_MAPS_KEY = "AIzaSyAotaPmPmNRqB3HN7JgB8DVjcGKp7ZuJ74"
const GOOGLE_MAPS_ID = "d6ac709a2949ac5eed859912"

export default class extends Controller {
  static get targets() {
    return ["map"]
  }

  connect() {
    this.markers = []
    this.groupMarkers = []

    this.boundOnClusterClick = this.onClusterClick.bind(this)
  }

  async show() {
    trigger("loader:show", { id: "loaderBase" })

    this.element.classList.add("is-visible")
    await this.initMap()

    trigger("loader:hide", { id: "loaderBase" })
  }

  hide() {
    delete this.delayedBounds
    this.element.classList.remove("is-visible")
    clearTimeout(this.onBoundsChangeTimer)
  }

  async initMap() {
    if (!this.map) {
      const loader = new Loader({
        apiKey: GOOGLE_MAPS_KEY,
        version: "weekly",
        libraries: ["maps", "marker", "geometry"],
        language: getLocale(),
      })

      this.google = await loader.load()

      const params = getURLParams()

      if (!params.gc && params.gb) {
        const gtl = params.gb.split(",").slice(0, 2)
        const gbr = params.gb.split(",").slice(2, 4)
        params.gc = `${(Number(gtl[0]) + Number(gbr[0])) / 2},${(Number(gtl[1]) + Number(gbr[1])) / 2}`
      }

      this.map = new this.google.maps.Map(this.mapTarget, {
        center: {
          lat: Number(params?.gc?.split(",")[0]) || 47.4979,
          lng: Number(params?.gc?.split(",")[1]) || 19.0402,
        },
        zoom: Number(params?.gz) || 12,
        mapId: GOOGLE_MAPS_ID,
        colorScheme: appState("theme--light") ? this.google.maps.ColorScheme.LIGHT : this.google.maps.ColorScheme.DARK,
      })

      this.map.addListener("bounds_changed", this.onBoundsChange.bind(this))

      const customRenderer = {
        render: this.renderClusterMarker.bind(this),
      }

      this.clusterer = new MarkerClusterer({
        map: this.map,
        algorithm: new SuperClusterAlgorithm({ radius: 320, maxZoom: MAX_CLUSTERER_ZOOM }),
        renderer: customRenderer,
      })

      this.clusterer.defaultOnClusterClick = this.clusterer.onClusterClick
      // this.clusterer.onClusterClick = this.boundOnClusterClick
      this.clusterer.onClusterClick = null

      if (this.delayedBounds) {
        this.setBounds({ detail: { bounds: this.delayedBounds } })
        delete this.delayedBounds
      }
    }
  }

  renderClusterMarker(cluster) {
    const data = []
    let counter = 0
    let containsESCluster = false

    cluster.markers.forEach(marker => {
      if (marker.querySelector(".mapmarker").isESCluster) {
        // this will a cluster of ES cluster marker
        data.push(marker.querySelector(".mapmarker").data)
        counter += marker.querySelector(".mapmarker").data.doc_count
        containsESCluster = true
      } else {
        // individual photo marker
        data.push(photoManager.getPhotoDataByID(marker.querySelector(".mapmarker").data.mid))
        counter += 1
      }
    })

    if (data[0].year) data.sort((a, b) => a.year - b.year) // sort the photos by year, ascending order

    const mapMarker = document.getElementById("mapmarker-template").content.firstElementChild.cloneNode(true)

    mapMarker.isGroup = true
    mapMarker.containsESCluster = containsESCluster
    mapMarker.classList.add("is-multiple")
    mapMarker.cluster = cluster

    mapMarker.data = data
    mapMarker.id = `marker-${data[0].mid}-${data[data.length - 1].mid}-${data.length}`
    mapMarker.counter = counter

    mapMarker.addEventListener("click", this.boundOnClusterClick)

    const markerElement = new this.google.maps.marker.AdvancedMarkerElement({
      map: this.map,
      position: cluster.position,
      content: mapMarker,
      gmpClickable: true,
    })

    this.groupMarkers.push({ id: mapMarker.id, element: markerElement })

    return markerElement
  }

  onClusterClick(e) {
    if (e?.target?.classList.contains("map-cluster-marker")) {
      const markerElement = e?.target?.parentElement
      if (markerElement.isESCluster) {
        // ES cluster marker is clicked
        this.map.fitBounds(this.geotileToBounds(markerElement.data.key, this.map))
      } else if (markerElement.isGroup && markerElement.cluster) {
        // grouped cluster marker clicked
        // call the default cluster click only when the cluster marker is clicked
        this.clusterer.defaultOnClusterClick(e, markerElement.cluster, this.map)
      }
    }
  }

  geotileToBounds(geotileKey, map) {
    const [zoom, x, y] = geotileKey.split("/").map(Number)

    const TILE_SIZE = 256
    // eslint-disable-next-line no-restricted-properties
    const scale = Math.pow(2, zoom)

    const projection = map.getProjection()

    // World pixel coordinates
    const nwPoint = new this.google.maps.Point((x * TILE_SIZE) / scale, (y * TILE_SIZE) / scale)
    const sePoint = new this.google.maps.Point(((x + 1) * TILE_SIZE) / scale, ((y + 1) * TILE_SIZE) / scale)

    const nwLatLng = projection.fromPointToLatLng(nwPoint)
    const seLatLng = projection.fromPointToLatLng(sePoint)

    return new this.google.maps.LatLngBounds(nwLatLng, seLatLng)
  }

  toggleMapStyles() {
    if (this.map) window.location.reload()
  }

  clearMarkers() {
    delete this.delayedBounds

    if (this.markers.length) {
      this.markers.forEach(marker => {
        marker.element.removeEventListener("click", this.onClusterClick)
      })
    }

    this.clusterer.clearMarkers()
    this.markers.length = 0
  }

  clearGroupMarkers() {
    if (this.groupMarkers.length) {
      this.groupMarkers.forEach(marker => {
        marker.element.removeEventListener("click", this.onClusterClick)
      })
    }

    this.groupMarkers.length = 0
  }

  updateMarkers(photosData) {
    // remove the markers that are not in the set
    this.markers.forEach((marker, index) => {
      const needed = !!photosData.items.find(photo => photo.mid.toString() === marker.mid.toString())

      if (!needed) {
        marker.element.removeEventListener("click", this.onClusterClick)
        this.markers.splice(index, 1) // Remove the marker from the list of managed markers
      }
    })

    const markersToAdd = []

    // create new markers
    photosData.items.forEach(data => {
      // check if there is a marker already existing for this image
      const existingMarker = this.markers.find(marker => marker.mid.toString() === data.mid.toString())
      let markerToAdd

      // only create the marker if it doesn't exist
      if (!existingMarker) {
        const mapMarker = document.getElementById("mapmarker-template").content.firstElementChild.cloneNode(true)

        mapMarker.data = data
        mapMarker.id = `marker-${data.mid}`

        const markerElement = new this.google.maps.marker.AdvancedMarkerElement({
          map: this.map,
          position: { lat: data.location.lat, lng: data.location.lon },
          content: mapMarker,
        })

        this.markers.push({ id: mapMarker.id, mid: data.mid, element: markerElement })

        markerToAdd = markerElement
      } else {
        markerToAdd = existingMarker.element
      }

      markersToAdd.push(markerToAdd)
    })

    // display cluster markers coming from ES
    if (photosData.clusters) {
      photosData.clusters.forEach(data => {
        const mapMarker = document.getElementById("mapmarker-template").content.firstElementChild.cloneNode(true)

        mapMarker.isESCluster = true
        mapMarker.classList.add("is-multiple", "is-es-cluster")

        mapMarker.data = data
        mapMarker.id = `marker-${data.key}`
        mapMarker.count = data.doc_count

        const markerElement = new this.google.maps.marker.AdvancedMarkerElement({
          map: this.map,
          position: { lat: data.center.location.lat, lng: data.center.location.lon },
          content: mapMarker,
        })

        markerElement.addEventListener("click", this.boundOnClusterClick)

        this.markers.push({ id: mapMarker.id, mid: data.key, element: markerElement })

        markersToAdd.push(markerElement)
      })
    }

    this.clusterer.addMarkers(markersToAdd)

    // this.map.fitBounds(bounds)
  }

  setBounds(e) {
    if (e?.detail?.bounds) {
      if (!this.map) {
        this.delayedBounds = e.detail.bounds
        return
      }

      const bounds = new this.google.maps.LatLngBounds()

      bounds.extend({ lat: e.detail.bounds.top_left.lat, lng: e.detail.bounds.top_left.lng })
      bounds.extend({ lat: e.detail.bounds.bottom_right.lat, lng: e.detail.bounds.bottom_right.lng })

      this.map.fitBounds(bounds)
    }
  }

  onPopState() {
    const params = getURLParams()

    if (params.gc && this.map) {
      const gc = params.gc.split(",")
      this.map.setCenter({ lat: Number(gc[0]), lng: Number(gc[1]) })
    }

    if (params.gz && this.map) {
      this.map.setZoom(Number(params.gz))
    }
  }

  async onBoundsChange() {
    // clear markers when zoom is changed
    if (this.mapZoom !== this.map.getZoom()) {
      this.clearMarkers()
      this.mapZoom = this.map.getZoom()
    }

    clearTimeout(this.onBoundsChangeTimer)

    this.onBoundsChangeTimer = setTimeout(async () => {
      if (!this.mapDataLoading) {
        this.mapDataLoading = true

        trigger("thumbnailbar:hide")
        trigger("photosCarousel:close")

        trigger("loader:show", { id: "loaderBase" })

        this.pushHistoryState()

        const params = getURLParams()
        params.size = 0
        params.clustered = true

        // no need to load aggregated years on the map view, it slows the query down
        params.disableAggregatedYears = true

        const mb = this.map.getBounds()
        const b = {
          tl: {
            lat: mb
              .getNorthEast()
              .lat()
              .toFixed(4),
            lng: mb
              .getSouthWest()
              .lng()
              .toFixed(4),
          },
          br: {
            lat: mb
              .getSouthWest()
              .lat()
              .toFixed(4),
            lng: mb
              .getNorthEast()
              .lng()
              .toFixed(4),
          },
        }

        params.gb = `${b.tl.lat},${b.tl.lng},${b.br.lat},${b.br.lng}`

        let photoData = await photoManager.loadPhotoData(params)

        if (photoData?.clusters?.length && photoData.total <= MAX_INDIVIDUAL_MARKERS) {
          // we have clusters and total is <= MAX_INDIVIDUAL_MARKERS, reloading without clustering
          params.size = MAX_INDIVIDUAL_MARKERS
          params.clustered = false
          photoData = await photoManager.loadPhotoData(params)
        }

        this.clusterer.clearMarkers()
        // clear group markers
        this.clearGroupMarkers()

        this.updateMarkers(photoData)

        trigger("loader:hide", { id: "loaderBase" })

        delete this.mapDataLoading
      }
    }, 200)
  }

  onMarkerPhotoSelected(e) {
    if (e?.detail?.photoData) {
      if (e.detail.photoData.length > 1) {
        // for group markers display the thumbnailbar
        this.showThumbnailsBar(e.detail.photoData, e.detail?.photoId)
      } else {
        photoManager.selectPhotoById(e.detail?.photoId)
        trigger("thumbnail:click", {
          data: e.detail.photoData,
          dataset: [e.detail.photoData],
          setId: e.detail?.setId,
        })
      }
    }
  }

  showThumbnailsBar(photoData, photoId) {
    if (photoData) {
      trigger("thumbnailbar:show", { photoData, photoId })
    }
  }

  hideThumbnailsBar() {
    trigger("thumbnailbar:hide")
  }

  onThumbnailsBarClosed() {
    document.querySelectorAll(".mapmarker").forEach(marker => marker.classList.remove("is-selected"))
  }

  pushHistoryState() {
    if (this.map) {
      let params = getURLParams()
      delete params.gb
      delete params.gc
      delete params.gz
      params = new URLSearchParams(params).toString()

      const gc = this.map.getCenter()
      const zoom = this.map.getZoom()

      window.history.pushState(
        null,
        null,
        `/${getLocale()}/map/?gc=${gc.lat().toFixed(4)},${gc.lng().toFixed(4)}&gz=${Math.round(zoom)}${
          params ? `&${params}` : ""
        }`
      )
    }
  }
}
