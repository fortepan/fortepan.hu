import { Controller } from "stimulus"

import config from "../../data/siteConfig"
import { trigger, getURLParams, isTouchDevice } from "../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["background", "pager", "photo", "photos", "photosContainer"]
  }

  connect() {
    this.slideshowTimeout = 0
    this.touchTimeout = 0
  }

  show() {
    if (isTouchDevice() && !this.element.classList.contains("is-visible")) {
      this.autoHideControls()
    }
    if (window.innerWidth < 768)
      setTimeout(() => {
        trigger("carouselSidebar:hide")
      }, 300)
    this.element.classList.add("is-visible")
  }

  hide() {
    // pause slideshow if the slideshow is playing
    if (this.slideshowIsPlaying) {
      this.pauseSlideshow()
    } else {
      // hide all photos
      this.hideAllPhotos()

      // hide dialogs
      trigger("dialogs:hide")

      // hide carousel
      this.element.classList.remove("is-visible")

      // load all photos if there's only one photo loaded in the carousel
      if (!(document.querySelectorAll(".photos-thumbnail").length > 1) && getURLParams().id > 0) {
        trigger("layoutPhotos:historyPushState", { url: "?q=", resetPhotosGrid: true })
      }
    }
  }

  stepSlideshow() {
    // step slideshow after some delay if slideshow is playing
    if (this.slideshowIsPlaying) {
      clearTimeout(this.slideshowTimeout)
      this.slideshowTimeout = setTimeout(() => {
        trigger("layoutPhotos:showNextPhoto")
      }, config.CAROUSEL_SLIDESHOW_DELAY)
    }
  }

  get selectedThumbnail() {
    return document.querySelector(".photos-thumbnail.is-selected")
  }

  setCarouselBackground() {
    this.backgroundTarget.style.backgroundImage = `url(${this.selectedThumbnail.querySelector("img").currentSrc})`
    this.backgroundTarget.classList.remove("fade-in")
    setTimeout(() => {
      this.backgroundTarget.classList.add("fade-in")
    }, 20)
  }

  loadPhoto() {
    const id = this.selectedThumbnail.itemData.mid
    let photo = this.element.querySelector(`#Fortepan-${id}`)
    if (!photo) {
      photo = document.createElement("carousel-photo")
      photo.id = `Fortepan-${id}`
      photo.imageSrc = `${config.PHOTO_SOURCE}1600/fortepan_${id}.jpg`
      photo.dataset.photosCarouselTarget = "photo"
      photo.classList.add("is-active")
      trigger("loader:show", { id: "loaderCarousel" })
      photo.loadCallback = () => {
        trigger("loader:hide", { id: "loaderCarousel" })
        this.stepSlideshow()
      }
      this.photosTarget.appendChild(photo)
    } else if (photo.loaded) {
      trigger("loader:hide", { id: "loaderCarousel" })
      photo.classList.add("is-active")
    } else {
      trigger("loader:show", { id: "loaderCarousel" })
    }
  }

  togglePager() {
    // keep pager disabled if there's only one photo thumbnail in the photos list
    this.pagerTargets.forEach(pager => {
      pager.classList.toggle("disable", document.querySelectorAll(".photos-thumbnail").length === 1)
    })
  }

  showPhoto() {
    this.hideAllPhotos()
    this.setCarouselBackground()
    this.loadPhoto()
    this.togglePager()
    this.showControls(null, true)

    document.querySelector(".carousel-sidebar").bindData = this.currentImageMeta
    // document.querySelector(".dialog-download").bindData = this.currentImageMeta
    // document.querySelector(".dialog-share").bindData = this.currentImageMeta
    trigger("carouselSidebar:init")
    trigger("dialogDownload:init")
    trigger("dialogShare:init")
    trigger("photosCarousel:show")
  }

  showNextPhoto() {
    trigger("layoutPhotos:showNextPhoto")
  }

  showPrevPhoto() {
    trigger("layoutPhotos:showPrevPhoto")
  }

  hideAllPhotos() {
    this.photoTargets.forEach(photo => {
      photo.classList.remove("is-active")
    })
  }

  pauseSlideshow() {
    document.querySelector("body").classList.remove("play-carousel-slideshow")

    if (!this.sidebarIsHidden) trigger("carouselSidebar:show")
    clearTimeout(this.slideshowTimeout)
  }

  get slideshowIsPlaying() {
    return document.querySelector("body").classList.contains("play-carousel-slideshow")
  }

  get sidebarIsHidden() {
    return document.querySelector("body").classList.contains("hide-carousel-sidebar")
  }

  playSlideshow() {
    document.querySelector("body").classList.add("play-carousel-slideshow")

    // store sidebar visibility
    trigger("carouselSidebar:hide")

    // start slideshow
    this.slideshowTimeout = setTimeout(() => {
      trigger("layoutPhotos:showNextPhoto")
    }, config.CAROUSEL_SLIDESHOW_DELAY)
  }

  toggleSlideshow() {
    if (this.slideshowIsPlaying) {
      this.pauseSlideshow()
    } else {
      this.playSlideshow()
    }
  }

  toggleSidebar() {
    trigger("carouselSidebar:toggle")
  }

  showControls(e, force = false) {
    if (this.slideshowIsPlaying || force) {
      this.photosContainerTarget.classList.remove("hide-controls")
    }
  }

  hideControls(e, force = false) {
    if (this.slideshowIsPlaying || force) {
      this.photosContainerTarget.classList.add("hide-controls")
    }
  }

  autoHideControls() {
    if (this.slideshowIsPlaying) {
      this.showControls()
      clearTimeout(this.touchTimeout)
      this.touchTimeout = setTimeout(this.hideControls.bind(this), 4000)
    }
  }

  // bind key events
  boundKeydownListener(e) {
    // if carousel is not visible then keyboard actions shouldn't work
    if (!this.element.classList.contains("is-visible")) return

    // if an input is in focused state, keyboard actions shouldn't work
    const { activeElement } = document
    const inputs = ["input", "select", "button", "textarea"]
    if (activeElement && inputs.indexOf(activeElement.tagName.toLowerCase()) !== -1) return

    switch (e.key) {
      case "Escape":
        trigger("photosCarousel:hide")
        break
      case " ":
        this.toggleSlideshow()
        break
      case "ArrowLeft":
        trigger("layoutPhotos:showPrevPhoto")
        break
      case "ArrowRight":
        trigger("layoutPhotos:showNextPhoto")
        break
      default:
    }
  }
}
