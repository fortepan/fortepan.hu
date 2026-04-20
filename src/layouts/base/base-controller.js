import { Controller } from "@hotwired/stimulus"
import { getURLParams } from "../../js/utils"
import { removeAppState, setAppState, appState } from "../../js/app"

export default class extends Controller {
  static get targets() {
    return []
  }

  connect() {
    // check for BE dev status
    this.checkDevStatus()
  }

  /**
   * Global pinch zoom prevention
   * Prevents browser default pinch-to-zoom on all pages
   * Photos page will have custom pinch zoom handling via photos-controller
   *
   * Event listeners are attached via data-action in the base.liquid template
   */
  onDocumentTouchMove(e) {
    // Allow pinch only if we're on photos page and not zoomed into a photo
    const isPhotosPage = appState("photos")
    const isPhotoZoomed = appState("carousel-photo-zoomed-in")

    if (e.touches.length > 1) {
      // If we're on photos page and not already zoomed, allow pinch for our custom handler
      if (!(isPhotosPage && !isPhotoZoomed)) {
        e.preventDefault()
      }
    }
  }

  onDocumentGestureChange(e) {
    // Prevent zoom on gesturechange (iOS)
    const isPhotosPage = appState("photos")
    const isPhotoZoomed = appState("carousel-photo-zoomed-in")

    if (!(isPhotosPage && !isPhotoZoomed)) {
      e.preventDefault()
    }
  }

  checkDevStatus() {
    const params = getURLParams()

    if (params.dev && params.dev === "1") {
      localStorage.setItem("isDev", 1)
    }

    if (params.dev && params.dev === "0") {
      localStorage.removeItem("isDev")
    }

    if (localStorage.getItem("isDev")) {
      setAppState("is-dev")
    } else {
      removeAppState("is-dev")
    }
  }
}
