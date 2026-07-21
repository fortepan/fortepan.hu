import { Controller } from "@hotwired/stimulus"

import { setOptions, importLibrary } from "@googlemaps/js-api-loader"
import { MarkerClusterer, SuperClusterAlgorithm } from "@googlemaps/markerclusterer"

import { getLocale, getURLParams, trigger, lang } from "../../js/utils"
import photoManager from "../../js/photo-manager"
import { appState } from "../../js/app"
import config from "../../data/siteConfig"

const MAX_CLUSTERER_ZOOM = 22
const MAX_INDIVIDUAL_MARKERS = 999

export default class extends Controller {
  static get targets() {
    return ["map"]
  }

  connect() {
    this.markers = new Map()
    this.groupMarkers = []

    this.boundOnClusterClick = this.onClusterClick.bind(this)
    this.boundOnBoundsChanged = this.onBoundsChanged.bind(this)
    this.boundOnIdle = this.onBoundsChange.bind(this)
    this.boundRenderClusterMarker = this.renderClusterMarker.bind(this)
  }

  async show() {
    trigger("loader:show", { id: "loaderBase" })

    this.element.classList.add("is-visible")
    await this.initMap()

    trigger("loader:hide", { id: "loaderBase" })
  }

  hide() {
    delete this.delayedBounds
    delete this.mapLoadPending
    this.element.classList.remove("is-visible")
  }

  async initMap() {
    if (!this.map) {
      setOptions({
        key: this.element.dataset.googleMapsKey,
        version: "weekly",
        language: getLocale(),
      })

      const [googleMaps, googleMapsMarker] = await Promise.all([
        importLibrary("maps"),
        importLibrary("marker"),
        importLibrary("geometry"),
      ])

      this.googleMaps = googleMaps
      this.googleMapsMarker = googleMapsMarker

      this.buildMap()

      if (this.delayedBounds) {
        this.setBounds({ detail: { bounds: this.delayedBounds } })
        delete this.delayedBounds
      }
    }
  }

  buildMap({ center, zoom } = {}) {
    let mapCenter = center
    let mapZoom = zoom

    if (mapCenter == null || mapZoom == null) {
      const params = getURLParams()

      if (!params.gc && params.gb) {
        const gtl = params.gb.split(",").slice(0, 2)
        const gbr = params.gb.split(",").slice(2, 4)
        params.gc = `${(Number(gtl[0]) + Number(gbr[0])) / 2},${(Number(gtl[1]) + Number(gbr[1])) / 2}`
      }

      if (mapCenter == null) {
        mapCenter = {
          lat: Number(params?.gc?.split(",")[0]) || 47.4979,
          lng: Number(params?.gc?.split(",")[1]) || 19.0402,
        }
      }

      if (mapZoom == null) {
        mapZoom = Number(params?.gz) || 12
      }
    }

    this.map = new this.googleMaps.Map(this.mapTarget, {
      center: mapCenter,
      zoom: mapZoom,
      mapId: this.element.dataset.googleMapsId,
      colorScheme: appState("theme--light") ? "LIGHT" : "DARK",
    })

    this.clusterer = new MarkerClusterer({
      map: this.map,
      algorithm: new SuperClusterAlgorithm({ radius: 320, maxZoom: MAX_CLUSTERER_ZOOM }),
      renderer: { render: this.boundRenderClusterMarker },
    })

    this.clusterer.defaultOnClusterClick = this.clusterer.onClusterClick
    this.clusterer.onClusterClick = null

    // Clear on zoom as soon as bounds change; fetch only once the camera settles.
    this.boundsChangedListener = this.map.addListener("bounds_changed", this.boundOnBoundsChanged)
    // Register after clusterer so the first idle can safely update markers.
    this.idleListener = this.map.addListener("idle", this.boundOnIdle)
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

    const markerElement = new this.googleMapsMarker.AdvancedMarkerElement({
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
        this.map.fitBounds(this.geotileToBounds(markerElement.data.key))
      } else if (markerElement.isGroup && markerElement.cluster) {
        // grouped cluster marker clicked
        // call the default cluster click only when the cluster marker is clicked
        this.clusterer.defaultOnClusterClick(e, markerElement.cluster, this.map)
      }
    }
  }

