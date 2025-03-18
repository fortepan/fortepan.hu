import { Controller } from "@hotwired/stimulus"

import { Loader } from "@googlemaps/js-api-loader"
import { MarkerClusterer, SuperClusterAlgorithm } from "@googlemaps/markerclusterer"

import { trigger } from "../../js/utils"
import photoManager from "../../js/photo-manager"

const MAX_CLUSTERER_ZOOM = 22

export default class extends Controller {
  static get targets() {
    return ["map"]
  }

  connect() {
    this.markers = []
    this.groupMarkers = []

    this.show()
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
    clearTimeout(this.updateTimer)
  }

  async initMap() {
    if (!this.map) {
      const loader = new Loader({
        apiKey: "AIzaSyDM5TKRFlszuRdq-Wal3Y3Zf9TzvoRPgLw",
        version: "weekly",
        libraries: ["maps", "marker", "geometry"],
      })

      const google = await loader.load()

      this.map = new google.maps.Map(this.mapTarget, {
        center: {
          lat: 47.4979,
          lng: 19.0402,
        },
        zoom: 16,
        mapId: "ForteMap",
      })

      this.map.addListener("bounds_changed", () => {
        this.onBoundsChange()
      })

      this.google = google

      const customRenderer = {
        render: ({ count, position, markers }) => {
          // TODO: build the proper group markers here instead of the custom grouping

          const data = photoManager.getPhotoDataByID(markers[0].querySelector(".mapmarker").data.mid)

          const mapMarker = document.getElementById("mapmarker-template").content.firstElementChild.cloneNode(true)
          mapMarker.data = data

          mapMarker.isGroup = true
          mapMarker.classList.add("is-multiple")

          mapMarker.count = count

          const markerElement = new google.maps.marker.AdvancedMarkerElement({
            map: this.map,
            position,
            content: mapMarker,
          })

          // markerElement.addListener("click", () => {
          // this.hide()
          // })

          this.groupMarkers.push({ mid: data.mid, element: markerElement })
          // bounds.extend({ lat: loc.lat, lng: loc.lon })

          return markerElement

          // ----

          /*           const markerContent = document.createElement("div")
          markerContent.className = "map-cluster-marker"
          markerContent.textContent = count



          return new google.maps.marker.AdvancedMarkerElement({
            map: this.map,
            content: markerContent,
            position,
          }) */
        },
      }

      this.clusterer = new MarkerClusterer({
        map: this.map,
        algorithm: new SuperClusterAlgorithm({ radius: 320, maxZoom: MAX_CLUSTERER_ZOOM }),
        renderer: customRenderer,
      })

      if (this.delayedBounds) {
        this.setBounds({ detail: { bounds: this.delayedBounds } })
        delete this.delayedBounds
      }
    }
  }

  toggleMapStyles() {
    // TODO if needed
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
      const needed = !!photosData.find(imgData => imgData.mid.toString() === marker.mid.toString())
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
        mapMarker.data = data

        const markerElement = new this.google.maps.marker.AdvancedMarkerElement({
          map: this.map,
          position: { lat: loc.lat, lng: loc.lon },
          content: mapMarker,
        })

        this.markers.push({ mid: data.mid, element: markerElement })
        // bounds.extend({ lat: loc.lat, lng: loc.lon })

        markerToAdd = markerElement
      } else {
        markerToAdd = existingMarker.element
      }

      markersToAdd.push(markerToAdd)
    })

    this.clusterer.addMarkers(markersToAdd)

    /* console.log(
      "before:",
      beforeMarkers,
      "removed:",
      markersRemoved,
      "after removal:",
      afterRemoved,
      "new markers:",
      markersToAdd.length,
      "new total:",
      this.markers.length
    ) */

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

        trigger("loader:show", { id: "loaderBase" })

        this.clusterer.clearMarkers()
        // clear group markers
        this.clearGroupMarkers()

        const mb = this.map.getBounds()

        const bounds = {
          top_left: {
            lat: mb.getNorthEast().lat(),
            lng: mb.getNorthEast().lng(),
          },
          bottom_right: { lat: mb.getSouthWest().lat(), lng: mb.getSouthWest().lng() },
        }

        const photos = await photoManager.loadMapPhotoData(bounds)

        // this.clearMarkers()
        this.updateMarkers(photos)

        trigger("loader:hide", { id: "loaderBase" })

        delete this.mapDataLoading
      }
    }, 200)
  }
}
