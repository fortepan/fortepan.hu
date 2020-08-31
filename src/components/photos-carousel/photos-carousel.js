import config from "../../config"
import { trigger, getURLParams, isTouchDevice } from "../../utils"

class PhotosCarousel extends HTMLElement {
  constructor() {
    super()

    this.currentImageMeta = null

    this.sidebarIsHidden = false

    this.slideshowTimeout = null
    this.slideshowIsPlaying = false

    this.touchTimeout = 0

    this.bindCustomEvents()
    this.bindEvents()
  }

  stepSlideshow() {
    // step slideshow after some delay if slideshow is playing
    if (document.querySelector("body").classList.contains("play-carousel-slideshow")) {
      clearTimeout(this.slideshowTimeout)
      this.slideshowTimeout = setTimeout(() => {
        trigger("layoutPhotos:showNextPhoto")
      }, config.CAROUSEL_SLIDESHOW_DELAY)
    }
  }

  setCarouselBackground() {
    const photosBackgroundNode = this.querySelector(".photos-carousel__photos__background")
    photosBackgroundNode.style.backgroundImage = `url(${
      this.currentImageMeta.thumbnailNode.querySelector("img").currentSrc
    })`
    photosBackgroundNode.classList.remove("fade-in")
    setTimeout(() => {
      photosBackgroundNode.classList.add("fade-in")
    }, 20)
  }

  loadPhoto() {
    const id = this.currentImageMeta.mid
    let photo = this.querySelector(`#Fortepan-${id}`)
    if (!photo) {
      photo = document.createElement("carousel-photo")
      photo.id = `Fortepan-${id}`
      photo.imageSrc = `${config.PHOTO_SOURCE}1600/fortepan_${id}.jpg`
      photo.classList.add("is-active")
      trigger("loadingIndicator:show", { id: "LoadingIndicatorCarousel" })
      photo.loadCallback = function() {
        trigger("loadingIndicator:hide", { id: "LoadingIndicatorCarousel" })
        this.stepSlideshow()
      }.bind(this)
      document.querySelector(".photos-carousel__photos__all").appendChild(photo)
    } else if (photo.loaded) {
      trigger("loadingIndicator:hide", { id: "LoadingIndicatorCarousel" })
      photo.classList.add("is-active")
    } else {
      trigger("loadingIndicator:show", { id: "LoadingIndicatorCarousel" })
    }
  }

  initPager() {
    // keep pager disabled if there's only one photo thumbnail in the photos list
    if (document.querySelectorAll(".photos-thumbnail").length > 1) {
      document.querySelectorAll(".photos-carousel__photos__pager").forEach(pager => {
        pager.classList.remove("disable")
      })
    } else {
      document.querySelectorAll(".photos-carousel__photos__pager").forEach(pager => {
        pager.classList.add("disable")
      })
    }
  }

  showPhoto() {
    this.hideAllPhotos()
    this.setCarouselBackground()
    this.loadPhoto()
    this.initPager()

    document.querySelector(".carousel-sidebar").bindData = this.currentImageMeta
    document.querySelector(".dialog-download").bindData = this.currentImageMeta
    document.querySelector(".dialog-share").bindData = this.currentImageMeta

    trigger("photosCarousel:show")
  }

  hideAllPhotos() {
    this.querySelectorAll(".carousel-photo").forEach(photo => {
      photo.classList.remove("is-active")
    })
  }

  bindCustomEvents() {
    document.addEventListener("photosCarousel:playSlideshow", this.playSlideshow.bind(this))
    document.addEventListener("photosCarousel:pauseSlideshow", this.pauseSlideshow.bind(this))

    document.addEventListener(
      "photosCarousel:showPhoto",
      function(e) {
        this.currentImageMeta = e.detail
        this.showPhoto()
      }.bind(this)
    )

    document.addEventListener(
      "photosCarousel:show",
      function() {
        this.classList.add("is-visible")
        if (isTouchDevice()) this.autoHideControls()
      }.bind(this)
    )

    document.addEventListener(
      "photosCarousel:hide",
      function() {
        // pause slideshow if the slideshow is playing
        if (document.querySelector("body").classList.contains("play-carousel-slideshow")) {
          this.pauseSlideshow()
        } else {
          // hide all photos
          this.hideAllPhotos()

          // hide dialogs
          trigger("dialogShare:hide")
          trigger("dialogDownload:hide")

          // hide carousel
          this.classList.remove("is-visible")

          // load all photos if there's only one photo loaded in the carousel
          if (!(document.querySelectorAll(".photos-thumbnail").length > 1) && getURLParams().id > 0) {
            trigger("layoutPhotos:historyPushState", { url: "?q=", resetPhotosGrid: true })
          }
        }
      }.bind(this)
    )
  }

  pauseSlideshow() {
    document.querySelector("body").classList.remove("play-carousel-slideshow")
    this.slideshowIsPlaying = false

    if (!this.sidebarIsHidden) trigger("carouselSidebar:show")
    clearTimeout(this.slideshowTimeout)
  }

  playSlideshow() {
    document.querySelector("body").classList.add("play-carousel-slideshow")
    this.slideshowIsPlaying = true

    // store sidebar visibility
    this.sidebarIsHidden = document.querySelector("body").classList.contains("hide-carousel-sidebar")
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

  showControls() {
    this.querySelector(".photos-carousel__photos").classList.remove("hide-controls")
  }

  hideControls() {
    this.querySelector(".photos-carousel__photos").classList.add("hide-controls")
  }

  autoHideControls() {
    this.showControls()
    clearTimeout(this.touchTimeout)
    this.touchTimeout = setTimeout(this.hideControls.bind(this), 4000)
  }

  bindEvents() {
    // add photos container hover actions

    if (!isTouchDevice()) {
      this.querySelector(".photos-carousel__photos").addEventListener("mouseover", e => {
        e.currentTarget.classList.remove("hide-controls")
      })
      this.querySelector(".photos-carousel__photos").addEventListener("mouseout", e => {
        e.currentTarget.classList.add("hide-controls")
      })
    } else {
      this.querySelector(".photos-carousel__photos").addEventListener("touchstart", this.autoHideControls.bind(this))
    }

    // bind key events
    document.addEventListener(
      "keydown",
      function(e) {
        // if carousel is not visible then keyboard actions shouldn't work
        if (!this.classList.contains("is-visible")) return

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
      }.bind(this)
    )
  }
}
window.customElements.define("photos-carousel", PhotosCarousel)
