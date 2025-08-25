import { Controller } from "@hotwired/stimulus"

import { Loader } from "@googlemaps/js-api-loader"
import { MarkerClusterer, SuperClusterAlgorithm } from "@googlemaps/markerclusterer"

import { getLocale, getURLParams, trigger } from "../../js/utils"
import photoManager from "../../js/photo-manager"
import { appState } from "../../js/app"

const MAX_CLUSTERER_ZOOM = 22
const GOOGLE_MAPS_KEY = "AIzaSyAotaPmPmNRqB3HN7JgB8DVjcGKp7ZuJ74"
const GOOGLE_MAPS_ID = "d6ac709a2949ac5eed859912"

export default class extends Controller {
  static get targets() {
    return ["map"]
  }

  connect() {
    this.markers = []
    this.groupMarkers = []
  }

  getTime() {
    return `[${new Date().toLocaleTimeString("en-GB")}:${String(new Date().getMilliseconds()).padStart(3, "0")}] -`
  }

  async show() {
    trigger("loader:show", { id: "loaderBase" })

    this.element.classList.add("is-visible")
    console.log(this.getTime(), "initMap")

    await this.initMap()

    console.log(this.getTime(), "initMap finished")

    trigger("loader:hide", { id: "loaderBase" })
  }

  hide() {
    delete this.delayedBounds
    this.element.classList.remove("is-visible")
    clearTimeout(this.updateTimer)
  }

