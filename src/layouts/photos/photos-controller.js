import { Controller } from "@hotwired/stimulus"

import throttle from "lodash/throttle"
import config from "../../data/siteConfig"
import { lang, trigger, getURLParams, isElementInViewport } from "../../js/utils"
import photoManager from "../../js/photo-manager"
import searchAPI from "../../api/search"

export default class extends Controller {
  static get targets() {
    return ["grid"]
  }

  connect() {
    this.selectedThumbnail = null

    this.thumbnailsCount = 0
    this.thumbnailsLoading = false

    // Throttle resize and scroll functions
    this.onScroll = throttle(this.onScroll, 200)
    this.resizeThumbnails = throttle(this.resizeThumbnails, 500)

    // check if we have any keys in the query
    const queryKeys = Object.keys(getURLParams())

    if (queryKeys.length > 0) {
      // populate page content for the first time
      this.onPopState()
    } else {
      // select a random id (that will open the carousel)
      searchAPI.getRandom().then(result => {
        if (result && result.items && result.items.length > 0 && result.items[0].mid) {
          trigger("photos:historyPushState", { url: `?id=${result.items[0].mid}` })
        } else {
          // fallback if the above doesn't work for some reason
          this.onPopState()
        }
      })
    }
  }

  // resize thumbnails when window gets resized
  resizeThumbnails() {
    this.element.querySelectorAll(".photos-thumbnail").forEach(thumbnail => {
      thumbnail.photosThumbnail.resize()
    })
  }

  // auto-load new items when scrolling reaches the bottom of the page
  onScroll() {
    if (
      !this.thumbnailsLoading &&
      this.thumbnailsCount > 0 &&
      !document.querySelector(".carousel").classList.contains("is-visible") &&
      ((this.element.scrollTop + this.element.offsetHeight >= this.element.scrollHeight - 150 &&
        !photoManager.getLastPhotoDataInContext()) ||
        (this.element.scrollTop <= 0 && !photoManager.getFirstPhotoDataInContext()))
    ) {
      this.thumbnailsLoading = true
      const insertBefore = this.element.scrollTop <= 0

      this.loadPhotos(insertBefore).then(() => {
        // loadPhotos resets the timline, so we need to update the displayed year on it
        // reset first the year in viewport to force a new calculation
        delete this.yearInViewPort
        this.calcYearOfViewport()
      })
    }

    this.calcYearOfViewport()
    this.loadThumbnails()
  }

  loadThumbnails() {
    this.element.querySelectorAll(".photos-thumbnail:not(.is-loaded)").forEach(thumbnail => {
      thumbnail.photosThumbnail.loadThumbnailImage()
    })
  }

  calcYearOfViewport() {
    if (this.lockYearOnScroll) {
      delete this.lockYearOnScroll
      return
    }

    // don't set the year if the carousel is open and it is controlling the timeline component
    const carouselElement = document.querySelector(".carousel")

    if (!carouselElement || (carouselElement && !carouselElement.classList.contains("is-visible"))) {
      let year = -1
      const thumbnails = this.element.querySelectorAll(".photos-thumbnail")
      const viewportOffsetTop =
        document.querySelector(".header-nav").offsetHeight + document.querySelector(".photos-timeline").offsetHeight + 8

      if (!this.yearInViewPort && photoManager.getFirstPhotoData()) {
        this.yearInViewPort = parseInt(photoManager.getFirstPhotoData().year, 10)
      }

      if (
        photoManager.getFirstPhotoDataInContext() &&
        this.element.scrollTop <= thumbnails[0].offsetTop + viewportOffsetTop &&
        thumbnails[0].classList.contains("is-loaded", "is-visible")
      ) {
        // if we scrolled to the top
        year = thumbnails[0].year
      } else if (
        photoManager.getLastPhotoDataInContext() &&
        this.element.scrollTop + this.element.offsetHeight >= this.element.scrollHeight - 100 &&
        thumbnails[thumbnails.length - 1].classList.contains("is-loaded", "is-visible")
      ) {
        // if we scrolled to the bottom
        year = thumbnails[thumbnails.length - 1].year
      } else {
        // if we are in-between the top and the bottom
        thumbnails.forEach(item => {
          if (item.offsetTop > this.element.scrollTop + viewportOffsetTop && year === -1) {
            year = item.year
          }
        })
      }

      if (year !== this.yearInViewPort) {
        this.yearInViewPort = year

        // dispatches a custom event if the year has changed
        trigger("photos:yearChanged", { year: this.yearInViewPort })
      }
    }
  }

