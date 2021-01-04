import { isTouchDevice } from "../../js/utils"

class CarouselPhoto extends HTMLElement {
  connectedCallback() {
    this.imgLoaded = false
    this.classList.add("carousel-photo")

    this.render()
    // this.bindEvents()
  }

  // set callback
  set loadCallback(callback) {
    this.callback = callback
  }

  // load image
  set imageSrc(url) {
    this.src = url
  }

  get loaded() {
    return this.imgLoaded
  }

  render() {
    this.img = new Image()
    this.img.addEventListener(
      "load",
      function() {
        this.imgLoaded = true
        this.img.classList.add("is-loaded")

        if (this.classList.contains("is-active")) {
          if (typeof this.callback === "function") this.callback(this)
        }
      }.bind(this)
    )
    this.appendChild(this.img)
    this.img.src = this.src
  }

  bindEvents() {
    if (isTouchDevice()) {
      // on touch screens
      this.img.addEventListener("touchstart", this.onDragStart)
      this.img.addEventListener("touchend", this.onDragEnd)
      this.img.addEventListener("touchmove", this.onDragMove)
    } else {
      // non-touch screens
      this.img.addEventListener("mousedown", this.onDragStart)
      this.img.addEventListener("mousemove", this.onDragMove)
      this.img.addEventListener("mouseup", this.onDragEnd)
    }
  }

  onDragStart(e) {
    dragPointerStartX = e.touches ? e.touches[0].clientX : e.clientX
    dragPointerDeltaX = 0
    dragWrapperStartX = getTranslateXY(photosWrapper).x
    photosWrapper.classList.add("dragged")
    window.addEventListener("mouseup", onDragEnd)
  }

  onDragEnd(e) {
    photosWrapper.classList.remove("dragged")
    window.removeEventListener("mouseup", onDragEnd)
    movePhoto()
  }

  onDragMove(e) {
    if (e.curren.classList.contains("dragged")) {
      const dragPointerActX = e.touches ? e.touches[0].clientX : e.clientX
      dragPointerDeltaX = dragPointerActX - dragPointerStartX
      translateElement(photosWrapper, dragWrapperStartX + dragPointerDeltaX)

      // check if photo is loaded
      // const galleryBounds = gallery.getBoundingClientRect()
    }
  }
}

window.customElements.define("carousel-photo", CarouselPhoto)
