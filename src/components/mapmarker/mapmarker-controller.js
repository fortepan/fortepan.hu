import { Controller } from "@hotwired/stimulus"
import { trigger } from "../../js/utils"

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

    thumbnail.setAttribute(
      "data-action",
      `${thumbnail
        .getAttribute("data-action")
        .replace("click->thumbnail#clicked", "click->mapmarker#onThumbnailClicked")}`
    )

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

      this.id = this.element.id

      this.selectPhoto(null, 0)

      this.ready = true
    }
  }

  onNextClick(e) {
    e?.preventDefault()

    this.selectPhoto(null, this.currentIndex + 1 > this.element.data.length - 1 ? 0 : this.currentIndex + 1)
  }

  onPrevClick(e) {
    e?.preventDefault()

    this.selectPhoto(null, this.currentIndex - 1 < 0 ? this.element.data.length - 1 : this.currentIndex - 1)
  }

  selectPhoto(e, i) {
    if (e && e?.detail?.id !== this.id) return

    let index

    if (e?.detail?.index > -1 && e?.detail?.id === this.id) {
      index = e.detail.index
      document.querySelectorAll(".mapmarker").forEach(marker => marker.classList.remove("is-selected"))
      this.element.classList.add("is-selected")
    } else {
      index = i
    }

    this.currentIndex = index

    const data = this.element.data.length ? this.element.data[index] : this.element.data

    let thumbnail = this.thumbnails?.find(thumb => {
      return thumb.mid.toString() === data.mid.toString()
    })?.element

    if (!thumbnail) thumbnail = this.createThumbnail(data)

    this.element.querySelector(".mapmarker__thumbnail-wrapper").innerHTML = ""
    this.element.querySelector(".mapmarker__thumbnail-wrapper").appendChild(thumbnail)

    this.nextTarget.classList.toggle("is-disabled", index === this.element.data.length - 1)
    this.prevTarget.classList.toggle("is-disabled", index === 0)

    if (this.element.classList.contains("is-selected")) {
      trigger("mapmarker:photoSelected", { photoId: data.mid, photoData: this.element.data })
    }
  }

  onMouseOver() {
    this.element.parentElement.style.zIndex = 9999
  }

  onMouseOut() {
    this.element.parentElement.style.removeProperty("z-index")
  }

  onThumbnailClicked(e) {
    e?.preventDefault()

    document.querySelectorAll(".mapmarker").forEach(marker => marker.classList.remove("is-selected"))
    this.element.classList.add("is-selected")

    trigger("mapmarker:photoSelected", { photoId: e?.currentTarget?.photoId, photoData: this.element.data })
  }
}