  loadMorePhotos(e) {
    if (e && e.currentTarget) {
      e.currentTarget.classList.add("is-hidden")
    }
    this.thumbnailsLoading = true
    this.loadPhotos()
  }

  // this method generates the tumbnails from the data attribute
  // and displays them with a placeholder until the images load by themselves
  generateThumbnailsFromData(data, insertBefore = false) {
    // set the total photo counter
    trigger("photosTitle:setTitle", { count: data.total })

    const insertBeforeTarget = insertBefore ? this.element.querySelectorAll(".photos-thumbnail")[0] : null
    const scrollPosition =
      insertBefore && insertBeforeTarget ? this.element.scrollTop - insertBeforeTarget.offsetTop : 0
    const scrollH = this.element.scrollHeight

    data.items.forEach(item => {
      // count results
      this.thumbnailsCount += 1

      // clone thumnail template
      const template = document.getElementById("photos-thumbnail")
      const thumbnail = template.content.firstElementChild.cloneNode(true)

      if (insertBefore && insertBeforeTarget) {
        this.gridTarget.insertBefore(thumbnail, insertBeforeTarget)
      } else {
        this.gridTarget.appendChild(thumbnail)
      }

      // set thumnail node element index
      thumbnail.index = Array.prototype.indexOf.call(thumbnail.parentElement.children, thumbnail) + 1

      // apply photo id to node
      thumbnail.photoId = item.mid

      // apply year data to node
      thumbnail.year = item.year
    })

    this.thumbnailsLoading = false

    trigger("loader:hide", { id: "loaderBase" })

    // keep the scrolling position after inserting the new elements on the beginning of the list
    if (insertBefore && insertBeforeTarget) {
      this.element.scrollTop = scrollPosition + (this.element.scrollHeight - scrollH)
    }
  }

  // async function that loads thumbnail data based on the search query
  async loadPhotos(insertBefore) {
    // get default and seatch query params
    const params = {
      size: config().THUMBNAILS_QUERY_LIMIT,
    }

    // merge params with query params
    Object.assign(params, getURLParams())

    if (photoManager.hasData()) {
      if (insertBefore) {
        params.search_after = photoManager.getFirstPhotoData().search_after
        params.reverseOrder = true
      } else {
        params.search_after = photoManager.getLastPhotoData().search_after
      }

      // not passing id on once the first round of data loading happened
      delete params.id
    } else {
      params.from = 0
    }

    // set up the search field
    trigger("search:clear")

    const urlParams = getURLParams()
    const values = []

    Object.keys(urlParams).forEach(key => {
      if (key === "q") {
        values.push(`${urlParams[key]}`)
      } else if (config().ADVANCED_SEARCH_KEYS.includes(key) && urlParams.advancedSearch) {
        values.push(`${key}:${urlParams[key]}`)
      }
    })

    setTimeout(() => {
      trigger("search:setValue", { value: values.join(",") })
    }, 20)

    // show loading indicator
    setTimeout(() => {
      trigger("loader:show", { id: "loaderBase" })
    }, 10)

    // request loading photos through the photoManager module (silent, no event triggered)
    const respData = await photoManager.loadPhotoData(params, true)

    // init timeline after we have data loaded
    trigger("timeline:reset")

    this.generateThumbnailsFromData(respData, insertBefore)

    return respData
  }

  // event listener for photoManager:load
  onPhotoDataLoaded(e) {
    if (e && e.detail) {
      const insertBefore = e.detail.reverseOrder
      // generate thumbnails
      this.generateThumbnailsFromData(e.detail, insertBefore)
    }
  }

  // Custom event to load content and update page meta tag
  historyPushState(e) {
    window.history.pushState(null, lang("search"), e.detail.url)
    this.onPopState(e)
  }

  resetPhotosGrid() {
    this.selectedThumbnail = null

    // Empty photosNode and reset counters
    while (this.gridTarget.firstChild) {
      this.gridTarget.firstChild.remove()
    }

    this.element.scrollTop = 0
    this.thumbnailsCount = 0
  }

