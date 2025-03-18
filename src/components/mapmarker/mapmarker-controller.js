import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static get targets() {
    return ["counter"]
  }

  connect() {
    this.init()
  }

  init() {
    if (!this.ready) {
      // clone thumbnail template
      const thumbnail = document.getElementById("photos-thumbnail").content.firstElementChild.cloneNode(true)

      // set thumnail node element index
      // thumbnail.index = i

      thumbnail.photoId = this.element.data.mid

      // apply year data to node
      thumbnail.year = this.element.data.year

      // forcing to display the thumbnail always in small
      thumbnail.customSizeRatio = 0.5

      // omit viewport check for loading the image
      thumbnail.forceImageLoad = true

      this.element.querySelector(".mapmarker__thumbnail-wrapper").appendChild(thumbnail)

      if (this.element.isGroup) this.counterTarget.textContent = this.element.count

      this.ready = true
    }
  }
}
