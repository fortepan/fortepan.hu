import { Controller } from "@hotwired/stimulus"
import { formatNumber, trigger } from "../../js/utils"

const MARKER_PHOTO_LIMIT = 150

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
      // element properties:
      // - isESCluster
      // - containsESCluster
      // - isGroup

      if (this.element.isESCluster) {
        // cluster
        this.counterTarget.textContent = formatNumber(this.element.data.doc_count || this.element.counter)
        this.setId = this.element.id.replace("marker-", "") || `${this.element.data.key}`
      } else if (this.element.isGroup) {
        // group
        this.currentIndex = 0
        this.counterTarget.textContent = formatNumber(this.element.counter)

        this.setId =
          this.element.id.replace("marker-", "") ||
          `${this.element.data[0].mid}-${this.element.data[this.element.data.length - 1].mid}-${
            this.element.data.length
          }`
      } else {
        this.setId = this.element.id.replace("marker-", "") || `${this.element.data.mid}}`
      }

      if (
        this.element.isESCluster ||
        this.element.containsESCluster ||
        (this.element.isGroup && this.element.counter > MARKER_PHOTO_LIMIT)
      ) {
        // if the marker is an ES cluster, or a group contains an ES cluster, or a group with too many photos
        // we don't render the thumbnails
        this.element.classList.add("is-over-limit")
      } else {
        const thumbnails = document
          .getElementById("mapmarker-thumbnails-template")
          .content.firstElementChild.cloneNode(true)
        this.element.prepend(thumbnails)

        this.selectPhoto(null, 0)
      }

      this.ready = true
    }
  }

  onNextClick(e) {
    e?.preventDefault()

    const index = this.currentIndex + 1 > this.element.data.length - 1 ? 0 : this.currentIndex + 1

    this.selectPhoto(null, index)

    if (this.element.classList.contains("is-selected")) {
      trigger("mapmarker:photoSelected", { photoId: this.element.data[index].mid, photoData: this.element.data })
    }
  }

  onPrevClick(e) {
    e?.preventDefault()

    const index = this.currentIndex - 1 < 0 ? this.element.data.length - 1 : this.currentIndex - 1

    this.selectPhoto(null, index)

    if (this.element.classList.contains("is-selected")) {
      trigger("mapmarker:photoSelected", { photoId: this.element.data[index].mid, photoData: this.element.data })
    }
  }

  selectPhoto(e, i) {
    if (
      (e && e.detail?.setId !== this.setId) ||
      this.element.data.length > MARKER_PHOTO_LIMIT ||
      this.element.data.doc_count
    )
      return

    let index

    if (e?.detail?.index > -1 && e?.detail?.setId === this.setId) {
      index = e.detail.index
      document.querySelectorAll(".mapmarker").forEach(marker => marker.classList.remove("is-selected"))
      this.element.classList.add("is-selected")
    } else {
      index = i
    }

    const data = this.element.data.length ? this.element.data[index] : this.element.data

    let thumbnail = this.thumbnails?.find(thumb => {
      return thumb.mid.toString() === data.mid.toString()
    })?.element

    if (!thumbnail) thumbnail = this.createThumbnail(data)

    const thumbnailWrapper = this.element.querySelector(".mapmarker__thumbnail-wrapper")
    thumbnailWrapper.innerHTML = ""
    thumbnailWrapper.appendChild(thumbnail)

    this.currentIndex = index
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

    trigger("mapmarker:photoSelected", {
      photoId: e?.currentTarget?.photoId,
      photoData: this.element.data,
      setId: this.setId,
    })
  }

  onCarouselPhotoSelected(e) {
    if (e?.detail?.setId === this.setId && this.element.classList.contains("is-selected")) {
      this.selectPhoto(null, e.detail?.index)
    }
  }
}
