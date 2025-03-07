import { Controller } from "@hotwired/stimulus"
import { throttle } from "lodash"

import { Loader } from "@googlemaps/js-api-loader"
import { MarkerClusterer, SuperClusterAlgorithm } from "@googlemaps/markerclusterer"

import { trigger } from "../../js/utils"
import photoManager from "../../js/photo-manager"

export default class extends Controller {
  static get targets() {
    return ["map"]
  }

  connect() {
    this.markers = []

    this.onBoundsChange = throttle(this.onBoundsChange, 1000)

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
  }

  async initMap() {
    if (!this.map) {
      const loader = new Loader({
        apiKey: "AIzaSyDM5TKRFlszuRdq-Wal3Y3Zf9TzvoRPgLw",
        version: "weekly",
        libraries: ["maps", "marker"],
      })

      const google = await loader.load()

      this.map = new google.maps.Map(this.mapTarget, {
        center: {
          lat: 47.4979,
          lng: 19.0402,
        },
        zoom: 18,
        mapId: "ForteMap",
      })

      this.map.addListener("bounds_changed", () => {
        this.onBoundsChange()
      })

      this.google = google

      const customRenderer = {
        render: ({ count, position }) => {
          const markerContent = document.createElement("div")
          markerContent.className = "map-cluster-marker"
          markerContent.textContent = count
          // markerContent.style.borderWidth = `${Math.floor(count / 20)}px`

          return new google.maps.marker.AdvancedMarkerElement({
            map: this.map,
            content: markerContent,
            position,
          })
        },
      }

      this.clusterer = new MarkerClusterer({
        map: this.map,
        algorithm: new SuperClusterAlgorithm({ radius: 160, maxZoom: 18 }),
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

  clearMarkers() {
    delete this.delayedBounds

    if (this.markers.length) {
      this.markers.forEach(marker => {
        this.google.maps.event.clearListeners(marker, "click")
      })
    }

    this.clusterer.clearMarkers()
    this.markers = []
  }

  updateMarkers(photosData) {
    // const bounds = new this.google.maps.LatLngBounds()

    photosData.forEach((data, i) => {
      if (data.locations && data.locations.length) {
        const loc = data.locations.find(l => l.shooting_location > 0) || data.locations[0]

        const imageMarker = document.getElementById("mapmarker-template").content.firstElementChild.cloneNode(true)
        // clone thumbnail template
        const thumbnail = document.getElementById("photos-thumbnail").content.firstElementChild.cloneNode(true)

        // set thumnail node element index
        thumbnail.index = i

        // apply photo id to node
        thumbnail.photoId = data.mid

        // apply year data to node
        thumbnail.year = data.year

        // forcing to display the thumbnail always in small
        thumbnail.customSizeRatio = 0.5

        imageMarker.querySelector(".mapmarker__thumbnail-wrapper").appendChild(thumbnail)

        const gMarker = new this.google.maps.marker.AdvancedMarkerElement({
          map: this.map,
          position: { lat: loc.lat, lng: loc.lon },
          content: imageMarker,
        })

        gMarker.addListener("click", () => {
          // this.hide()
        })

        this.markers.push(gMarker)
        // bounds.extend({ lat: loc.lat, lng: loc.lon })
      }
    })

    this.clusterer.addMarkers(this.markers)

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
    if (!this.mapDataLoading) {
      this.mapDataLoading = true

      trigger("loader:show", { id: "loaderBase" })

      const mb = this.map.getBounds()

      const bounds = {
        top_left: {
          lat: mb.getNorthEast().lat(),
          lng: mb.getNorthEast().lng(),
        },
        bottom_right: { lat: mb.getSouthWest().lat(), lng: mb.getSouthWest().lng() },
      }

      const photosData = await photoManager.loadMapPhotoData(bounds)

      this.clearMarkers()
      this.updateMarkers(photosData)

      trigger("loader:hide", { id: "loaderBase" })

      delete this.mapDataLoading
    }
  }
}
