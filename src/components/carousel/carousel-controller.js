import { Controller } from "stimulus"

import config from "../../data/siteConfig"
import { trigger, getURLParams, isTouchDevice } from "../../js/utils"
import { setAppState, removeAppState, appState } from "../../js/app"
import photoManager from "../../js/photo-manager"

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
    // hide all photos
    this.hideAllPhotos()

    // hide dialogs
    trigger("dialogs:hide")

    // hide carousel
    this.element.classList.remove("is-visible")

    trigger("photosCarousel:hide")
  }

  stepSlideshow() {
    // step slideshow after some delay if slideshow is playing
    if (this.slideshowIsPlaying) {
      clearTimeout(this.slideshowTimeout)
      this.slideshowTimeout = setTimeout(() => {
        this.showNextPhoto()
      }, config.CAROUSEL_SLIDESHOW_DELAY)
    }
  }

  setCarouselBackground(id) {
    this.backgroundTarget.style.backgroundImage = `url(${config.PHOTO_SOURCE}240/fortepan_${id}.jpg)`
    this.backgroundTarget.classList.remove("fade-in")
    setTimeout(() => {
      this.backgroundTarget.classList.add("fade-in")
    }, 20)
  }

  loadPhoto(id) {
    let photo = this.element.querySelector(`#Fortepan-${id}`)
    if (!photo) {
      photo = document.createElement("div")
      photo.dataset.controller = "image-loader"
      photo.setAttribute("data-carousel-target", "photo")
      photo.className = "image-loader"
      photo.id = `Fortepan-${id}`

      photo.imageSrc = `${config.PHOTO_SOURCE}1600/fortepan_${id}.jpg`
      photo.loadCallback = () => {
        trigger("loader:hide", { id: "loaderCarousel" })
        this.stepSlideshow()
      }

      photo.classList.add("is-active")
      trigger("loader:show", { id: "loaderCarousel" })

      this.photosTarget.appendChild(photo)
    } else if (photo.imageLoaded) {
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

  showPhoto(e, photoId) {
    const id = e && e.detail && e.detail.data ? e.detail.data.mid : photoId

    if (id) {
      this.hideAllPhotos()
      this.setCarouselBackground(id)
      this.loadPhoto(id)
      this.togglePager()
      this.showControls(null, true)

      trigger("carouselSidebar:init")
      trigger("dialogDownload:init")
      trigger("dialogShare:init")
      trigger("photosCarousel:show")
    }
  }

  showNextPhoto() {
    // select the next photo in the current context (or load more if neccessary)
    photoManager.selectNextPhoto().then(() => {
      this.showPhoto(null, photoManager.getSelectedPhotoId())
      trigger("photos:selectThumbnail", { index: photoManager.getSelectedPhotoIndex() })
    })
  }

  showPrevPhoto() {
    // select the next previous in the current context (or load more if neccessary)
    photoManager.selectPrevPhoto().then(() => {
      this.showPhoto(null, photoManager.getSelectedPhotoId())
    })
  }

  // event listener for timeline:yearSelected
  selectPhotoByYear(e) {
    if (e && e.detail && e.detail.year) {
      // select the first photo of a given year (or load them if neccessary)
      photoManager.selectFirstPhotoOfYear(e.detail.year).then(() => {
        this.showPhoto(null, photoManager.getSelectedPhotoId())
        // trigger("photos:selectThumbnail", { index: photoManager.getSelectedPhotoIndex() })
      })
    }
  }

  hideAllPhotos() {
    this.photoTargets.forEach(photo => {
      photo.classList.remove("is-active")
    })
  }

  pauseSlideshow() {
    removeAppState("play-carousel-slideshow")

    if (!this.sidebarIsHidden) trigger("carouselSidebar:show")
    clearTimeout(this.slideshowTimeout)
  }

  get slideshowIsPlaying() {
    return appState("play-carousel-slideshow")
  }

  get sidebarIsHidden() {
    return appState("hide-carousel-sidebar")
  }

  playSlideshow() {
    setAppState("play-carousel-slideshow")

    // store sidebar visibility
    trigger("carouselSidebar:hide")

    // start slideshow
    this.slideshowTimeout = setTimeout(() => {
      this.showNextPhoto()
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

  onCloseClicked() {
    // pause slideshow if the slideshow is playing
    if (this.slideshowIsPlaying) {
      this.pauseSlideshow()
    } else {
      this.hide()
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
        this.onCloseClicked()
        break
      case " ":
        this.toggleSlideshow()
        break
      case "ArrowLeft":
        this.showPrevPhoto()
        break
      case "ArrowRight":
        this.showNextPhoto()
        break
      default:
    }
  }

  downloadImage() {
    trigger("dialogDownload:show")
  }

  shareImage() {
    trigger("dialogShare:show")
  }
}
