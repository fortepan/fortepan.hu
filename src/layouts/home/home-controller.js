import { Controller } from "stimulus"

import searchAPI from "../../api/search"
import { getLocale, numberWithCommas } from "../../js/utils"
import config from "../../data/siteConfig"
import photoManager from "../../js/photo-manager"

let bgIds = [50563, 52724, 54176, 54178, 55558, 55617, 58473, 60057, 60155, 60490, 71299, 71443, 71955, 78498, 78835]

export default class extends Controller {
  static get targets() {
    return ["heroBg", "total", "totalVal"]
  }

  connect() {
    if (this.heroBgTarget.dataset.bgId) {
      bgIds = this.heroBgTarget.dataset.bgId.split(",")
    }

    this.loadBackgroundImage()
    this.getTotalItemsNumber()
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
    img.src = `${config.PHOTO_SOURCE}1600/fortepan_${id}.jpg`

    this.initTimeline(id)
  }

  async initTimeline(id) {
    // get default and seatch query params
    const params = {
      id,
      from: 0, // needs to pass this to get years parameter back
    }

    // request loading photos through the photoManager module
    // to get the functionalities the timeline requires
    await photoManager.loadPhotoData(params)
    // select the photo by the id to get the right date displayed on the timeline
    photoManager.selectPhotoById(id)

    this.element.querySelector(".photos-timeline").classList.add("is-visible")
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
}
