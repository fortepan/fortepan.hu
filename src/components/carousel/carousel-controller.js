import { Controller } from "@hotwired/stimulus"

import config from "../../data/siteConfig"
import { trigger, lang, isTouchDevice, getImgAltText, getLocale } from "../../js/utils"
import { setAppState, removeAppState, appState } from "../../js/app"
import photoManager from "../../js/photo-manager"
import listManager from "../../js/list-manager"

const TOUCH_ZOOM_MIN_SCALE = 1
const TOUCH_ZOOM_EPSILON = 0.001
const TOUCH_PAN_RESISTANCE = 0.35
const TOUCH_SCALE_RESISTANCE = 0.2
const TOUCH_SNAP_DURATION = 180
const TOUCH_SNAP_EASING = "cubic-bezier(0.22, 1, 0.36, 1)"
const TOUCH_LAYOUT_SYNC_DELAY = 450
const LARGE_PHOTO_EDGE_PADDING_PX = 96

export default class extends Controller {
  static get targets() {
    return [
      "background",
      "pagerPrev",
      "pagerNext",
      "counter",
      "counterDots",
      "counterTooltip",
      "photo",
      "photos",
      "photosContainer",
    ]
  }

  connect() {
    // role defines if the thumbnail is loaded on the photos page or on the lists page
    // possible values (strict): [ lists | photos (default) ]
    this.role = appState("is-lists") ? "lists" : "photos"

    this.slideshowTimeout = 0
    this.touchTimeout = 0

    this.prevPhotoId = null
    this.nextPhotoId = null
    this.currentPhotoData = null
    this.desktopZoomPointer = null
    this.sidebarZoomRecalcTimeout = 0

    if (isTouchDevice()) {
      setAppState("is-touch-device")
      this.initTouchPinchZoom()
    }
  }

  initTouchPinchZoom() {
    this.touchSnapTimeout = 0
    this.touchLayoutSettled = true
    this.touchScale = TOUCH_ZOOM_MIN_SCALE
    this.touchTranslation = { x: 0, y: 0 }
    this.touchStartScale = TOUCH_ZOOM_MIN_SCALE
    this.touchStartDistance = 0
    this.touchStartTranslation = { x: 0, y: 0 }
    this.touchPinchStartCenter = { x: 0, y: 0 }
    this.touchPanStart = { x: 0, y: 0 }
    this.isTouchPinching = false
    this.isTouchPanning = false
    this.touchIdentifiers = []
  }

  resetTouchZoomState() {
    clearTimeout(this.touchSnapTimeout)
    this.stopTouchLayoutSync()
    this.touchLayoutSettled = true
    this.touchScale = TOUCH_ZOOM_MIN_SCALE
    this.touchTranslation = { x: 0, y: 0 }
    this.resetTouchGestureState()
  }

  resetTouchGestureState() {
    this.touchStartScale = this.touchScale
    this.touchStartDistance = 0
    this.touchStartTranslation = { ...this.touchTranslation }
    this.touchPinchStartCenter = { x: 0, y: 0 }
    this.touchPanStart = { x: 0, y: 0 }
    this.isTouchPinching = false
    this.isTouchPanning = false
    this.touchIdentifiers = []
  }

  getActiveZoomedPhoto() {
    return this.photosTarget.querySelector(".image-loader.is-active.is-loaded.is-zoomed-in")
  }

  getPhotoImage(photo) {
    return photo?.querySelector(":scope > img")
  }

  getLargePhotoSrc(photo) {
    if (!photo?.mid) return null
    return `${config().PHOTO_SOURCE}2560/fortepan_${photo.mid}.jpg`
  }

  clearDesktopPreloadSizeClasses(photo) {
    if (!photo) return
    photo.classList.remove("desktop-preload-size--landscape", "desktop-preload-size--portrait")
  }

  applyDesktopPreloadSizeClass(photo) {
    if (!photo) return

    const img = this.getPhotoImage(photo)
    const width = img?.naturalWidth || 0
    const height = img?.naturalHeight || 0

    this.clearDesktopPreloadSizeClasses(photo)
    photo.classList.add(`desktop-preload-size--${!width || !height || width >= height ? "landscape" : "portrait"}`)
  }

