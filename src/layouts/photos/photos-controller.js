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
      this.element.scrollTop + this.element.offsetHeight >= this.element.scrollHeight - 150 &&
      !this.thumbnailsLoading &&
      this.thumbnailsCount % config.THUMBNAILS_QUERY_LIMIT === 0 &&
      this.thumbnailsCount > 0
    ) {
      this.thumbnailsLoading = true
      this.loadPhotos()
    }
  }

  // show all loaded thumbnails at once
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
    e.currentTarget.classList.add("is-hidden")
    this.thumbnailsLoading = true
    this.loadPhotos()
  }

  // this method generates the tumbnails from the data attribute
  // and starts loading the thumbnails with Promise.all
  generateThumbnailsFromData(data) {
    const thumbnailLoadingPromises = []

    trigger("photosTitle:setTitle", { count: data.total })

    data.items.forEach(item => {
      // count results
      this.thumbnailsCount += 1

      // clone thumnail template
      const template = document.getElementById("photos-thumbnail")
      const thumbnail = template.content.firstElementChild.cloneNode(true)
      this.gridTarget.appendChild(thumbnail)

      // set thumnail node element index
      thumbnail.index = Array.prototype.indexOf.call(thumbnail.parentElement.children, thumbnail) + 1

      // apply thumnail data to node
      thumbnail.photoId = item.mid

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
    })
  }

  // async function that loads thumbnail data based on the search query
  async loadPhotos(context) {
    // get default and seatch query params
    const params = {}

    if (context) {
      Object.assign(params, context)
    } else {
      const defaultParams = {
        size: config.THUMBNAILS_QUERY_LIMIT,
      }

      if (this.thumbnailsCount > 0) {
        defaultParams.search_after = photoManager.getLastPhotoData().search_after
      } else {
        defaultParams.from = 0
      }

      const urlParams = getURLParams()

      // merge default params with query params
      Object.assign(params, defaultParams, urlParams)
    }

    // init timeline with the reqested url query params
    trigger("timeline:reset")

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

    this.generateThumbnailsFromData(respData)
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
    // Empty photosNode and reset counters
    while (this.gridTarget.firstChild) {
      this.gridTarget.firstChild.remove()
    }
    this.scrollTop = 0
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
  selectThumbnail(e) {
    if (e.detail && e.detail.index !== -1 && e.detail.index !== undefined) {
      // change status of the currently selected thumbnail
      if (this.selectedThumbnail) this.selectedThumbnail.classList.remove("is-selected")

      const element = this.element.querySelectorAll(".photos-thumbnail")[e.detail.index]

      if (element) {
        // set a new selected thumbnail based on event data
        this.selectedThumbnail = element
        this.selectedThumbnail.classList.add("is-selected")
      }
    }
  }

  // when carousel gets closed...
  scrollToSelectedThumbnail() {
    // ...scroll to thumbnail if it's not in the viewport
    if (this.selectedThumbnail) {
      if (!isElementInViewport(this.selectedThumbnail.querySelector(".photos-thumbnail__image"))) {
        this.scrollTop = this.selectedThumbnail.offsetTop - 16 - document.querySelector(".header-nav").offsetHeight
      }
    }
  }

  // event listener to photoManager:cacheCleared
  onPhotoCacheCleared(e) {
    if (e && e.detail && e.detail.context) {
      this.needToReload = true

      this.latestContext = e.detail.context
      if (this.latestContext.id) delete this.latestContext.id
      if (this.latestContext.search_after) delete this.latestContext.search_after
      this.latestContext.from = 0
    }
  }

  // event listener to photoCarousel:closed
  onCarouselClosed() {
    if (getURLParams().id > 0) {
      // load all photos if there's only one photo loaded in the carousel
      trigger("photos:historyPushState", { url: "?q=", resetPhotosGrid: true })
    } else if (this.needToReload && this.latestContext) {
      // or else if the photogrid containts photos in a nonlinear way because of previous cache change
      // load the context again from scratch
      this.resetPhotosGrid()
      this.loadPhotos(this.latestContext)

      delete this.needToReload
    } else {
      // or just scroll to the selected thumbnail
      this.scrollToSelectedThumbnail()
    }
  }
}
