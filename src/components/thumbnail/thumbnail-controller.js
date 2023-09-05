import { Controller } from "stimulus"

import config from "../../data/siteConfig"
import { trigger, lang, isElementInViewport, getLocale, getImgAltText, photoRes, yrStr } from "../../js/utils"
import photoManager from "../../js/photo-manager"
import listManager from "../../js/list-manager"
import { appState } from "../../js/app"

const THUMBNAIL_HEIGHT = 160
export default class extends Controller {
  static get targets() {
    return ["link", "image", "container", "description", "location"]
  }

  connect() {
    // role defines if the thumbnail is loaded on the photos page or on the lists page
    // possible values (strict): [ lists | photos (default) ]
    this.role = appState("is-lists") ? "lists" : "photos"

    // add stimulus class reference to node
    this.element.photosThumbnail = this
    // console.log(this.element.photosThumbnail, 'photosthumb')
    this.linkTarget.addEventListener("click", e => {
      if (e) e.preventDefault()
    })

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

    if (this.element.classList.contains("age-restricted")) {
      // if age-restricted do nothing
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
    const w = Math.min(240, (this.naturalWidth / this.naturalHeight) * h)

    this.containerTarget.style.height = `${h}px`

    this.element.style.flex = `${w}`
    this.element.style.minWidth = `${w}px`
    this.element.classList.toggle(
      "img-fit-contain",
      h > this.naturalHeight && this.naturalWidth / this.naturalHeight > 16 / 9
    )
  }

  initThumbnail() {
    // applying thumbnail meta data
    const data =
      this.role === "lists"
        ? listManager.getListPhotoById(listManager.getSelectedListId(), this.element.photoId)
        : photoManager.getPhotoDataByID(this.element.photoId)

    this.linkTarget.href =
      this.role === "lists"
        ? `/${getLocale()}/lists/${listManager.getSelectedListId()}/photos/${this.element.photoId}`
        : `/${getLocale()}/photos/?id=${this.element.photoId}`

    const locationArray = [yrStr(data.year), data.city, data.place]
    if (!data.city && !data.place && data.country) locationArray.push(data.country)
    this.locationTarget.textContent = locationArray.filter(Boolean).join(" · ")
    this.descriptionTarget.textContent = data.description || ""

    this.imageTarget.alt = getImgAltText(data)

    // fading the thumbnail in after displaying it
    Promise.resolve(true).then(() => {
      this.element.classList.add("is-visible")
    })

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

    // age-restriction
    if (!appState("age-restriction-removed") && data.tags && data.tags.indexOf(config.AGE_RESTRICTION_TAG) > -1) {
      this.element.classList.remove("is-loading")
      this.element.classList.add("is-loaded", "no-image", "age-restricted")
      const el = document.getElementById("age-restriction-template").content.firstElementChild.cloneNode(true)
      el.querySelector(".age-restriction__link").dataset.action = "click->thumbnail#showAgeRestrictionDialog"
      this.containerTarget.appendChild(el)
    }

    this.imageTarget.addEventListener("load", () => {
      this.naturalWidth = this.imageTarget.naturalWidth
      this.naturalHeight = this.imageTarget.naturalHeight
      this.resize()

      this.element.classList.remove("is-loading")
      this.element.classList.add("is-loaded")

      trigger("thumbnail:loaded")
    })

    this.imageTarget.addEventListener("error", () => {
      this.element.classList.remove("is-loading")
      this.element.classList.add("is-failed-loading")

      trigger("thumbnail:loaded")
    })
  }

  // load thumbnail image
  loadThumbnailImage() {
    if (
      !this.element.classList.contains("is-loaded") &&
      !this.loadInitiated &&
      isElementInViewport(this.element, false)
    ) {
      const mediaId = this.element.photo
      const photoRes240 = photoRes(240, mediaId);
      const photoRes480 = photoRes(480, mediaId);
      this.imageTarget.srcset = `${photoRes240} 1x, ${photoRes480} 2x`
      this.imageTarget.src = `${photoRes240}`

      this.element.classList.add("is-loading")
      this.loadInitiated = true
    }
  }

  showAgeRestrictionDialog(e) {
    if (e) e.preventDefault()

    trigger("dialogAgeRestriction:show")
  }

  removeAgeRestriction() {
    if (this.element.classList.contains("age-restricted")) {
      this.element.classList.remove("is-loaded", "no-image", "age-restricted")
      this.containerTarget.querySelector(".age-restriction").remove()
      this.loadThumbnailImage()
    }
  }
}