  // Convert ES geotile_grid key ("zoom/x/y") to a LatLngBoundsLiteral via Web Mercator.
  // Avoids google.maps.Point / getProjection (Point is on core, not the maps library import).
  geotileToBounds(geotileKey) {
    const [zoom, x, y] = geotileKey.split("/").map(Number)
    // eslint-disable-next-line no-restricted-properties
    const n = Math.pow(2, zoom)
    const tileToLat = ty => {
      const rad = Math.PI - (2 * Math.PI * ty) / n
      return (180 / Math.PI) * Math.atan(Math.sinh(rad))
    }

    return {
      west: (x / n) * 360 - 180,
      east: ((x + 1) / n) * 360 - 180,
      north: tileToLat(y),
      south: tileToLat(y + 1),
    }
  }

  // Remove click on element and content (ES vs group markers attach on different nodes).
  detachAdvancedMarker(element) {
    if (!element) return
    element.removeEventListener("click", this.boundOnClusterClick)
    element.content?.removeEventListener?.("click", this.boundOnClusterClick)
    element.map = null
  }

  toggleMapStyles() {
    if (!this.map) return
    // defer one frame so theme-controller has already updated the app state
    requestAnimationFrame(() => this.recreateMap())
  }

  recreateMap() {
    const c = this.map.getCenter()
    const center = { lat: c.lat(), lng: c.lng() }
    const zoom = this.map.getZoom()

    delete this.mapLoadPending
    trigger("loader:show", { id: "loaderBase" })

    ;[...this.markers.values(), ...this.groupMarkers].forEach(({ element }) => {
      this.detachAdvancedMarker(element)
    })
    this.markers.clear()
    this.groupMarkers.length = 0

    // clusterer.setMap(null) triggers onRemove() -> idle listener removed + reset().
    this.clusterer.setMap(null)
    this.clusterer = null

    if (this.boundsChangedListener) {
      this.boundsChangedListener.remove()
      this.boundsChangedListener = null
    }
    if (this.idleListener) {
      this.idleListener.remove()
      this.idleListener = null
    }
    this.map = null
    delete this.mapZoom

    this.mapTarget.replaceChildren()
    this.buildMap({ center, zoom })
  }

  clearMarkers() {
    delete this.delayedBounds

    this.markers.forEach(marker => {
      this.detachAdvancedMarker(marker.element)
    })

    this.clusterer.clearMarkers()
    this.markers.clear()
  }

  clearGroupMarkers() {
    this.groupMarkers.forEach(marker => {
      this.detachAdvancedMarker(marker.element)
    })

    this.groupMarkers.length = 0
  }

  updateMarkers(photosData) {
    const items = photosData.items || []
    const neededMids = new Set(items.map(photo => photo.mid.toString()))

    // ES cluster keys are never in neededMids, so prior clusters are always dropped here.
    for (const [mid, marker] of this.markers) {
      if (!neededMids.has(mid)) {
        this.detachAdvancedMarker(marker.element)
        this.markers.delete(mid)
      }
    }

    const markersToAdd = []

    items.forEach(data => {
      const key = data.mid.toString()
      let markerToAdd = this.markers.get(key)?.element

      if (!markerToAdd) {
        const mapMarker = document.getElementById("mapmarker-template").content.firstElementChild.cloneNode(true)

        mapMarker.data = data
        mapMarker.id = `marker-${data.mid}`

        markerToAdd = new this.googleMapsMarker.AdvancedMarkerElement({
          map: this.map,
          position: { lat: data.location.lat, lng: data.location.lon },
          content: mapMarker,
        })

        this.markers.set(key, { element: markerToAdd })
      }

      markersToAdd.push(markerToAdd)
    })

    if (photosData.clusters) {
      photosData.clusters.forEach(data => {
        const key = String(data.key)
        const mapMarker = document.getElementById("mapmarker-template").content.firstElementChild.cloneNode(true)

        mapMarker.isESCluster = true
        mapMarker.classList.add("is-multiple", "is-es-cluster")

        mapMarker.data = data
        mapMarker.id = `marker-${data.key}`
        mapMarker.count = data.doc_count

        const markerElement = new this.googleMapsMarker.AdvancedMarkerElement({
          map: this.map,
          position: { lat: data.center.location.lat, lng: data.center.location.lon },
          content: mapMarker,
        })

        markerElement.addEventListener("click", this.boundOnClusterClick)

        this.markers.set(key, { element: markerElement })
        markersToAdd.push(markerElement)
      })
    }

    this.clusterer.addMarkers(markersToAdd)
  }

