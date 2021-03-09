import { Controller } from "stimulus"

import throttle from "lodash/throttle"
import config from "../../data/siteConfig"
import { lang, trigger, getURLParams, isElementInViewport } from "../../js/utils"
import photoManager from "../../js/photo-manager"

export default class extends Controller {
  static get targets() {
    return ["grid", "bottomActions"]
  }

  connect() {
    this.selectedThumbnail = null

    this.thumbnailsCount = 0
    this.thumbnailsLoading = false

    // Throttle resize and scroll functions
    this.onScroll = throttle(this.onScroll, 200)
    this.resizeThumbnails = throttle(this.resizeThumbnails, 500)

    // populate page content for the first time
    this.onPopState()
  }

  // resize thumbnails when window gets resized
  resizeThumbnails() {
    this.element.querySelectorAll(".photos-thumbnail").forEach(thumbnail => {
      thumbnail.photosThumbnail.resize()
    })
    this.toggleLoadMoreButton()
  }

  // auto-load new items when scrolling reaches the bottom of the page
  onScroll() {
    if (
      !this.thumbnailsLoading &&
      this.thumbnailsCount > 0 &&
      (this.element.scrollTop + this.element.offsetHeight >= this.element.scrollHeight - 150 ||
        this.element.scrollTop <= 0)
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
  }

  calcYearOfViewport() {
    let year = -1
    if (!this.yearInViewPort) this.yearInViewPort = parseInt(photoManager.getFirstPhotoData().year, 10)

    this.element.querySelectorAll(".photos-thumbnail").forEach(item => {
      if (
        item.offsetTop > this.element.scrollTop + document.querySelector(".header-nav").offsetHeight + 16 &&
        year === -1
      ) {
        year = item.year
        if (year !== this.yearInViewPort) {
          this.yearInViewPort = year

          // dispatches a custom event if the year has changed
          trigger("photos:yearChanged", { year: this.yearInViewPort })
        }
      }
    })
  }

  // show all loaded thumbnailnails at once
  showAllLoadedThumbnails() {
    this.element.querySelectorAll(".photos-thumbnail.is-loaded:not(.is-visible)").forEach(thumbnail => {
      thumbnail.photosThumbnail.show()
    })
  }

  toggleLoadMoreButton() {
    if (
      this.thumbnailsCount % config.THUMBNAILS_QUERY_LIMIT === 0 &&
      this.thumbnailsCount > 0 &&
      this.offsetHeight - this.scrollHeight >= 0
    ) {
      this.bottomActionsTarget.classList.remove("is-hidden")
    } else {
      this.bottomActionsTarget.classList.add("is-hidden")
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
  // and starts loading the thumbnails with Promise.all
  generateThumbnailsFromData(data, insertBefore = false) {
    const thumbnailLoadingPromises = []

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

      // observe when the thumbnail class attribute changes and contains 'is-loaded'
      const thumbnailLoadingPromise = new Promise(res => {
        const classObserver = new window.MutationObserver(() => {
          if (thumbnail.classList.contains("is-loaded") || thumbnail.classList.contains("is-failed-loading")) res()
        })
        classObserver.observe(thumbnail, {
          attributes: true,
          attributeFilter: ["class"],
        })
      })
      thumbnailLoadingPromises.push(thumbnailLoadingPromise)
    })

    // load all thumbnail images
    Promise.all(thumbnailLoadingPromises).then(() => {
      this.thumbnailsLoading = false

      trigger("loader:hide", { id: "loaderBase" })
      this.showAllLoadedThumbnails()
      this.toggleLoadMoreButton()

      // keep the scrolling position after inserting the new elements on the beginning of the list
      if (insertBefore && insertBeforeTarget) {
        this.element.scrollTop = scrollPosition + (this.element.scrollHeight - scrollH)
      }
    })
  }

  // async function that loads thumbnail data based on the search query
  async loadPhotos(insertBefore) {
    // get default and seatch query params
    const params = {}

    const defaultParams = {
      size: config.THUMBNAILS_QUERY_LIMIT,
    }

    if (this.thumbnailsCount > 0) {
      if (insertBefore) {
        defaultParams.search_after = photoManager.getFirstPhotoData().search_after
        defaultParams.reverseOrder = true
      } else {
        defaultParams.search_after = photoManager.getLastPhotoData().search_after
      }
    } else {
      defaultParams.from = 0
    }

    const urlParams = getURLParams()

    // merge default params with query params
    Object.assign(params, defaultParams, urlParams)

    // if year url query filter is present, the timeline should be hidden
    if (params.year) {
      trigger("timeline:disable")
    }

    if (!params.q) {
      // clear all search fields if query is not defined in the request
      trigger("search:clear")
    } else {
      // set all search fields' value if query param is set
      setTimeout(() => {
        trigger("search:setValue", { value: params.q })
      }, 20)
    }

    // show loading indicator
    setTimeout(() => {
      trigger("loader:show", { id: "loaderBase" })
    }, 10)

    // request loading photos through the photoManager module
    const respData = await photoManager.loadPhotoData(params, true)

    // init timeline after we have data loaded
    trigger("timeline:reset")

    this.generateThumbnailsFromData(respData, insertBefore)
  }

  // event listener for photoManager:load
  onPhotoDataLoaded(e) {
    if (e && e.detail && e.detail) {
      // generate thumbnails
      this.generateThumbnailsFromData(e.detail)
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

    // load photos then...
    this.loadPhotos().then(() => {
      // open carousel if @id parameter is present in the url's query string
      if (getURLParams().id > 0) {
        // load the next photos to fill up the grid in the background
        photoManager.loadMorePhotoDataInContext().then(result => {
          this.generateThumbnailsFromData(result)
        })

        // show carousel with an image
        const photoData = photoManager.selectPhotoById(getURLParams().id)
        trigger("photosCarousel:showPhoto", { data: photoData.data })
      } else {
        trigger("photosCarousel:close")
      }
    })

    // track pageview when page url changes
    // but skip tracking when page loads for the first time as GA triggers a pageview when it gets initialized
    if (e) trigger("analytics:trackPageView")
  }

  // Set a thumbnail's selected state
  selectThumbnail(e = null, index = -1) {
    if ((e && e.detail && e.detail.index !== -1 && e.detail.index !== undefined) || index !== -1) {
      // change status of the currently selected thumbnail
      if (this.selectedThumbnail) this.selectedThumbnail.classList.remove("is-selected")

      const selectedIndex =
        e && e.detail && e.detail.index !== -1 && e.detail.index !== undefined ? e.detail.index : index

      const element = this.element.querySelectorAll(".photos-thumbnail")[selectedIndex]

      if (element) {
        // set a new selected thumbnail based on event data
        this.selectedThumbnail = element
        this.selectedThumbnail.classList.add("is-selected")
      }
    }
  }

  scrollToSelectedThumbnail() {
    // scroll to thumbnail if it's not in the viewport
    if (this.selectedThumbnail) {
      if (!isElementInViewport(this.selectedThumbnail.querySelector(".photos-thumbnail__image"))) {
        this.element.scrollTop =
          this.selectedThumbnail.offsetTop - 16 - document.querySelector(".header-nav").offsetHeight

        // reset first the year in viewport to force a new calculation
        delete this.yearInViewPort
        this.calcYearOfViewport()
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
  }

  // event listener for timeline:yearSelected
  onYearSelected(e) {
    if (e && e.detail && e.detail.dispatcher && e.detail.dispatcher.id === "photosTimeline" && e.detail.year) {
      this.selectedThumbnail = null
      let selectAfterLoad = true

      // show loader based on if we have any data for the given year
      if (!photoManager.hasPhotoDataOfYear(e.detail.year)) {
        trigger("loader:show", { id: "loaderBase" })

        // select and scroll to photo
        selectAfterLoad = false
      }

      photoManager.getFirstPhotoOfYear(e.detail.year, selectAfterLoad).then(() => {
        this.scrollToSelectedThumbnail()
      })
    }
  }
}
