import { Controller } from "@hotwired/stimulus"

import config from "../../data/siteConfig"
import { trigger, lang, isTouchDevice, getImgAltText, getLocale } from "../../js/utils"
import { setAppState, removeAppState, appState } from "../../js/app"
import photoManager from "../../js/photo-manager"
import listManager from "../../js/list-manager"

export default class extends Controller {
  static get targets() {
    return ["background", "pagerPrev", "pagerNext", "photo", "photos", "photosContainer"]
  }

  connect() {
    // role defines if the thumbnail is loaded on the photos page or on the lists page
    // possible values (strict): [ lists | photos (default) ]
    this.role = appState("is-lists") ? "lists" : "photos"

    this.slideshowTimeout = 0
    this.touchTimeout = 0

    this.prevPhotoId = null
    this.nextPhotoId = null

    if (isTouchDevice()) setAppState("is-touch-device")
  }

  show() {
    this.showControls(null, true)

    if (window.innerWidth < 768)
      setTimeout(() => {
        trigger("carouselSidebar:hide")
      }, 300)
    this.element.classList.add("is-visible")
  }

  hide(e) {
    // hide all photos
    this.hideAllPhotos()

    // hide dialogs
    trigger("dialogs:hide")

    // hide carousel
    this.element.classList.remove("is-visible")

    if (!e || (e && e.detail && !e.detail.silent)) {
      trigger("photosCarousel:hide")
    }
  }

  stepSlideshow() {
    // step slideshow after some delay if slideshow is playing
    if (this.slideshowIsPlaying) {
      clearTimeout(this.slideshowTimeout)
      this.slideshowTimeout = setTimeout(() => {
        this.showNextPhoto()
      }, config().CAROUSEL_SLIDESHOW_DELAY)
    }
  }

  setCarouselBackground(id) {
    if (!this.isPhotoAvailable()) {
      this.backgroundTarget.classList.remove("fade-in")
      return
    }

    this.backgroundTarget.style.backgroundImage = `url(${config().PHOTO_SOURCE}240/fortepan_${id}.jpg)`
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
      photo.dataset.action = "mouseup->carousel#onPhotoClick touchstart->carousel#onPhotoClick"
      photo.className = "image-loader carousel__photo"
      photo.id = `Fortepan-${id}`
      photo.mid = id

      const photoData =
        this.role === "lists"
          ? listManager.getListPhotoById(listManager.getSelectedListId(), id)
          : photoManager.getPhotoDataByID(id)

      photo.altText = getImgAltText(photoData)

      if (this.role === "lists" && !photoData.isDataLoaded) {
        photo.noImage = true
        photo.classList.add("image-loader--no-image", "is-active")
        photo.textContent = lang("list_photo_removed")
        this.photosTarget.appendChild(photo)

        trigger("loader:hide", { id: "loaderCarousel" })
        this.stepSlideshow()
        return
      }

      // age-restriction
      if (
        !appState("age-restriction-removed") &&
        photoData.tags &&
        photoData.tags.indexOf(config().AGE_RESTRICTION_TAG) > -1
      ) {
        photo.noImage = true
        photo.ageRestricted = true
        photo.classList.add("image-loader--no-image", "image-loader--age-restricted")

        const el = document.getElementById("age-restriction-template").content.firstElementChild.cloneNode(true)
        el.querySelector(".age-restriction__link").dataset.action = "click->carousel#showAgeRestrictionDialog"

        photo.appendChild(el)
      }

      photo.loadCallback = () => {
        trigger("loader:hide", { id: "loaderCarousel" })
        photo.classList.add("is-loaded")
        this.stepSlideshow()
      }

      this.photosTarget.appendChild(photo)
    }

    photo.classList.add("is-active")