  async initMap() {
    if (!this.map) {
      const loader = new Loader({
        apiKey: GOOGLE_MAPS_KEY,
        version: "weekly",
        libraries: ["maps", "marker", "geometry"],
      })

      this.google = await loader.load()

      const params = getURLParams()

      this.map = new this.google.maps.Map(this.mapTarget, {
        center: {
          lat: Number(params?.center?.split(",")[0]) || 47.4979,
          lng: Number(params?.center?.split(",")[1]) || 19.0402,
        },
        zoom: Number(params?.zoom) || 15,
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
      this.clusterer.onClusterClick = this.onClusterClick.bind(this)

      if (this.delayedBounds) {
        this.setBounds({ detail: { bounds: this.delayedBounds } })
        delete this.delayedBounds
      }
    }
  }

  renderClusterMarker({ count, position, markers }) {
    // TODO: build the proper group markers here instead of the custom grouping

    const data = []

    markers.forEach(marker => {
      data.push(photoManager.getPhotoDataByID(marker.querySelector(".mapmarker").data.mid))
    })

    data.sort((a, b) => a.year - b.year) // sort the photos by year, ascending order

    const mapMarker = document.getElementById("mapmarker-template").content.firstElementChild.cloneNode(true)
    // const mapMarker = document.createElement("div")

    mapMarker.isGroup = true
    mapMarker.classList.add("is-multiple")

    mapMarker.data = data
    mapMarker.id = `marker-${data[0].mid}-${data[data.length - 1].mid}-${data.length}`
    mapMarker.count = count

    const markerElement = new this.google.maps.marker.AdvancedMarkerElement({
      map: this.map,
      position,
      content: mapMarker,
    })

    this.groupMarkers.push({ id: mapMarker.id, element: markerElement })
    // bounds.extend({ lat: loc.lat, lng: loc.lon })

    return markerElement
  }

  onClusterClick(e, cluster, map) {
    if (e?.domEvent?.target.classList.contains("map-cluster-marker")) {
      // call the default cluster click only when the cluster marker is clicked
      this.clusterer.defaultOnClusterClick(e, cluster, map)
    }
  }

  toggleMapStyles() {
    if (this.map) window.location.reload()
  }

  getDistanceBetween(lat1, lon1, lat2, lon2) {
    if (this.google) {
      const p1 = new this.google.maps.LatLng(lat1, lon1)
      const p2 = new this.google.maps.LatLng(lat2, lon2)
      const distance = this.google.maps.geometry.spherical.computeDistanceBetween(p1, p2)
      return distance
    }

    return -1
  }

  clearMarkers() {
    delete this.delayedBounds

    if (this.markers.length) {
      this.markers.forEach(marker => {
        this.google.maps.event.clearListeners(marker.element, "click")
      })
    }

    this.clusterer.clearMarkers()
    this.markers.length = 0
  }

  clearGroupMarkers() {
    if (this.groupMarkers.length) {
      this.groupMarkers.forEach(marker => {
        this.google.maps.event.clearListeners(marker.element, "click")
      })
    }

    // this.clusterer.clearMarkers()
    this.groupMarkers.length = 0
  }

  updateMarkers(photosData) {
    // const bounds = new this.google.maps.LatLngBounds()

    // let markersRemoved = 0
    // const beforeMarkers = this.markers.length

    // remove the markers that are not in the set
    this.markers.forEach((marker, index) => {
      const needed = !!photosData.find(photo => photo.mid.toString() === marker.mid.toString())
      if (!needed) {
        // markersRemoved += 1
        this.google.maps.event.clearListeners(marker.element, "click")
        // this.clusterer.removeMarker(marker.element)
        this.markers.splice(index, 1) // Remove the marker from the list of managed markers
      }
    })

    const markersToAdd = []

    // create new markers
    photosData.forEach(data => {
      // check if there is a marker already existing for this image
      const existingMarker = this.markers.find(marker => marker.mid.toString() === data.mid.toString())
      let markerToAdd

      // only create the marker if it doesn't exist
      if (!existingMarker) {
        const loc = data.locations.find(l => l.shooting_location > 0) || data.locations[0]

        const mapMarker = document.getElementById("mapmarker-template").content.firstElementChild.cloneNode(true)
        // const mapMarker = document.createElement("div")
        // mapMarker.classList.add("mapmarker")

        mapMarker.data = data
        mapMarker.id = `marker-${data.mid}`

        const markerElement = new this.google.maps.marker.AdvancedMarkerElement({
          map: this.map,
          position: { lat: loc.lat, lng: loc.lon },
          content: mapMarker,
        })

        this.markers.push({ id: mapMarker.id, mid: data.mid, element: markerElement })
        // bounds.extend({ lat: loc.lat, lng: loc.lon })

        markerToAdd = markerElement
      } else {
        markerToAdd = existingMarker.element
      }

      markersToAdd.push(markerToAdd)
    })

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

  async onBoundsChange() {
    clearTimeout(this.updateTimer)

    this.updateTimer = setTimeout(async () => {
      if (!this.mapDataLoading) {
        this.mapDataLoading = true

        trigger("thumbnailbar:hide")
        trigger("photosCarousel:close")

        trigger("loader:show", { id: "loaderBase" })

        this.pushHistoryState()

        const mb = this.map.getBounds()

        const bounds = {
          top_left: {
            lat: mb.getNorthEast().lat(),
            lng: mb.getNorthEast().lng(),
          },
          bottom_right: { lat: mb.getSouthWest().lat(), lng: mb.getSouthWest().lng() },
        }

        let start = Date.now()
        console.log(this.getTime(), "loading data")
        const photos = await photoManager.loadMapPhotoData(bounds)
        let t = Date.now() - start
        console.log(
          this.getTime(),
          `finish loading ${photos.length} photos in:`,
          `${String(Math.floor(t / 1000)).padStart(2, "0")}:${String(Math.floor(t % 1000)).padStart(3, "0")}`
        )

        this.clusterer.clearMarkers()
        // clear group markers
        this.clearGroupMarkers()

        start = Date.now()
        console.log(this.getTime(), "update markers")
        this.updateMarkers(photos)
        t = Date.now() - start
        console.log(
          this.getTime(),
          "update markers finished in:",
          `${String(Math.floor(t / 1000)).padStart(2, "0")}:${String(Math.floor(t % 1000)).padStart(3, "0")}`
        )

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
      const lat = this.map
        .getCenter()
        .lat()
        .toFixed(4)
      const lng = this.map
        .getCenter()
        .lng()
        .toFixed(4)
      const zoom = this.map.getZoom()

      window.history.pushState(null, null, `/${getLocale()}/map/?center=${lat},${lng}&zoom=${zoom}`)
    }
  }
}
