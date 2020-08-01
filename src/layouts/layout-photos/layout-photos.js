import throttle from "lodash/throttle"
import config from "../../config"
import { lang, trigger, getURLParams, isElementInViewport } from "../../utils"
import searchAPI from "../../api/search"

class LayoutPhotos extends HTMLElement {
  constructor() {
    super()
    this.photosGridNode = this.querySelector(".layout-photos__grid")
    this.selectedThumbnail = null
    this.thumbnailsCount = 0
    this.thumbnailsLoading = false
    this.timelineNode = document.querySelector(".photos-timeline")

    // bind custom events and events
    this.bindCustomEvents()

    // bind scroll event to photos
    this.onScroll = this.onScroll.bind(this)
    this.addEventListener("scroll", throttle(this.onScroll, 200))

    // History API
    // Custom event to load content and update page meta tag
    document.addEventListener("layoutPhotos:historyPushState", e => {
      window.history.pushState(null, lang("search"), e.detail.url)
      this.onPopState(e)
    })
    window.onpopstate = e => {
      this.onPopState(e)
    }
    this.onPopState()

    // resize thumbnails when window gets resized
    window.addEventListener(
      "resize",
      throttle(function() {
        this.querySelectorAll(".photos-thumbnail").forEach(thumbnail => {
          thumbnail.resize()
        })
      }, 1000).bind(this)
    )
  }

  onScroll() {
    // auto-load new items when scrolling reaches the bottom of the page
    if (
      this.scrollTop + this.offsetHeight >= this.scrollHeight &&
      !this.thumbnailsLoading &&
      this.thumbnailsCount % config.THUMBNAILS_QUERY_LIMIT === 0 &&
      this.thumbnailsCount > 0
    ) {
      this.thumbnailsLoading = true
      this.loadPhotos()
    }
  }

  loadPhotos() {
    return new Promise(
      function(resolve, reject) {
        const params = {}
        const defaultParams = {
          size: config.THUMBNAILS_QUERY_LIMIT,
          from: this.thumbnailsCount,
        }
        const urlParams = getURLParams()

        // merge default params with query params
        Object.assign(params, defaultParams, urlParams)

        // init timeline
        this.timelineNode.reset = { start: params.year_from, end: params.year_to }
        if (params.year) {
          this.timelineNode.disable()
        }

        if (!params.q) {
          // clear all search fields if query is not defined in the request
          trigger("inputSearch:clear")
        } else {
          // set all search fields' value if query param is set
          trigger("inputSearch:setValue", { value: params.q })
        }

        // search for photos
        searchAPI.search(
          params,
          data => {
            document.querySelector(".photos-title").set(data.hits.total.value)
            data.hits.hits.forEach(itemData => {
              this.thumbnailsCount += 1
              const thumbnail = document.createElement("photos-thumbnail")
              this.photosGridNode.appendChild(thumbnail)
              thumbnail.bindData = itemData
            })
            this.thumbnailsLoading = false
            resolve()
          },
          statusText => {
            reject(statusText)
          }
        )
      }.bind(this)
    )
  }

  // and load new photos when address bar url changes
  onPopState(e) {
    // Empty photosNode and reset counters when resetPhotosGrid parameter is set
    if ((e && e.detail && e.detail.resetPhotosGrid === true) || (e && e.type)) {
      while (this.photosGridNode.firstChild) {
        this.photosGridNode.firstChild.remove()
      }
      this.scrollTop = 0
      this.thumbnailsCount = 0
    }

    // load photos
    this.loadPhotos().then(() => {
      // open carousel if @id parameter is present in the url's query string
      if (getURLParams().id > 0) {
        // show carousel with an image
        if (document.querySelector(".photos-thumbnail")) document.querySelector(".photos-thumbnail").click()
      } else {
        trigger("photosCarousel:hide")
      }
    })
  }

  bindCustomEvents() {
    // Bind custom events
    // select next photo and open carousel
    document.addEventListener(
      "layoutPhotos:showNextPhoto",
      function() {
        let next = this.selectedThumbnail.nextElementSibling
        if (next) {
          trigger("photosCarousel:hidePhotos")
          next.click()
        } else if (this.thumbnailsCount % config.THUMBNAILS_QUERY_LIMIT === 0 && this.thumbnailsCount > 0) {
          this.thumbnailsLoading = true
          this.loadPhotos().then(
            function() {
              next = this.selectedThumbnail.nextElementSibling
              if (next) {
                trigger("photosCarousel:hidePhotos")
                next.click()
              }
            }.bind(this)
          )
        }
      }.bind(this)
    )

    // select previous photo and open carousel
    document.addEventListener(
      "layoutPhotos:showPrevPhoto",
      function() {
        const prev = this.selectedThumbnail.previousElementSibling
        if (prev) {
          trigger("photosCarousel:hidePhotos")
          prev.click()
        }
      }.bind(this)
    )

    // set new selected thumbnail
    document.addEventListener(
      "layoutPhotos:selectThumbnail",
      function(e) {
        if (e.detail && e.detail.node) {
          if (this.selectedThumbnail) this.selectedThumbnail.classList.remove("is-selected")
          this.selectedThumbnail = e.detail.node
          this.selectedThumbnail.classList.add("is-selected")
        }
      }.bind(this)
    )

    // when carousel gets closed...
    document.addEventListener(
      "photosCarousel:hide",
      function() {
        // ...scroll to thumbnail if it's not in the viewport
        if (this.selectedThumbnail) {
          if (!isElementInViewport(this.selectedThumbnail.querySelector(".photos-thumbnail__image"))) {
            this.scrollTop = this.selectedThumbnail.offsetTop - 16 - document.querySelector(".header-nav").offsetHeight
          }
        }
      }.bind(this)
    )
  }
}
window.customElements.define("layout-photos", LayoutPhotos)
