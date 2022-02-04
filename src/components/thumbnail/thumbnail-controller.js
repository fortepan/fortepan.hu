import { Controller } from "stimulus"

import config from "../../data/siteConfig"
import { trigger, lang, isElementInViewport } from "../../js/utils"
import photoManager from "../../js/photo-manager"
import listManager from "../../js/list-manager"
import { appState } from "../../js/app"

const THUMBNAIL_HEIGHT = 160
export default class extends Controller {
  static get targets() {
    return ["image", "container", "description", "location"]
  }

  connect() {
    // role defines if the thumbnail is loaded on the photos page or on the lists page
    // possible values (strict): [ lists | photos (default) ]
    this.role = appState("is-lists") ? "lists" : "photos"

    // add stimulus class reference to node
    this.element.photosThumbnail = this

    // apply element data & setting up loading event listeners
    this.initThumbnail()

    // load thumbnail image
    this.loadThumbnailImage()
  }

  clicked(e) {
    if (
      e &&
      e.target &&
      this.role === "lists" &&
      (e.target === this.element.querySelector(".context-menu") ||
        this.element.querySelector(".context-menu").contains(e.target))
    ) {
      // if context menu is clicked do nothing
      return
    }

    let selectedPhotoData
    let index

    if (this.role === "lists") {
      selectedPhotoData = listManager.selectPhotoById(listManager.getSelectedListId(), this.element.photoId)
      index = listManager.getSelectedPhotoIndex()

      if (!selectedPhotoData.isDataLoaded) {
        return
      }
    } else {
      selectedPhotoData = photoManager.selectPhotoById(this.element.photoId).data
      index = photoManager.getSelectedPhotoIndex()
    }

    // select thumbnail in photos list
    trigger("photos:selectThumbnail", { index })

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

  initThumbnail() {
    // applying thumbnail meta data
    const data =
      this.role === "lists"
        ? listManager.getListPhotoById(listManager.getSelectedListId(), this.element.photoId)
        : photoManager.getPhotoDataByID(this.element.photoId)

    const locationArray = [data.year, data.city, data.place]
    if (!data.city && !data.place && data.country) locationArray.push(data.country)
    this.locationTarget.textContent = locationArray.filter(Boolean).join(" · ")
    this.descriptionTarget.textContent = data.description || ""

    // event listeners and handling image loading
    if (this.role === "lists") {
      const photoData = listManager.getListPhotoById(listManager.getSelectedListId(), this.element.photoId)

      if (!photoData.isDataLoaded) {
        this.element.classList.remove("is-loading")
        this.element.classList.add("is-loaded", "no-image")
        this.containerTarget.textContent = lang("list_photo_removed")
        return
      }
    }

    this.imageTarget.addEventListener("load", () => {
      this.naturalWidth = this.imageTarget.naturalWidth
      this.naturalHeight = this.imageTarget.naturalHeight
      this.resize()

      this.element.classList.remove("is-loading")
      this.element.classList.add("is-loaded")
    })

    this.imageTarget.addEventListener("error", () => {
      this.element.classList.remove("is-loading")
      this.element.classList.add("is-failed-loading")
    })
  }

  // load thumbnail image
  loadThumbnailImage() {
    if (
      !this.element.classList.contains("is-loaded") &&
      !this.loadInitiated &&
      isElementInViewport(this.element, false)
    ) {
      const mediaId = this.element.photoId

      this.imageTarget.srcset = `${config.PHOTO_SOURCE}240/fortepan_${mediaId}.jpg 1x, ${config.PHOTO_SOURCE}480/fortepan_${mediaId}.jpg 2x`
      this.imageTarget.src = `${config.PHOTO_SOURCE}240/fortepan_${mediaId}.jpg`

      this.element.classList.add("is-loading")
      this.loadInitiated = true
    }
  }
}
