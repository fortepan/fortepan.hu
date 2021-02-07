import { Controller } from "stimulus"

export default class extends Controller {
  connect() {
    this.element.imageLoader = this
    this.element.imageLoaded = false

    this.loadImage()
  }

  // load image
  set imageSrc(url) {
    this.element.src = url
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
      this.element.appendChild(this.img)
    } else {
      this.element.imageLoaded = false
      this.img.classList.remove("is-loaded")
    }

    this.img.src = this.element.imageSrc
  }
}