  preloadLargePhotoOnBaseImage(photo) {
    if (!photo || photo.noImage || photo.largeSrcLoaded) return

    const img = this.getPhotoImage(photo)
    const largeSrc = this.getLargePhotoSrc(photo)
    if (!img || !largeSrc) return

    if (img.src === largeSrc) {
      photo.largeSrcLoaded = true
      if (!isTouchDevice()) {
        this.clearDesktopPreloadSizeClasses(photo)
        if (photo.classList.contains("is-zoomed-in")) this.setLargePhotoPosition()
      }
      return
    }

    const loadToken = `${photo.mid}-${Date.now()}`
    photo.largeSrcLoadToken = loadToken

    const preloader = new Image()
    preloader.onload = () => {
      if (photo.largeSrcLoadToken !== loadToken) return
      if (!photo.classList.contains("is-active")) return

      const onBaseImageLoaded = () => {
        if (photo.largeSrcLoadToken !== loadToken) return
        if (!photo.classList.contains("is-active")) return

        photo.largeSrcLoaded = true

        if (photo.classList.contains("is-zoomed-in")) {
          if (isTouchDevice()) this.normalizeTouchZoomPosition(photo)
          else {
            this.clearDesktopPreloadSizeClasses(photo)
            this.setLargePhotoPosition()
          }
        }
      }

      img.addEventListener("load", onBaseImageLoaded, { once: true })
      img.src = largeSrc
    }
    preloader.src = largeSrc
  }

  getTouchByIdentifier(touches, identifier) {
    if (identifier == null) return null
    for (let i = 0; i < touches.length; i += 1) {
      if (touches[i].identifier === identifier) return touches[i]
    }
    return null
  }

  beginTouchPinch(firstTouch, secondTouch) {
    const center = this.calculateMidpoint(firstTouch, secondTouch)

    this.touchIdentifiers = [firstTouch.identifier, secondTouch.identifier]
    this.touchStartDistance = this.calculateDistance(firstTouch, secondTouch)
    this.touchStartScale = this.touchScale
    this.touchStartTranslation = { ...this.touchTranslation }
    this.touchPinchStartCenter = center
    this.isTouchPinching = true
    this.isTouchPanning = false
  }

  beginTouchPan(touch, options = {}) {
    const { normalize = false } = options
    if (normalize) this.normalizeTouchZoomPosition()

    this.touchIdentifiers = [touch.identifier]
    this.touchPanStart = { x: touch.clientX, y: touch.clientY }
    this.touchStartTranslation = { ...this.touchTranslation }
    this.touchStartDistance = 0
    this.isTouchPinching = false
    this.isTouchPanning = this.isTouchZoomed()
  }

  isTouchZoomed() {
    return this.touchScale > TOUCH_ZOOM_MIN_SCALE + TOUCH_ZOOM_EPSILON
  }

  isTouchScaleAtMin() {
    return this.touchScale <= TOUCH_ZOOM_MIN_SCALE + TOUCH_ZOOM_EPSILON
  }

  clampTouchZoomTranslation(photo, scale, translation) {
    const limits = this.getTouchZoomLimits(photo, scale)
    if (!limits) return translation

    return {
      x: Math.max(limits.minX, Math.min(limits.maxX, translation.x)),
      y: Math.max(limits.minY, Math.min(limits.maxY, translation.y)),
    }
  }

  getTouchZoomLimits(photo, scale) {
    const photoBounds = photo.getBoundingClientRect()
    if (!photoBounds.width || !photoBounds.height) return null

    const viewport = this.getTouchImageViewport(photo)
    if (!viewport) return null

    const edgePadding = LARGE_PHOTO_EDGE_PADDING_PX
    const paddedBoundsWidth = Math.max(0, photoBounds.width - edgePadding * 2)
    const paddedBoundsHeight = Math.max(0, photoBounds.height - edgePadding * 2)

    const maxX = Math.max(0, (viewport.width * scale - paddedBoundsWidth) / 2)
    const maxY = Math.max(0, (viewport.height * scale - paddedBoundsHeight) / 2)

    return {
      minX: -maxX,
      maxX,
      minY: -maxY,
      maxY,
    }
  }

  applyTouchResistance(value, min, max, factor = TOUCH_PAN_RESISTANCE) {
    if (value < min) return min - (min - value) * factor
    if (value > max) return max + (value - max) * factor
    return value
  }

  getTouchContainSize(containerWidth, containerHeight, naturalWidth, naturalHeight) {
    if (!naturalWidth || !naturalHeight || !containerWidth || !containerHeight) {
      return { width: containerWidth, height: containerHeight }
    }

    const scale = Math.min(containerWidth / naturalWidth, containerHeight / naturalHeight)
    return {
      width: naturalWidth * scale,
      height: naturalHeight * scale,
    }
  }

