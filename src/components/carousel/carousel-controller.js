import { Controller } from "stimulus"

import config from "../../data/siteConfig"
import { trigger, lang } from "../../js/utils"
import { setAppState, removeAppState, appState } from "../../js/app"
import photoManager from "../../js/photo-manager"
import listManager from "../../js/list-manager"

export default class extends Controller {
  static get targets() {
    return ["background", "pager", "photo", "photos", "photosContainer"]
  }

  connect() {
    // role defines if the thumbnail is loaded on the photos page or on the lists page
    // possible values (strict): [ lists | photos (default) ]
    this.role = appState("is-lists") ? "lists" : "photos"

    this.slideshowTimeout = 0
    this.touchTimeout = 0
  }

  show() {
    // TODO: remove when feature/lists is live
    if (!localStorage.getItem("lists")) {
      const button = this.element.querySelector(".add-to-list-button")
      if (button) button.remove()
    }

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
      }, config.CAROUSEL_SLIDESHOW_DELAY)
    }
  }

  setCarouselBackground(id) {
    if (this.role === "lists") {
      const photoData = listManager.getListPhotoById(listManager.getSelectedListId(), id)

      if (!photoData.isDataLoaded) {
        this.backgroundTarget.classList.remove("fade-in")
        return
      }
    }

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
      photo.dataset.action =
        "mouseup->carousel#onPhotoClick touchstart->carousel#onPhotoClick touchend->carousel#hideLargePhotoView"
      photo.className = "image-loader"
      photo.id = `Fortepan-${id}`
      photo.mid = id

      if (this.role === "lists") {
        const photoData = listManager.getListPhotoById(listManager.getSelectedListId(), id)

        if (!photoData.isDataLoaded) {
          photo.noImage = true
          photo.classList.add("image-loader--no-image", "is-active")
          photo.textContent = lang("list_photo_removed")
          this.photosTarget.appendChild(photo)

          trigger("loader:hide", { id: "loaderCarousel" })
          this.stepSlideshow()
          return
        }
      }

      photo.imageSrc = `${config.PHOTO_SOURCE}1600/fortepan_${id}.jpg`
      photo.loadCallback = () => {
        trigger("loader:hide", { id: "loaderCarousel" })
        photo.classList.add("is-loaded")
        this.stepSlideshow()
      }

      photo.classList.add("is-active")
      trigger("loader:show", { id: "loaderCarousel" })

      this.photosTarget.appendChild(photo)
    } else if (photo.imageLoaded || photo.noImage) {
      photo.classList.add("is-active")
      trigger("loader:hide", { id: "loaderCarousel" })
      this.stepSlideshow()
    } else {
      trigger("loader:show", { id: "loaderCarousel" })
    }
  }

  togglePager() {
    const total =
      this.role === "lists" ? listManager.getSelectedList().photos.length : photoManager.getTotalPhotoCountInContext()
    // keep pager disabled if there's only one photo thumbnail in the photos list
    this.pagerTargets.forEach(pager => {
      pager.classList.toggle("disable", total === 1)
    })
  }

  showPhoto(e, photoId) {
    const id = e && e.detail && e.detail.data ? e.detail.data.mid : photoId

    if (id) {
      this.hideAllPhotos()
      this.hideLargePhotoView()
      this.setCarouselBackground(id)
      this.loadPhoto(id)
      this.togglePager()

      trigger("carouselSidebar:init")
      trigger("dialogDownload:init")
      trigger("dialogShare:init")

      if (!this.element.classList.contains("is-visible")) {
        this.show()
      }

      trigger("photosCarousel:photoSelected", { photoId: id })
    }
  }

  async showNextPhoto() {
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

  async showPrevPhoto() {
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
    }, config.CAROUSEL_SLIDESHOW_DELAY)

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
    if (this.isFullscreen) {
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

      if (this.slideshowIsPlaying) this.pauseSlideshow()

      photo.classList.add("is-zoomed-in")

      if (!photo.largePhoto) {
        const container = document.createElement("div")
        container.dataset.controller = "image-loader"
        container.className = "large-image-loader"

        photo.appendChild(container)
        photo.largePhoto = container
      }

      if (!photo.largePhoto.imageLoaded) {
        trigger("loader:show", { id: "loaderCarousel" })

        // photo.largePhoto.imageSrc = `${config.PHOTO_SOURCE_LARGE}${photo.mid}.jpg`
        photo.largePhoto.imageSrc = `${config.PHOTO_SOURCE}1600/fortepan_${photo.mid}.jpg`

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

    this.photoTargets.forEach(photo => {
      photo.classList.remove("is-zoomed-in")
      if (photo.largePhoto) {
        photo.largePhoto.removeAttribute("style")
      }
    })

    trigger("loader:hide", { id: "loaderCarousel" })
  }

  toggleLargePhotoView() {
    if (this.isPhotoZoomedIn) {
      this.hideLargePhotoView()
    } else {
      this.showLargePhotoView()
    }
  }

  setLargePhotoPosition(e) {
    const photo = this.photosTarget.querySelector(".image-loader.is-active.is-loaded.is-zoomed-in")

    if (photo && photo.largePhoto && photo.largePhoto.imageLoaded) {
      const bounds = photo.getBoundingClientRect()
      bounds.centerX = bounds.left + bounds.width / 2
      bounds.centerY = bounds.top + bounds.height / 2

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

      photo.largePhoto.style.left = `${0 - img.width / 2 + bounds.width / 2}px`
      photo.largePhoto.style.top = `${0 - img.height / 2 + bounds.height / 2}px`

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

  onPhotoClick(e) {
    if (e && e.currentTarget && e.currentTarget.classList.contains("image-loader--no-image")) return

    if (!this.isFullscreen) {
      this.openFullscreen()
    } else if (e && e.type === "touchstart") {
      this.showLargePhotoView()
    } else {
      this.toggleLargePhotoView()
    }
  }

  onCloseClicked() {
    // pause slideshow if the slideshow is playing & close the fullscreen state if we are in fullscreen
    if (this.slideshowIsPlaying || this.isFullscreen) {
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

  addToList() {
    if (this.role === "lists" && listManager.getSelectedPhoto() && !listManager.getSelectedPhoto().isDataLoaded) return
    trigger("dialogLists:show")
  }

  downloadImage() {
    if (this.role === "lists" && listManager.getSelectedPhoto() && !listManager.getSelectedPhoto().isDataLoaded) return
    trigger("dialogDownload:show")
  }

  shareImage() {
    if (this.role === "lists" && listManager.getSelectedPhoto() && !listManager.getSelectedPhoto().isDataLoaded) return
    trigger("dialogShare:show")
  }
}