  // Load new photos when address bar url changes
  onPopState(e) {
    // Empty photosNode and reset counters when resetPhotosGrid parameter is set
    if ((e && e.detail && e.detail.resetPhotosGrid === true) || (e && e.type)) {
      this.resetPhotosGrid()

      // clear all stored photo data as the search context changed completely
      photoManager.clearAllData()
    }

    if (e && e.detail && e.detail.jumpToYearAfter) {
      // if jumpToYearAfter flag is given, dispatch a new year selection event
      // this is a delayed year selection method
      trigger("timeline:yearSelected", { year: e.detail.jumpToYearAfter })
    } else {
      // load photos then...
      this.loadPhotos().then(respData => {
        // hook for the special case when the query is a photo id, open the carousel
        if (respData.items.length === 1 && getURLParams().q === respData.items[0].mid.toString()) {
          trigger("photos:historyPushState", { url: `?id=${respData.items[0].mid}`, resetPhotosGrid: true })
          return
        }

        if (getURLParams().id > 0) {
          // open carousel if @id parameter is present in the url's query string
          const selectedPhoto = photoManager.selectPhotoById(getURLParams().id)
          trigger("thumbnail:click", { data: selectedPhoto.data })
        } else {
          trigger("photosCarousel:close")
        }

        if (getURLParams().year > 0) {
          // make sure the timeline gets the memo of the given year
          trigger("photos:yearChanged", { year: getURLParams().year })
        }
      })
    }
  }

  // Set a thumbnail's selected state
  selectThumbnail(e = null, index = -1) {
    if ((e && e.detail && e.detail.index > -1) || index !== -1) {
      // change status of the currently selected thumbnail
      if (this.selectedThumbnail) this.selectedThumbnail.classList.remove("is-selected")

      const selectedIndex = e && e.detail && e.detail.index > -1 ? e.detail.index : index

      const element = this.element.querySelectorAll(".photos-thumbnail")[selectedIndex]

      if (element) {
        // set a new selected thumbnail based on event data
        this.selectedThumbnail = element
        this.selectedThumbnail.classList.add("is-selected")
      }
    }
  }

  scrollToSelectedThumbnail(lockYearOnScroll = false) {
    // scroll to thumbnail if it's not in the viewport
    if (this.selectedThumbnail) {
      if (!isElementInViewport(this.selectedThumbnail.querySelector(".photos-thumbnail__image"))) {
        const viewportOffsetTop =
          document.querySelector(".header-nav").offsetHeight +
          document.querySelector(".photos-timeline").offsetHeight +
          16

        this.element.scrollTop = this.selectedThumbnail.offsetTop - viewportOffsetTop

        if (!lockYearOnScroll) {
          // reset first the year in viewport to force a new calculation
          delete this.yearInViewPort
          this.calcYearOfViewport()
        }
      }
    }
  }

  // event listener to photoManager:cacheCleared
  onPhotoCacheCleared() {
    this.resetPhotosGrid()
  }

  // event listener to photoCarousel:closed
  onCarouselClosed() {
    if (this.selectedThumbnail) {
      this.scrollToSelectedThumbnail()
    }

    this.onScroll()
  }

  // event listener for timeline:yearSelected
  onYearSelected(e) {
    const carouselElement = document.querySelector(".carousel")

    if (
      (!carouselElement || (carouselElement && !carouselElement.classList.contains("is-visible"))) &&
      e &&
      e.detail &&
      e.detail.year
    ) {
      if (this.selectedThumbnail) {
        this.selectedThumbnail.classList.remove("is-selected")
        this.selectedThumbnail = null
      }

      // set a flag if we need to select the next photo in the year
      // this only applies if we don't need to load a new set but the photo data is already loaded
      let selectAfterLoad = true

      // show loader based on if we have any data for the given year
      if (!photoManager.hasPhotoDataOfYear(e.detail.year)) {
        trigger("loader:show", { id: "loaderBase" })

        // set the select after load flag to false (to load a new set without selection)
        selectAfterLoad = false
      }

      photoManager.getFirstPhotoOfYear(e.detail.year, selectAfterLoad).then(() => {
        if (selectAfterLoad) {
          // avoid setting the year again when we scroll
          // (it has been set already, and we should avoid jumping of the timeline slider)
          this.lockYearOnScroll = true

          this.scrollToSelectedThumbnail(this.lockYearOnScroll)
        }
      })
    }
  }
}
