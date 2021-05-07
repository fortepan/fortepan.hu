import { Controller } from "stimulus"

import config from "../../data/siteConfig"
import { trigger } from "../../js/utils"
import photoManager from "../../js/photo-manager"
import listManager from "../../js/list-manager"

const THUMBNAIL_HEIGHT = 160
export default class extends Controller {
  static get targets() {
    return ["image", "container", "description", "location"]
  }

  connect() {
    // role defines if the thumbnail is loaded on the photos page or on the lists page
    // possible values (strict): [ lists | photos (default) ]
    const role = this.element.getAttribute("role")
    this.role = role && role === "lists" ? "lists" : "photos"

    // add stimulus class reference to node
    this.element.photosThumbnail = this

    // apply element data
    this.applyThumbnailData()

    // load thumbnail image
    this.loadThumbnailImage()
  }

  clicked() {
    let selectedPhotoData
    if (this.role === "lists") {
      selectedPhotoData = listManager.selectPhotoById(listManager.getSelectedListId(), this.element.photoId)
    } else {
      selectedPhotoData = photoManager.selectPhotoById(this.element.photoId).data
      // select thumbnail in photos list
      trigger("photos:selectThumbnail", { index: photoManager.getSelectedPhotoIndex() })
    }

    // Load photo in Carousel
    trigger("photosThumbnail:select", { data: selectedPhotoData })
  }

  // resize thumbnail when the browser window gets resized
  resize() {
    const h = window.innerWidth < 640 ? (THUMBNAIL_HEIGHT * 2) / 3 : THUMBNAIL_HEIGHT
    if (!this.naturalWidth) return
    this.containerTarget.style.height = `${h}px`
    const w = Math.min(240, (this.naturalWidth / this.naturalHeight) * h)
    this.element.style.flex = `${w}`
    this.element.style.minWidth = `${w}px`
  }

  show() {
    this.element.classList.remove("is-hidden")
    setTimeout(() => {
      this.element.classList.add("is-visible")
    }, 100)
  }

  // set thumbnail meta data
  applyThumbnailData() {
    const data =
      this.role === "lists"
        ? listManager.getListPhotoById(listManager.getSelectedListId(), this.element.photoId)
        : photoManager.getPhotoDataByID(this.element.photoId)

    const locationArray = [data.year, data.city, data.place]
    if (!data.city && !data.place && data.country) locationArray.push(data.country)
    this.locationTarget.textContent = locationArray.filter(Boolean).join(" · ")
    this.descriptionTarget.textContent = data.description || ""
  }

  // load thumbnail image
  loadThumbnailImage() {
    const mediaId = this.element.photoId

    this.imageTarget.addEventListener("load", () => {
      this.naturalWidth = this.imageTarget.naturalWidth
      this.naturalHeight = this.imageTarget.naturalHeight
      this.resize()

      this.element.classList.add("is-loaded")
    })

    this.imageTarget.addEventListener("error", () => {
      this.element.classList.add("is-failed-loading")
    })

    this.imageTarget.srcset = `${config.PHOTO_SOURCE}240/fortepan_${mediaId}.jpg 1x, ${config.PHOTO_SOURCE}480/fortepan_${mediaId}.jpg 2x`
    this.imageTarget.src = `${config.PHOTO_SOURCE}240/fortepan_${mediaId}.jpg`
  }
}