  getTouchImageViewport(photo) {
    if (!photo) return null

    const photoBounds = photo.getBoundingClientRect()
    if (!photoBounds.width || !photoBounds.height) return null

    const img = this.getPhotoImage(photo)
    const naturalWidth = img?.naturalWidth
    const naturalHeight = img?.naturalHeight

    const contain = this.getTouchContainSize(photoBounds.width, photoBounds.height, naturalWidth, naturalHeight)

    return {
      left: (photoBounds.width - contain.width) / 2,
      top: (photoBounds.height - contain.height) / 2,
      width: contain.width,
      height: contain.height,
    }
  }

  getTouchZoomMaxScale(photo = this.getActiveZoomedPhoto()) {
    if (!photo?.imageLoaded) return TOUCH_ZOOM_MIN_SCALE

    const img = this.getPhotoImage(photo)
    const naturalWidth = img?.naturalWidth
    const naturalHeight = img?.naturalHeight
    if (!naturalWidth || !naturalHeight) return TOUCH_ZOOM_MIN_SCALE

    const photoBounds = photo.getBoundingClientRect()
    if (!photoBounds.width || !photoBounds.height) return TOUCH_ZOOM_MIN_SCALE

    const contain = this.getTouchContainSize(photoBounds.width, photoBounds.height, naturalWidth, naturalHeight)
    if (!contain.width || !contain.height) return TOUCH_ZOOM_MIN_SCALE

    const maxByWidth = naturalWidth / contain.width
    const maxByHeight = naturalHeight / contain.height
    return Math.max(TOUCH_ZOOM_MIN_SCALE, Math.min(maxByWidth, maxByHeight))
  }

  preventIfCancelable(e) {
    if (e?.cancelable) e.preventDefault()
  }

  isTouchOnCarouselControl(target) {
    if (!target?.closest) return false

    return Boolean(
      target.closest(
        ".carousel__photos__actions, .carousel__photos__pager, .carousel__photos__counter, .button-circular"
      )
    )
  }

  stopTouchSnapAnimation(photo = this.getActiveZoomedPhoto()) {
    clearTimeout(this.touchSnapTimeout)
    const img = this.getPhotoImage(photo)
    if (img) img.style.transition = ""
  }

  stopTouchLayoutSync() {
    clearTimeout(this.touchLayoutSyncTimeout)
    if (this.touchLayoutSyncHandler && this.photosTarget) {
      this.photosTarget.removeEventListener("transitionend", this.touchLayoutSyncHandler)
      this.touchLayoutSyncHandler = null
    }
  }

  scheduleTouchZoomLayoutSync(photo = this.getActiveZoomedPhoto()) {
    if (!isTouchDevice() || !photo) return

    this.touchLayoutSettled = false
    this.stopTouchLayoutSync()

    const sync = () => {
      if (this.isTouchPinching || this.isTouchPanning) {
        this.touchLayoutSyncTimeout = setTimeout(sync, 120)
        return
      }

      this.stopTouchLayoutSync()
      if (photo.classList.contains("is-zoomed-in")) {
        this.normalizeTouchZoomPosition(photo)
      }
      this.touchLayoutSettled = true
    }

    this.touchLayoutSyncHandler = (event) => {
      if (event.target !== this.photosTarget) return
      if (!["left", "right", "top", "bottom"].includes(event.propertyName)) return
      sync()
    }

    this.photosTarget.addEventListener("transitionend", this.touchLayoutSyncHandler)
    this.touchLayoutSyncTimeout = setTimeout(sync, TOUCH_LAYOUT_SYNC_DELAY)
  }

  applyTouchZoomTransform(photo = this.getActiveZoomedPhoto(), options = {}) {
    if (!isTouchDevice() || !photo?.imageLoaded) return

    const { resist = false, animate = false } = options

    const img = this.getPhotoImage(photo)
    if (!img) return

    const limits = this.getTouchZoomLimits(photo, this.touchScale)
    if (limits) {
      if (resist) {
        this.touchTranslation = {
          x: this.applyTouchResistance(this.touchTranslation.x, limits.minX, limits.maxX),
          y: this.applyTouchResistance(this.touchTranslation.y, limits.minY, limits.maxY),
        }
      } else {
        this.touchTranslation = this.clampTouchZoomTranslation(photo, this.touchScale, this.touchTranslation)
      }
    }

    if (animate) {
      img.style.transition = `transform ${TOUCH_SNAP_DURATION}ms ${TOUCH_SNAP_EASING}`
      clearTimeout(this.touchSnapTimeout)
      this.touchSnapTimeout = setTimeout(() => {
        const activeImg = this.getPhotoImage(photo)
        if (activeImg) activeImg.style.transition = ""
      }, TOUCH_SNAP_DURATION)
    } else {
      this.stopTouchSnapAnimation(photo)
    }

    img.style.transform = `translate3d(${this.touchTranslation.x}px, ${this.touchTranslation.y}px, 0) scale(${this.touchScale})`
  }

