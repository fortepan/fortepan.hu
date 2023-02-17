import { Controller } from "stimulus"

import throttle from "lodash/throttle"
import searchAPI from "../../api/search"
import { getLocale, numberWithCommas, trigger } from "../../js/utils"
import config from "../../data/siteConfig"
import photoManager from "../../js/photo-manager"

let bgIds = [50563, 52724, 54176, 54178, 55558, 55617, 58473, 60057, 60155, 60490, 71299, 71443, 71955, 78498, 78835]

export default class extends Controller {
  static get targets() {
    return ["heroBg", "thumbnails", "total", "totalVal"]
  }

  connect() {
    if (this.heroBgTarget.dataset.bgId) {
      bgIds = this.heroBgTarget.dataset.bgId.split(",")
    }

    this.loadBackgroundImage()
    this.getTotalItemsNumber()

    // Throttle resize and scroll functions
    this.onScroll = throttle(this.onScroll, 200)
    this.resizeThumbnails = throttle(this.resizeThumbnails, 500)
  }

  /**
   * Load photos randomly to the hero background
   */
  loadBackgroundImage() {
    const img = new Image()

    const onLoad = () => {
      this.heroBgTarget.style.backgroundImage = `url("${img.src}")`
      this.heroBgTarget.classList.add("is-visible")
    }
    img.addEventListener("load", onLoad.bind(this))

    const id = bgIds[Math.floor(Math.random() * bgIds.length)]
    img.src = `${config.PHOTO_SOURCE}${window.innerWidth > 1600 ? 2560 : 1600}/fortepan_${id}.jpg`

    this.initTimeline(id)
  }

  async initTimeline(id) {
    // get default and seatch query params
    const params = {
      id,
      from: 0, // needs to pass this to get years parameter back
      size: 10,
      exclude: [{ term: { cimke_search: "18+" } }, { term: { cimke_en_search: "18+" } }],
    }

    // request loading photos through the photoManager module
    // to get the functionalities the timeline requires
    await photoManager.loadPhotoData(params)

    // load the previous and next photos too - the # of photos is defined in params.size
    await photoManager.loadMorePhotoDataInContext()
    await photoManager.loadMorePhotoDataInContext(true) // passing true loads a set before the first

    // select the photo by the id to get the right date displayed on the timeline
    photoManager.selectPhotoById(id)

    const photoData = photoManager.getData().result

    // generate the thumbnails
    photoData.items.forEach(item => {
      // clone thumnail template
      const template = document.getElementById("photos-thumbnail")
      const thumbnail = template.content.firstElementChild.cloneNode(true)

      this.thumbnailsTarget.appendChild(thumbnail)

      // set thumnail node element index
      thumbnail.index = Array.prototype.indexOf.call(thumbnail.parentElement.children, thumbnail) + 1

      // apply photo id to node
      thumbnail.photoId = item.mid

      // apply year data to node
      thumbnail.year = item.year

      // forcing to display the thumbnail always in small
      thumbnail.forceSmallSize = true
    })

    this.element.querySelector(".photos-timeline").classList.add("is-visible")

    // selecting the current thumbnail
    this.element
      .querySelectorAll(".photos-thumbnail")
      [photoManager.getSelectedPhotoIndex()].classList.add("is-selected")

    this.centerSelectedThumbnail()

    Promise.resolve(true).then(() => {
      this.onScroll()
      this.resizeThumbnails()
    })
  }

  /**
   * Get the total number of photos and inject the result
   */
  getTotalItemsNumber() {
    searchAPI.getTotal().then(data => {
      this.totalValTarget.textContent = numberWithCommas(data.total)
      this.totalTarget.classList.add("is-visible")
    })
  }

  onYearSelected(e) {
    if (e && e.detail && e.detail.year) {
      clearTimeout(this.timelineTimout)

      if (e.type === "timeline:yearSelected") {
        // set some timeout so the seek animation on the timeline can finish first
        this.timelineTimout = setTimeout(() => {
          window.location = `/${getLocale()}/photos/?year=${e.detail.year}`
        }, 500)
      } else {
        window.location = `/${getLocale()}/photos/?year=${e.detail.year}`
      }
    }
  }

  // USP list items click handler
  onUspCoverClick(e) {
    if (e) {
      e.preventDefault()

      const link = e.currentTarget.parentElement.querySelector("h5 a")
      if (link && link.href) {
        if (link.target === "_blank") {
          window.open(link.href, "_blank")
        } else {
          window.location = link.href
        }
      }
    }
  }

  // loading thumbnail images when scrolling
  onScroll() {
    this.element.querySelectorAll(".photos-thumbnail:not(.is-loaded)").forEach(thumbnail => {
      thumbnail.photosThumbnail.loadThumbnailImage()
    })

    trigger("scrollView:scroll")
  }

  // resize thumbnails when window gets resized
  resizeThumbnails() {
    this.element.querySelectorAll(".photos-thumbnail").forEach(thumbnail => {
      thumbnail.photosThumbnail.resize()
    })

    this.centerSelectedThumbnail()
  }

  // centering the selected thumbnail
  centerSelectedThumbnail() {
    const thumb = this.thumbnailsTarget.querySelector(".photos-thumbnail.is-selected")
    this.element.querySelector(".home__thumbnails-wrapper").scrollLeft =
      thumb.offsetLeft - (window.innerWidth - thumb.offsetWidth) / 2
  }

  onThumbnailClicked(e) {
    if (e?.detail?.data?.mid) {
      window.location = `/${getLocale()}/photos/?id=${e?.detail?.data?.mid}`
    }
  }
}
