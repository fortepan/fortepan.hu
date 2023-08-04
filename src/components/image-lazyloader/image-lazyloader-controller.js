import { Controller } from "@hotwired/stimulus"
import throttle from "lodash/throttle"
import { isElementInViewport } from "../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["image"]
  }

  connect() {
    this.element.imageLoader = this
    this.element.imageLoaded = false

    this.onScroll = throttle(this.onScroll, 200)

    this.initImage()
    this.onScroll()
  }

  initImage() {
    if (this.imageTarget) {
      this.src = this.imageTarget.src
      this.srcset = this.imageTarget.srcset

      this.imageTarget.removeAttribute("src")
      this.imageTarget.removeAttribute("srcset")

      this.imageTarget.addEventListener("load", () => {
        this.element.classList.remove("is-loading")
        this.element.classList.add("is-loaded")
      })

      this.imageTarget.addEventListener("error", () => {
        this.element.classList.remove("is-loading")
        this.element.classList.add("has-error")
      })
    }
  }

  onScroll() {
    if (
      !this.element.classList.contains("is-loaded") &&
      isElementInViewport(this.element, false) &&
      this.src &&
      !this.element.classList.contains("is-loading")
    ) {
      this.element.classList.add("is-loading")

      this.imageTarget.src = this.src
      if (this.srcset) this.imageTarget.srcset = this.srcset
    }
  }
}
