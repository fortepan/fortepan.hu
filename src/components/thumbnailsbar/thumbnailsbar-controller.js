import { Controller } from "@hotwired/stimulus"
import throttle from "lodash/throttle"

import { numberWithCommas, trigger } from "../../js/utils"
import photoManager from "../../js/photo-manager"

export default class extends Controller {
  static get targets() {
    return ["grid", "count"]
  }

  connect() {
    this.onScroll = throttle(this.onScroll, 200)
  }

  show(e) {
    const photoData = e?.detail?.photoData

    if (photoData && photoData.length > 0) {
      // generating an id for comparison
      const id = `${photoData[0].mid}-${photoData[photoData.length - 1].mid}-${photoData.length}`

      // if the id is not set or have a different value remove & regenerate the thumbnails
      if (this?.id !== id) {
        // if photoData is given remove all thumbnails first
        this.element.querySelectorAll(".photos-thumbnail").forEach(thumb => {
          thumb.remove()
        })

        photoData.forEach((item, index) => {
          // clone thumnail template
          const thumbnail = document.getElementById("photos-thumbnail").content.firstElementChild.cloneNode(true)

          thumbnail.setAttribute(
            "data-action",
            `${thumbnail
              .getAttribute("data-action")
              .replace("click->thumbnail#clicked", "click->thumbnailsbar#onThumbnailClicked")}`
          )

          this.gridTarget.appendChild(thumbnail)

          // set thumnail node element index
          thumbnail.index = index

          // apply photo id to node
          thumbnail.photoId = item.mid

          // apply year data to node
          thumbnail.year = item.year
        })
      }

      this.selectThumbnail(photoData.findIndex(photo => e?.detail?.photoId.toString() === photo.mid.toString()))

      this.countTarget.textContent = numberWithCommas(photoData.length)

      this.element.classList.add("is-visible")
      this.loadThumbnails()

      setTimeout(() => {
        this.loadThumbnails()
      }, 400)

      this.photoData = photoData
      this.id = id
    }
  }

  // Set a thumbnail's selected state
  selectThumbnail(index = -1, scroll = true) {
    if (index !== -1) {
      this.element.querySelectorAll(".photos-thumbnail").forEach(thumb => thumb.classList.remove("is-selected"))

      this.element.querySelectorAll(".photos-thumbnail")[index]?.classList.add("is-selected")
      if (scroll) this.scrollToSelectedThumbnail()
    }
  }

  onScroll() {
    this.loadThumbnails()
  }

  loadThumbnails() {
    this.element.querySelectorAll(".photos-thumbnail:not(.is-loaded)").forEach(thumbnail => {
      if (thumbnail.photosThumbnail) {
        thumbnail.photosThumbnail.loadThumbnailImage()
      }
    })
  }

  scrollToSelectedThumbnail() {
    const thumbnail = this.element.querySelector(".photos-thumbnail.is-selected")
    if (thumbnail) this.gridTarget.scrollLeft = thumbnail.offsetLeft - 16 - 32
  }

  onThumbnailClicked(e) {
    e?.preventDefault()

    const photoId = e?.currentTarget?.photoId
    const index = this.photoData.findIndex(photo => photo.mid.toString() === photoId.toString())

    this.selectThumbnail(index, false)

    trigger("thumbnailsbar:photoSelected", { id: this.id, index, mid: photoId })

    photoManager.selectPhotoById(photoId)
    trigger("thumbnail:click", { data: this.photoData[index], dataset: this.photoData })
  }

  hide() {
    this.element.classList.remove("is-visible")

    trigger("thumbnailsbar:closed")
  }

  // create a new tag element when people hit ENTER
  keyup(e) {
    if (e.key === "Escape") {
      this.hide()
    }
  }
}
