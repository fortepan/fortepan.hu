import { Controller } from "@hotwired/stimulus"

import { Loader } from "@googlemaps/js-api-loader"
import { MarkerClusterer } from "@googlemaps/markerclusterer"
import { trigger } from "../../js/utils"
import photoManager from "../../js/photo-manager"

export default class extends Controller {
  static get targets() {
    return ["map"]
  }

  connect() {
    this.markers = []
  }

  async show() {
    trigger("loader:show", { id: "loaderBase" })

    this.element.classList.add("is-visible")

    await this.initMap()

    trigger("loader:hide", { id: "loaderBase" })
  }

  hide() {
    console.log("hide map", this.element.classList)
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
          lat: 0,
          lng: 0,
        },
        zoom: 4,
        mapId: "ForteMap",
      })

      this.google = google

      this.clusterer = new MarkerClusterer({ map: this.map })
    }
  }

  toggleMapStyles() {
    // TODO if needed
  }

  clearMarkers() {
    if (this.markers.length) {
      this.markers.forEach(marker => {
        this.google.maps.event.clearListeners(marker, "click")
      })
    }
    this.clusterer.clearMarkers()
    this.markers = []
  }

  updateMarkers(e) {
    const bounds = new this.google.maps.LatLngBounds()

    const photosData = e?.detail?.photosData || photoManager.getData()?.result?.items

    photosData.forEach(data => {
      if (data.locations && data.locations.length) {
        data.locations.forEach((loc, locIndex) => {
          // console.log(loc)
          const imageMarker = document.getElementById("mapmarker-template").content.firstElementChild.cloneNode(true)

          // clone thumnail template
          const thumbnail = document.getElementById("photos-thumbnail").content.firstElementChild.cloneNode(true)

          // set thumnail node element index
          thumbnail.index = locIndex

          // apply photo id to node
          thumbnail.photoId = data.mid

          // apply year data to node
          thumbnail.year = 1999

          // forcing to display the thumbnail always in small
          thumbnail.customSizeRatio = 0.5

          imageMarker.appendChild(thumbnail)

          const gMarker = new this.google.maps.marker.AdvancedMarkerElement({
            map: this.map,
            position: { lat: loc.lat, lng: loc.lon },
            content: imageMarker,
          })

          gMarker.addListener("click", () => {
            this.hide()
          })

          this.markers.push(gMarker)
          bounds.extend({ lat: loc.lat, lng: loc.lon })
        })
      }
    })

    this.clusterer.addMarkers(this.markers)

    this.map.fitBounds(bounds)
  }
}
