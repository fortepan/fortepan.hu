import { Controller } from "@hotwired/stimulus"
import { getURLParams } from "../../js/utils"
import { removeAppState, setAppState } from "../../js/app"

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
   * Carousel view has custom pinch zoom handling via carousel-controller
   *
   * Event listeners are attached via data-action in the base.liquid template
   */
  shouldAllowCustomCarouselGesture() {
    const carousel = document.querySelector(".carousel")
    const isCarouselVisible = carousel?.classList?.contains("is-visible")
    return !!isCarouselVisible
  }

  onDocumentTouchMove(e) {
    if (e.touches.length > 1 && !this.shouldAllowCustomCarouselGesture()) {
      e.preventDefault()
    }
  }

  onDocumentGestureChange(e) {
    // Prevent zoom on gesturechange (iOS)
    if (!this.shouldAllowCustomCarouselGesture()) {
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
