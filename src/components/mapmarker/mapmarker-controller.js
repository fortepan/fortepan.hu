import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static get targets() {
    return ["counter", "prev", "next"]
  }

  connect() {
    this.init()

    this.thumbnails = []
  }

  createThumbnail(data) {
    // clone thumbnail template
    const thumbnail = document.getElementById("photos-thumbnail").content.firstElementChild.cloneNode(true)

    // set thumnail node element index
    // thumbnail.index = i
    thumbnail.photoId = data.mid

    // apply year data to node
    thumbnail.year = data.year

    // forcing to display the thumbnail always in small
    thumbnail.customSizeRatio = 0.5

    // omit viewport check for loading the image
    thumbnail.forceImageLoad = true

    if (!this.thumbnails) this.thumbnails = []

    this.thumbnails.push({ mid: data.mid, element: thumbnail })

    return thumbnail
  }

  init() {
    if (!this.ready) {
      if (this.element.data.length) {
        // group
        this.currentIndex = 0
        this.counterTarget.textContent = this.element.data.length
      }

      this.selectPhoto(0)

      this.ready = true
    }
  }

  onNextClick() {
    this.currentIndex = Math.min(this.element.data.length - 1, this.currentIndex + 1)
    this.selectPhoto(this.currentIndex)
  }

  onPrevClick() {
    this.currentIndex = Math.max(0, this.currentIndex - 1)
    this.selectPhoto(this.currentIndex)
  }

  selectPhoto(index) {
    const data = this.element.data.length ? this.element.data[index] : this.element.data

    let thumbnail = this.thumbnails?.find(thumb => {
      return thumb.mid.toString() === data.mid.toString()
    })?.element

    if (!thumbnail) thumbnail = this.createThumbnail(data)

    this.element.querySelector(".mapmarker__thumbnail-wrapper").innerHTML = ""
    this.element.querySelector(".mapmarker__thumbnail-wrapper").appendChild(thumbnail)

    this.nextTarget.classList.toggle("is-disabled", index === this.element.data.length - 1)
    this.prevTarget.classList.toggle("is-disabled", index === 0)
  }

  onMouseOver() {
    this.element.parentElement.style.zIndex = 9999
  }

  onMouseOut() {
    this.element.parentElement.style.removeProperty("z-index")
  }
}