  snapTouchZoomToBounds(photo = this.getActiveZoomedPhoto()) {
    if (!photo) return

    const maxScale = this.getTouchZoomMaxScale(photo)
    this.touchScale = Math.max(TOUCH_ZOOM_MIN_SCALE, Math.min(maxScale, this.touchScale))

    if (this.isTouchScaleAtMin()) {
      this.touchScale = TOUCH_ZOOM_MIN_SCALE
      this.touchTranslation = { x: 0, y: 0 }
    } else {
      this.touchTranslation = this.clampTouchZoomTranslation(photo, this.touchScale, this.touchTranslation)
    }

    this.applyTouchZoomTransform(photo, { animate: true })
  }

  normalizeTouchZoomPosition(photo = this.getActiveZoomedPhoto()) {
    if (!photo) return

    const maxScale = this.getTouchZoomMaxScale(photo)
    this.touchScale = Math.max(TOUCH_ZOOM_MIN_SCALE, Math.min(maxScale, this.touchScale))

    if (this.isTouchScaleAtMin()) {
      this.touchScale = TOUCH_ZOOM_MIN_SCALE
      this.touchTranslation = { x: 0, y: 0 }
    } else {
      this.touchTranslation = this.clampTouchZoomTranslation(photo, this.touchScale, this.touchTranslation)
    }

    this.applyTouchZoomTransform(photo)
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
    // reset role so it can be used for different purposes the next time it opens again
    this.role = appState("is-lists") ? "lists" : "photos"

    // hide all photos
    this.hideAllPhotos()

    // hide dialogs
    trigger("dialogs:hide")

    // hide carousel
    this.element.classList.remove("is-visible")

    // reset counter (on lists)
    this.counterTarget.classList.remove("is-visible")
    delete this.counterTarget.index
    delete this.counterTarget.range
    delete this.counterTarget.total

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

      photo.altText = getImgAltText(this.currentPhotoData)

      if (this.role === "lists" && !this.currentPhotoData.isDataLoaded) {
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
        !this.currentPhotoData.ageRestrictionRemoved &&
        this.currentPhotoData?.tags?.indexOf(config().AGE_RESTRICTION_TAG) > -1
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
        trigger("dialogAgeRestriction:show", { photoId: id.toString() })
      }
    } else {
      trigger("loader:show", { id: "loaderCarousel" })
      photo.imageSrc = `${config().PHOTO_SOURCE}${window.innerWidth > 1600 ? 2560 : 1600}/fortepan_${id}.jpg`
      if (photo.imageLoader) photo.imageLoader.loadImage()
    }
  }

  setPagers() {
    const locale = getLocale()
    let total
    let prevHref
    let nextHref

    if (this.role === "lists") {
      const listId = listManager.getSelectedListId()

      prevHref = `/${locale}/lists/${listId}/photos/${this.prevPhotoId}`
      nextHref = `/${locale}/lists/${listId}/photos/${this.nextPhotoId}`

      total = listManager.getSelectedList().photos.length
    } else {
      prevHref = `/${locale}/photos/?id=${this.prevPhotoId}`
      nextHref = `/${locale}/photos/?id=${this.nextPhotoId}`

      total = this.role === "dataset" ? this.dataset.length : photoManager.getTotalPhotoCountInContext()
    }

    this.pagerPrevTarget.href = prevHref
    this.pagerNextTarget.href = nextHref

    this.pagerPrevTarget.classList.toggle("is-disabled", total === 1 || !this.prevPhotoId)
    this.pagerNextTarget.classList.toggle("is-disabled", total === 1 || !this.nextPhotoId)

    // counter for lists
    this.counterTarget.classList.toggle("is-visible", total > 1)

    if (total > 1 && (this.role === "dataset" || this.role === "lists")) {
      // setup
      const currentIndex =
        this.role === "dataset"
          ? this.dataset.findIndex((photo) => this.currentPhotoData === photo)
          : listManager.getSelectedPhotoIndex()

      const prevIndex = this.counterTarget.index || -1

      const currentRange = this.counterTarget.range || [
        Math.min(currentIndex, total - 3),
        Math.min(currentIndex + 2, total - 1),
      ]

      // adjusting the range
      if (currentIndex > prevIndex && currentIndex > currentRange[1]) {
        currentRange[0] = currentIndex - 2
        currentRange[1] = currentIndex
      }
      if (currentIndex < prevIndex && currentIndex < currentRange[0]) {
        currentRange[0] = currentIndex
        currentRange[1] = currentIndex + 2
      }

      if (!this.counterTarget.total || this.counterTarget.total !== total) {
        // when no total is given (first run) or the # of total is different, generate/reganarate all the dots
        let dotsHTML = ""
        for (let i = 0; i < total; i += 1) {
          dotsHTML += `<span class="dot"></span>`
        }
        this.counterDotsTarget.innerHTML = dotsHTML
      }

      this.counterDotsTarget.querySelectorAll(".dot").forEach((dot, i) => {
        // first reset
        dot.className = "dot"

        // then set up the right classes given the positions
        if (i < currentRange[0]) {
          dot.classList.add(`range--${currentRange[0] - i > 2 ? `more` : currentRange[0] - i}`)
        } else if (i <= currentRange[1]) {
          dot.classList.add(`in-range-${i + 1 - currentRange[0]}`)
        } else {
          dot.classList.add(`range-${i - currentRange[1] > 2 ? `more` : i - currentRange[1]}`)
        }

        // set the current one
        if (i === currentIndex) dot.classList.add("current")
      })

      this.counterTooltipTarget.textContent = `${currentIndex + 1}/${total}`
      this.counterTooltipTarget.classList.remove("left", "right")
      if (currentIndex === currentRange[0]) this.counterTooltipTarget.classList.add("left")
      if (currentIndex === currentRange[1]) this.counterTooltipTarget.classList.add("right")

      this.counterTarget.index = currentIndex
      this.counterTarget.range = currentRange
      this.counterTarget.total = total
    }
  }

  onPagerClicked() {
    trigger("photosCarousel:pagerClicked")
  }

  async showPhoto(e, photoId) {
    const id = e?.detail?.data?.mid || photoId

    if (e?.detail?.dataset) {
      // if a specific dataset is given switch to dataset mode
      // this dataset has to be a subset of the photo data already loaded by the photoManager
      this.role = "dataset"
      this.dataset = e.detail.dataset
    }

    if (id) {
      if (!this.element.classList.contains("is-visible")) this.show()

      this.hideAllPhotos()
      this.hideLargePhotoView()

      trigger("loader:show", { id: "loaderCarousel" })

      if (this.role === "dataset") {
        const index = this.dataset.findIndex((photo) => photo.mid.toString() === id.toString())

        this.prevPhotoId = this.dataset[index - 1]?.mid // returns undefined if index is lower than 0
        this.nextPhotoId = this.dataset[index + 1]?.mid // returns undefined if index is higher than length - 1

        this.currentPhotoData = this.dataset[index]

        // setting setId for comparison
        this.setId =
          e?.detail?.setId ||
          `${this.dataset[0].mid}-${this.dataset[this.dataset.length - 1].mid}-${this.dataset.length}`
        //
      } else if (this.role === "lists") {
        this.prevPhotoId = listManager.getPrevPhotoId()
        this.nextPhotoId = listManager.getNextPhotoId()

        this.currentPhotoData = listManager.getSelectedPhoto()
      } else {
        // get the next and previous photo id for SEO
        // in the case of photos this will also triggering the load the previous and the next 40 photo data if needed
        // and will cause to fill the photo list in the background too
        this.prevPhotoId = await photoManager.getPrevPhotoId()
        this.nextPhotoId = await photoManager.getNextPhotoId()

        this.currentPhotoData = photoManager.getSelectedPhotoData()
      }

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

    if (this.role === "dataset") {
      const currentIndex = this.dataset.findIndex((photo) => photo === this.currentPhotoData)
      index = currentIndex + 1
      photoId = this.dataset[index]?.mid
      photoManager.selectPhotoById(photoId)
    } else if (this.role === "lists") {
      photoId = listManager.selectNextPhoto().id
      index = listManager.getSelectedPhotoIndex()
    } else {
      // select the next photo in the current context (or load more if neccessary)
      await photoManager.selectNextPhoto()
      photoId = photoManager.getSelectedPhotoId()
      index = photoManager.getSelectedPhotoIndex()
    }

    this.showPhoto(null, photoId)

    const eventData = { index }
    if (this.role === "dataset" && this.setId) eventData.setId = this.setId

    trigger("photos:selectThumbnail", eventData)
  }

  async showPrevPhoto(e) {
    if (e) e.preventDefault()

    // hide dialogs
    trigger("dialogs:hide")

    let photoId
    let index

    if (this.role === "dataset") {
      const currentIndex = this.dataset.findIndex((photo) => photo === this.currentPhotoData)
      index = currentIndex - 1
      photoId = this.dataset[index]?.mid
      photoManager.selectPhotoById(photoId)
    } else if (this.role === "lists") {
      photoId = listManager.selectPrevPhoto().id
      index = listManager.getSelectedPhotoIndex()
    } else {
      // select the next previous in the current context (or load more if neccessary)
      await photoManager.selectPrevPhoto()
      photoId = photoManager.getSelectedPhotoId()
      index = photoManager.getSelectedPhotoIndex()
    }

    this.showPhoto(null, photoId)

    const eventData = { index }
    if (this.role === "dataset" && this.setId) eventData.setId = this.setId

    trigger("photos:selectThumbnail", eventData)
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
    this.photoTargets.forEach((photo) => {
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
  }

  pauseSlideshow() {
    removeAppState("play-carousel-slideshow")
    clearTimeout(this.slideshowTimeout)
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
    if (!this.isPhotoZoomedIn) return

    this.setLargePhotoPosition()
    if (isTouchDevice()) this.scheduleTouchZoomLayoutSync()

    clearTimeout(this.sidebarZoomRecalcTimeout)
    this.sidebarZoomRecalcTimeout = setTimeout(() => {
      if (!this.isPhotoZoomedIn) return
      this.setLargePhotoPosition()
      if (isTouchDevice()) this.scheduleTouchZoomLayoutSync()
    }, TOUCH_LAYOUT_SYNC_DELAY)
  }

  get isFullscreen() {
    return appState("carousel-fullscreen")
  }

  onFullscreenOpened() {
    setAppState("carousel-fullscreen")

    // store sidebar visibility
    this.sidebarWasHidden = appState("hide-carousel-sidebar")

    // close sidebar
    trigger("carouselSidebar:hide")

    // hide controls
    this.autoHideControls()
  }

  onFullscreenClosed() {
    removeAppState("carousel-fullscreen")

    // show controls
    this.showControls(null, true)

    if (!this.sidebarWasHidden) trigger("carouselSidebar:show")
  }

  openFullscreen() {
    if (appState("is-embed") && document.fullscreenEnabled) {
      document.body.requestFullscreen()
    } else {
      this.onFullscreenOpened()
    }
  }

  closeFullscreen() {
    if (appState("is-embed") && document.fullscreenEnabled) {
      document.exitFullscreen()
    } else {
      this.onFullscreenClosed()
    }
  }

  onFullscreenChange() {
    if (document.fullscreenElement) {
      this.onFullscreenOpened()
    } else {
      this.onFullscreenClosed()
    }
  }

  toggleFullscreen() {
    if (this.isFullscreen) {
      this.closeFullscreen()
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
      targets.forEach((item) => {
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

    if (photo && !photo.noImage) {
      setAppState("carousel-photo-zoomed-in")
      setAppState("disable--selection")

      if (this.slideshowIsPlaying) this.pauseSlideshow()

      photo.classList.add("is-zoomed-in")
      if (!isTouchDevice() && !photo.largeSrcLoaded) {
        this.applyDesktopPreloadSizeClass(photo)
      }
      this.preloadLargePhotoOnBaseImage(photo)
      this.setLargePhotoPosition(e)
      this.scheduleTouchZoomLayoutSync(photo)
    }
  }

  hideLargePhotoView(e) {
    if (e) e.preventDefault()
    this.stopTouchLayoutSync()
    removeAppState("carousel-photo-zoomed-in")
    removeAppState("disable--selection")

    this.photoTargets.forEach((photo) => {
      photo.classList.remove("is-zoomed-in")
      this.clearDesktopPreloadSizeClasses(photo)
      const img = this.getPhotoImage(photo)
      if (img) {
        img.style.transform = ""
        img.style.transition = ""
      }
    })
    this.desktopZoomPointer = null

    if (isTouchDevice()) {
      this.resetTouchZoomState()
    }

    this.showControls(null, true)
  }

  toggleLargePhotoView(e) {
    if (this.isPhotoZoomedIn) {
      this.hideLargePhotoView()
    } else {
      this.showLargePhotoView(e)
    }
  }

  setLargePhotoPosition(e) {
    if (e && isTouchDevice()) return
    if (e?.preventDefault) e.preventDefault()

    const photo = this.photosTarget.querySelector(".image-loader.is-active.is-loaded.is-zoomed-in")

    if (photo && photo.imageLoaded) {
      const img = this.getPhotoImage(photo)
      if (!img) return

      const bounds = photo.getBoundingClientRect()

      if (isTouchDevice()) {
        this.applyTouchZoomTransform(photo)
      } else {
        const mousePoint = e
          ? {
              x: e.touches ? e.touches[0].pageX : e.pageX,
              y: e.touches ? e.touches[0].pageY : e.pageY,
            }
          : null

        if (mousePoint && typeof mousePoint.x === "number" && typeof mousePoint.y === "number") {
          this.desktopZoomPointer = mousePoint
        }

        const point = this.desktopZoomPointer || {
          x: bounds.left + bounds.width / 2,
          y: bounds.top + bounds.height / 2,
        }

        const pointerRatioX = bounds.width ? (point.x - bounds.left) / bounds.width : 0
        const pointerRatioY = bounds.height ? (point.y - bounds.top) / bounds.height : 0

        const normalizedX = Math.max(0, Math.min(1, pointerRatioX))
        const normalizedY = Math.max(0, Math.min(1, pointerRatioY))

        const computed = getComputedStyle(photo)
        const paddingX = (parseFloat(computed.paddingLeft) || 0) + (parseFloat(computed.paddingRight) || 0)
        const paddingY = (parseFloat(computed.paddingTop) || 0) + (parseFloat(computed.paddingBottom) || 0)

        const viewportWidth = Math.max(1, photo.clientWidth - paddingX)
        const viewportHeight = Math.max(1, photo.clientHeight - paddingY)
        const imageWidth = img.getBoundingClientRect().width
        const imageHeight = img.getBoundingClientRect().height

        const overflowX = Math.max(0, imageWidth - viewportWidth)
        const overflowY = Math.max(0, imageHeight - viewportHeight)

        const translateX = -normalizedX * overflowX
        const translateY = -normalizedY * overflowY

        img.style.transform = `translate(${translateX}px, ${translateY}px)`
      }
    }
  }

  onPhotoClick(e) {
    if (e?.currentTarget?.classList?.contains("image-loader--no-image")) return

    if (isTouchDevice()) {
      if (this.isPhotoZoomedIn && (this.isTouchPanning || this.isTouchPinching || this.isTouchZoomed())) {
        return
      }

      // Touch zoom is pinch-only. Single tap should not toggle large view.
      return
    } else {
      this.toggleLargePhotoView(e)
    }
  }

  onCloseClicked() {
    if (this.isPhotoZoomedIn) {
      this.hideLargePhotoView()
    } else if (this.slideshowIsPlaying || this.isFullscreen) {
      if (this.slideshowIsPlaying) this.pauseSlideshow()
      if (this.isFullscreen) this.closeFullscreen()
    } else if (!appState("is-embed")) {
      this.hide()
    }
  }

  boundKeydownListener(e) {
    if (!this.element.classList.contains("is-visible")) return

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
    if (
      (this.role === "lists" && !this.currentPhotoData.isDataLoaded) ||
      (!this.currentPhotoData.ageRestrictionRemoved &&
        this.currentPhotoData?.tags?.indexOf(config().AGE_RESTRICTION_TAG) > -1)
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

  onThumbnailClicked() {
    trigger("photosCarousel:thumbnailClicked")
  }

  showAgeRestrictionDialog(e) {
    if (e) e.preventDefault()

    trigger("dialogAgeRestriction:show", { photoId: this.currentPhotoData.mid.toString() })
  }

  removeAgeRestriction(e) {
    this.photoTargets.forEach((photo) => {
      if (photo.noImage && photo.ageRestricted && e?.detail?.photoId.toString() === photo.mid.toString()) {
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

  calculateDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  calculateMidpoint(touch1, touch2) {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    }
  }

  onCarouselTouchStart(e) {
    if (!isTouchDevice()) return

    if (this.isTouchOnCarouselControl(e.target)) return

    this.stopTouchSnapAnimation()

    if (e.touches.length === 2) {
      if (!this.isPhotoZoomedIn) {
        this.showLargePhotoView()
      }

      this.beginTouchPinch(e.touches[0], e.touches[1])
      this.preventIfCancelable(e)
    } else if (e.touches.length === 1 && this.isPhotoZoomedIn && this.isTouchZoomed()) {
      if (!this.touchLayoutSettled) {
        this.scheduleTouchZoomLayoutSync()
        return
      }
      this.beginTouchPan(e.touches[0])
      this.preventIfCancelable(e)
    }
  }

  onCarouselTouchMove(e) {
    if (!isTouchDevice() || !this.isPhotoZoomedIn) return

    if (e.touches.length === 2) {
      const touch1 = this.getTouchByIdentifier(e.touches, this.touchIdentifiers[0]) || e.touches[0]
      const touch2 = this.getTouchByIdentifier(e.touches, this.touchIdentifiers[1]) || e.touches[1]

      if (!touch1 || !touch2) return

      const photo = this.getActiveZoomedPhoto()
      if (!photo) return

      const currentDistance = this.calculateDistance(touch1, touch2)
      const distanceRatio = this.touchStartDistance > 0 ? currentDistance / this.touchStartDistance : 1
      const rawScale = this.touchStartScale * distanceRatio
      const maxScale = this.getTouchZoomMaxScale(photo)
      let scale = rawScale

      if (rawScale < TOUCH_ZOOM_MIN_SCALE) {
        scale = TOUCH_ZOOM_MIN_SCALE - (TOUCH_ZOOM_MIN_SCALE - rawScale) * TOUCH_SCALE_RESISTANCE
      } else if (rawScale > maxScale) {
        scale = maxScale + (rawScale - maxScale) * TOUCH_SCALE_RESISTANCE
      }

      scale = Math.max(TOUCH_ZOOM_MIN_SCALE * 0.85, Math.min(maxScale * 1.2, scale))

      const bounds = photo.getBoundingClientRect()
      const startCenterX = this.touchPinchStartCenter.x - bounds.left - bounds.width / 2
      const startCenterY = this.touchPinchStartCenter.y - bounds.top - bounds.height / 2
      const center = this.calculateMidpoint(touch1, touch2)
      const currentCenterX = center.x - bounds.left - bounds.width / 2
      const currentCenterY = center.y - bounds.top - bounds.height / 2
      const scaleRatio = this.touchStartScale > 0 ? scale / this.touchStartScale : 1

      this.touchScale = scale
      this.touchTranslation = {
        x: currentCenterX - scaleRatio * (startCenterX - this.touchStartTranslation.x),
        y: currentCenterY - scaleRatio * (startCenterY - this.touchStartTranslation.y),
      }

      if (this.touchScale < TOUCH_ZOOM_MIN_SCALE) {
        this.touchTranslation = { x: 0, y: 0 }
      }

      this.applyTouchZoomTransform(photo, { resist: true })
      this.isTouchPinching = true
      this.isTouchPanning = false
      this.preventIfCancelable(e)
    } else if (e.touches.length === 1 && this.isTouchZoomed() && this.isTouchPanning) {
      if (!this.touchLayoutSettled) return

      const photo = this.getActiveZoomedPhoto()
      if (!photo) return

      const deltaX = e.touches[0].clientX - this.touchPanStart.x
      const deltaY = e.touches[0].clientY - this.touchPanStart.y

      this.isTouchPanning = true
      this.touchTranslation = {
        x: this.touchStartTranslation.x + deltaX,
        y: this.touchStartTranslation.y + deltaY,
      }
      this.applyTouchZoomTransform(photo)
      this.preventIfCancelable(e)
    }
  }

  onCarouselTouchEnd(e) {
    if (!isTouchDevice()) return

    if (e.touches.length === 0) {
      this.resetTouchGestureState()
      if (this.isPhotoZoomedIn && this.isTouchScaleAtMin()) {
        this.hideLargePhotoView()
      } else {
        this.snapTouchZoomToBounds()
      }
      return
    }

    if (e.touches.length === 1) {
      if (this.isTouchZoomed()) {
        this.beginTouchPan(e.touches[0], { normalize: true })
      } else {
        this.touchScale = TOUCH_ZOOM_MIN_SCALE
        this.touchTranslation = { x: 0, y: 0 }
        this.resetTouchGestureState()
        this.applyTouchZoomTransform()
      }
      return
    }

    if (e.touches.length >= 2) {
      this.beginTouchPinch(e.touches[0], e.touches[1])
    }
  }
}
