import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.element.imageLoader = this
    this.element.imageLoaded = false

    this.loadImage()
  }

  loadImage() {
    if (!this.img) {
      this.img = new Image()
      this.img.addEventListener("load", () => {
        this.element.imageLoaded = true
        this.img.classList.add("is-loaded")

        if (this.element.classList.contains("is-active")) {
          if (typeof this.element.loadCallback === "function") this.element.loadCallback(this)
        }
      })

      if (this.element.altText) {
        this.img.alt = this.element.altText
      }

      this.element.appendChild(this.img)
    } else {
      this.element.imageLoaded = false
      this.img.classList.remove("is-loaded")
    }

    if (this.element.imageSrc) {
      this.img.src = this.element.imageSrc
    }
  }
}