  setBounds(e) {
    if (e?.detail?.bounds) {
      if (!this.map) {
        this.delayedBounds = e.detail.bounds
        return
      }

      const bounds = new this.googleMaps.LatLngBounds()

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

  // Drop markers immediately when zoom changes so they aren't transformed mid-gesture.
  onBoundsChanged() {
    if (!this.map || !this.clusterer) return

    const zoom = this.map.getZoom()
    if (this.mapZoom !== zoom) {
      this.clearMarkers()
      this.clearGroupMarkers()
      this.mapZoom = zoom
    }
  }

  async onBoundsChange() {
    if (!this.map) return

    if (this.mapDataLoading) {
      this.mapLoadPending = true
      return
    }

    this.mapDataLoading = true
    trigger("loader:show", { id: "loaderBase" })

    try {
      do {
        this.mapLoadPending = false

        const mb = this.map?.getBounds()
        if (!mb || !this.clusterer) break

        trigger("snackbar:hide")
        trigger("thumbnailbar:hide")
        trigger("photosCarousel:close")

        this.pushHistoryState()

        const params = getURLParams()

        // fill in the search field if there's regular search params in the url
        const values = []

        Object.keys(params).forEach(key => {
          if (key === "q") {
            values.push(`${params[key]}`)
          } else if (config().ADVANCED_SEARCH_KEYS.includes(key) && params.advancedSearch) {
            values.push(`${key}:${params[key]}`)
          }
        })

        if (values.length > 0) {
          trigger("search:clear")
          setTimeout(() => {
            trigger("search:setValue", { value: values.join(",") })
          }, 20)
        }

        // set up params for the API call
        params.size = 0
        params.clustered = true

        // no need to load aggregated years on the map view, it slows the query down
        params.disableAggregatedYears = true

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

        if (!this.map || !this.clusterer) break

        this.clusterer.clearMarkers()
        this.clearGroupMarkers()
        this.updateMarkers(photoData)

        // handling zero results
        if ((Array.isArray(photoData.clusters) && photoData.clusters.length === 0) || photoData.total === 0) {
          trigger("snackbar:show", {
            message: `${lang("map").no_results}`,
            status: "error",
            autoHide: false,
          })
        }
      } while (this.mapLoadPending && this.map)
    } finally {
      delete this.mapDataLoading
      trigger("loader:hide", { id: "loaderBase" })
      // New idle/search may have queued while we were loading (e.g. during recreateMap).
      if (this.mapLoadPending && this.map) {
        this.onBoundsChange()
      }
    }
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

      const prevGC = params.gc
      const prevGZ = params.gz

      delete params.gb
      delete params.gc
      delete params.gz
      params = new URLSearchParams(params).toString().replace("+", "%20")

      const gc = `${this.map
        .getCenter()
        .lat()
        .toFixed(4)},${this.map
        .getCenter()
        .lng()
        .toFixed(4)}`

      const zoom = Math.round(this.map.getZoom()).toString()

      if (gc !== prevGC || zoom !== prevGZ) {
        window.history.pushState(null, null, `/${getLocale()}/map/?gc=${gc}&gz=${zoom}${params ? `&${params}` : ""}`)
      }
    }
  }
}