    if (photo.imageLoaded || photo.noImage) {
      trigger("loader:hide", { id: "loaderCarousel" })
      this.stepSlideshow()

      if (photo.ageRestricted && !this.slideshowIsPlaying) {
        // open age restriction dialog
        trigger("dialogAgeRestriction:show")
      }
    } else {
      trigger("loader:show", { id: "loaderCarousel" })
      photo.imageSrc = `${config().PHOTO_SOURCE}${window.innerWidth > 1600 ? 2560 : 1600}/fortepan_${id}.jpg`
      if (photo.imageLoader) photo.imageLoader.loadImage()
    }
  }

  setPagers() {
    this.pagerPrevTarget.href =
      this.role === "lists"
        ? `/${getLocale()}/lists/${listManager.getSelectedListId()}/photos/${this.prevPhotoId}`
        : `/${getLocale()}/photos/?id=${this.prevPhotoId}`

    this.pagerNextTarget.href =
      this.role === "lists"
        ? `/${getLocale()}/lists/${listManager.getSelectedListId()}/photos/${this.nextPhotoId}`
        : `/${getLocale()}/photos/?id=${this.nextPhotoId}`

    const total =
      this.role === "lists" ? listManager.getSelectedList().photos.length : photoManager.getTotalPhotoCountInContext()

    this.pagerPrevTarget.classList.toggle("is-disabled", total === 1 || !this.prevPhotoId)
    this.pagerNextTarget.classList.toggle("is-disabled", total === 1 || !this.nextPhotoId)
  }

  async showPhoto(e, photoId) {
    const id = e && e.detail && e.detail.data ? e.detail.data.mid : photoId

    if (id) {
      if (!this.element.classList.contains("is-visible")) this.show()

      this.hideAllPhotos()
      this.hideLargePhotoView()

      trigger("loader:show", { id: "loaderCarousel" })

      // get the next and previous photo id for SEO
      // in the case of photos this will also triggering the load the previous and the next 40 photo data if needed
      // and will cause to fill the photo list in the background too
      this.prevPhotoId = this.role === "lists" ? listManager.getPrevPhotoId() : await photoManager.getPrevPhotoId()
      this.nextPhotoId = this.role === "lists" ? listManager.getNextPhotoId() : await photoManager.getNextPhotoId()

      trigger("loader:hide", { id: "loaderCarousel" })

      this.setCarouselBackground(id)
      this.loadPhoto(id)
      this.setPagers()

      trigger("carouselSidebar:init")
      trigger("dialogDownload:init")
      trigger("dialogShare:init")

      trigger("photosCarousel:photoSelected", { photoId: id })
    }
  }

  async showNextPhoto(e) {
    if (e) e.preventDefault()

    // hide dialogs
    trigger("dialogs:hide")

    let photoId
    let index

    if (this.role === "lists") {
      photoId = listManager.selectNextPhoto().id
      index = listManager.getSelectedPhotoIndex()
    } else {
      // select the next photo in the current context (or load more if neccessary)
      await photoManager.selectNextPhoto()
      photoId = photoManager.getSelectedPhotoId()
      index = photoManager.getSelectedPhotoIndex()
    }

    this.showPhoto(null, photoId)
    trigger("photos:selectThumbnail", { index })
  }

  async showPrevPhoto(e) {
    if (e) e.preventDefault()

    // hide dialogs
    trigger("dialogs:hide")

    let photoId
    let index

    if (this.role === "lists") {
      photoId = listManager.selectPrevPhoto().id
      index = listManager.getSelectedPhotoIndex()
    } else {
      // select the next previous in the current context (or load more if neccessary)
      await photoManager.selectPrevPhoto()
      photoId = photoManager.getSelectedPhotoId()
      index = photoManager.getSelectedPhotoIndex()
    }

    this.showPhoto(null, photoId)
    trigger("photos:selectThumbnail", { index })
  }

  // event listener for timeline:yearSelected
  onYearSelected(e) {
    if (this.element.classList.contains("is-visible") && e && e.detail && e.detail.year) {
      // select the first photo of a given year (or load them if neccessary)
      photoManager.getFirstPhotoOfYear(e.detail.year).then(() => {
        this.showPhoto(null, photoManager.getSelectedPhotoId())
        trigger("photos:selectThumbnail", { index: photoManager.getSelectedPhotoIndex() })
      })
    }
  }

  hideAllPhotos() {
    this.photoTargets.forEach(photo => {
      photo.classList.remove("is-active")
    })
  }

  get slideshowIsPlaying() {
    return appState("play-carousel-slideshow")
  }

  playSlideshow() {
    setAppState("play-carousel-slideshow")
    // start slideshow
    this.slideshowTimeout = setTimeout(() => {
      this.showNextPhoto()
    }, config().CAROUSEL_SLIDESHOW_DELAY)

    this.wasFullScreen = appState("carousel-fullscreen")

    this.openFullscreen()
  }

  pauseSlideshow() {
    removeAppState("play-carousel-slideshow")
    clearTimeout(this.slideshowTimeout)

    if (!this.wasFullScreen) this.closeFullscreen()
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

  get isFullscreen() {
    return appState("carousel-fullscreen")
  }

  openFullscreen() {
    setAppState("carousel-fullscreen")

    // store sidebar visibility
    this.sidebarWasHidden = appState("hide-carousel-sidebar")

    // close sidebar
    trigger("carouselSidebar:hide")

    // hide controls
    this.autoHideControls()
  }

  closeFullscreen() {
    removeAppState("carousel-fullscreen")

    // show controls
    this.showControls(null, true)

    if (!this.sidebarWasHidden) trigger("carouselSidebar:show")
    if (this.isPhotoZoomedIn) this.hideLargePhotoView()
  }

  toggleFullscreen() {
    if (this.isPhotoZoomedIn) {
      this.hideLargePhotoView()
    } else if (this.isFullscreen) {
      if (this.slideshowIsPlaying) this.pauseSlideshow()
      if (this.isFullscreen) this.closeFullscreen()
    } else {
      this.openFullscreen()
    }
  }

  isMouseRightOverControls(e) {
    if (e && (e.touches || (e.pageX && e.pageY))) {
      const targets = this.photosContainerTarget.querySelectorAll(".button-circular")
      const page = {
        x: e.touches ? e.touches[0].pageX : e.pageX,
        y: e.touches ? e.touches[0].pageY : e.pageY,
      }
      let overlap = false

      // check if mouse is over _any_ of the targets
      targets.forEach(item => {
        if (!overlap) {
          const bounds = item.getBoundingClientRect()
          if (page.x >= bounds.left && page.x <= bounds.right && page.y >= bounds.top && page.y <= bounds.bottom) {
            overlap = true
          }
        }
      })
      return overlap
    }
    return false
  }

  showControls(e, force = false) {
    if (this.element.classList.contains("is-visible") || force) {
      this.photosContainerTarget.classList.remove("hide-controls")

      clearTimeout(this.touchTimeout)

      if (!e || (e && !this.isMouseRightOverControls(e))) {
        this.touchTimeout = setTimeout(this.hideControls.bind(this), 4000)
      }
    }
  }

  hideControls(e, force = false) {
    if (this.element.classList.contains("is-visible") || force) {
      this.photosContainerTarget.classList.add("hide-controls")
    }
  }

  autoHideControls() {
    if (this.element.classList.contains("is-visible")) {
      this.showControls()
      clearTimeout(this.touchTimeout)
      this.touchTimeout = setTimeout(this.hideControls.bind(this), 2000)
    }
  }

  get isPhotoZoomedIn() {
    return appState("carousel-photo-zoomed-in")
  }

  showLargePhotoView(e) {
    if (e) e.preventDefault()

    const photo = this.photosTarget.querySelector(".image-loader.is-active.is-loaded")

    if (!photo.noImage) {
      setAppState("carousel-photo-zoomed-in")
      setAppState("disable--selection")

      if (this.slideshowIsPlaying) this.pauseSlideshow()

      photo.classList.add("is-zoomed-in")

      if (!photo.largePhoto) {
        const container = document.createElement("div")
        container.dataset.controller = "image-loader"
        container.className = "large-image-loader"
        container.altText = photo.altText

        photo.appendChild(container)
        photo.largePhoto = container
      }

      if (!photo.largePhoto.imageLoaded) {
        trigger("loader:show", { id: "loaderCarousel" })

        photo.largePhoto.imageSrc = `${config().PHOTO_SOURCE}2560/fortepan_${photo.mid}.jpg`

        photo.largePhoto.loadCallback = () => {
          photo.classList.add("large-photo-loaded")
          trigger("loader:hide", { id: "loaderCarousel" })
          this.setLargePhotoPosition()
        }

        photo.largePhoto.classList.add("is-active")
      } else {
        trigger("loader:hide", { id: "loaderCarousel" })
        this.setLargePhotoPosition()
      }
    }
  }

  hideLargePhotoView(e) {
    if (e) e.preventDefault()
    removeAppState("carousel-photo-zoomed-in")
    removeAppState("disable--selection")

    this.photoTargets.forEach(photo => {
      photo.classList.remove("is-zoomed-in")
      if (photo.largePhoto) {
        photo.largePhoto.removeAttribute("style")
      }
    })

    trigger("loader:hide", { id: "loaderCarousel" })
    this.showControls(null, true)
  }

  toggleLargePhotoView() {
    if (this.isPhotoZoomedIn) {
      this.hideLargePhotoView()
    } else {
      this.showLargePhotoView()
    }
  }

  setLargePhotoPosition(e) {
    if (e) {
      if (isTouchDevice()) {
        return
      }
      e.preventDefault()
    }

    const photo = this.photosTarget.querySelector(".image-loader.is-active.is-loaded.is-zoomed-in")

    if (photo && photo.largePhoto && photo.largePhoto.imageLoaded) {
      const bounds = photo.getBoundingClientRect()
      bounds.centerX = bounds.left + bounds.width / 2
      bounds.centerY = bounds.top + bounds.height / 2

      if (isTouchDevice()) {
        const img = {
          width: photo.largePhoto.querySelector("img").offsetWidth,
          height: photo.largePhoto.querySelector("img").offsetHeight,
        }

        photo.largePhoto.scrollTo((img.width - bounds.width) / 2, (img.height - bounds.height) / 2)
      } else {
        const m = {}
        if (e) {
          m.x = e.touches ? e.touches[0].pageX : e.pageX
          m.y = e.touches ? e.touches[0].pageY : e.pageY
        } else {
          m.x = bounds.centerX
          m.y = bounds.centerY
        }

        const img = {
          width: photo.largePhoto.offsetWidth,
          height: photo.largePhoto.offsetHeight,
        }

        photo.largePhoto.style.left = `${(bounds.width - img.width) / 2}px`
        photo.largePhoto.style.top = `${(bounds.height - img.height) / 2}px`

        const translateX =
          img.width > bounds.width
            ? ((bounds.centerX - m.x) / (bounds.width / 2)) * ((img.width - bounds.width) / img.width) * 50
            : 0
        const translateY =
          img.height > bounds.height
            ? ((bounds.centerY - m.y) / (bounds.height / 2)) * ((img.height - bounds.height) / img.height) * 50
            : 0

        photo.largePhoto.style.transform = `translate(${translateX}%, ${translateY}%)`
      }
    }
  }

  onPhotoClick(e) {
    if (e && e.currentTarget && e.currentTarget.classList.contains("image-loader--no-image")) return

    if (isTouchDevice()) {
      // only listen to touch events on touch devices (no mouseup should fire the following)
      if (e && e.type === "touchstart") {
        // if controls are hidden, on mobile the first touch should open the controls
        // (event listener is on photosContainer)
        if (!this.photosContainerTarget.classList.contains("hide-controls")) {
          if (!this.isFullscreen) {
            this.openFullscreen()
          } else if (!this.isPhotoZoomedIn) {
            this.showLargePhotoView()
          }
        }
      }
    } else if (!this.isFullscreen) {
      this.openFullscreen()
    } else {
      this.toggleLargePhotoView()
    }
  }

  onCloseClicked() {
    if (this.isPhotoZoomedIn) {
      this.hideLargePhotoView()
    } else if (this.slideshowIsPlaying || this.isFullscreen) {
      // pause slideshow if the slideshow is playing & close the fullscreen state if we are in fullscreen
      if (this.slideshowIsPlaying) this.pauseSlideshow()
      if (this.isFullscreen) this.closeFullscreen()
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

  isPhotoAvailable() {
    const photoData = this.role === "lists" ? listManager.getSelectedPhoto() : photoManager.getSelectedPhotoData()

    if (
      (this.role === "lists" && !photoData.isDataLoaded) ||
      (!appState("age-restriction-removed") &&
        photoData.tags &&
        photoData.tags.indexOf(config().AGE_RESTRICTION_TAG) > -1)
    ) {
      return false
    }

    return true
  }

  addToList() {
    if (this.isPhotoAvailable()) {
      trigger("dialogLists:show")
    }
  }

  downloadImage() {
    if (this.isPhotoAvailable()) {
      trigger("dialogDownload:show")
    }
  }

  shareImage() {
    if (this.isPhotoAvailable()) {
      trigger("dialogShare:show")
    }
  }

  showAgeRestrictionDialog(e) {
    if (e) e.preventDefault()

    trigger("dialogAgeRestriction:show")
  }

  removeAgeRestriction() {
    this.photoTargets.forEach(photo => {
      if (photo.noImage && photo.ageRestricted) {
        delete photo.noImage
        delete photo.ageRestricted

        photo.classList.remove("image-loader--no-image", "image-loader--age-restricted")
        photo.querySelector(".age-restriction").remove()

        if (photo.classList.contains("is-active")) {
          this.showPhoto(null, photo.mid)
        }
      }
    })
  }
}
