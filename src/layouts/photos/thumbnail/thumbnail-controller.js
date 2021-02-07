import { Controller } from "stimulus"

import config from "../../../data/siteConfig"
import { lang, trigger, setPageMeta } from "../../../js/utils"

const THUMBNAIL_HEIGHT = 160
export default class extends Controller {
  static get targets() {
    return ["image", "container", "description", "location"]
  }

  connect() {
    // add stimulus class reference to node
    this.element.photosThumbnail = this

    // apply element data
    this.applyThumbnailData()

    // load thumbnail image
    this.loadThumbnailImage()
  }

  clicked() {
    const data = this.element.itemData

    // select thumbnail in photos list
    trigger("photos:selectThumbnail", { node: this.element })

    // Load photo in Carousel
    trigger("photosCarousel:showPhoto")

    // set html page meta for social sharing
    setPageMeta(
      `#${data.mid}`,
      `${data.description ? `${data.description} — ` : ""}${lang("donor")}: ${data.donor} (${data.year})`,
      `${config.PHOTO_SOURCE}${data.mid}.jpg`
    )
  }

  // resize thumbnail when the browser window gets resized
  resize() {
    const h = window.innerWidth < 640 ? (THUMBNAIL_HEIGHT * 2) / 3 : THUMBNAIL_HEIGHT
    if (!this.naturalWidth) return
    this.containerTarget.style.height = `${h}px`
    const w = Math.min(240, (this.naturalWidth / this.naturalHeight) * h)
    this.element.style.flex = `${w}`
    this.element.style.minWidth = `${w}px`
  }

  show() {
    this.element.classList.remove("is-hidden")
    setTimeout(() => {
      this.element.classList.add("is-visible")
    }, 100)
  }

  // set thumbnail meta data
  applyThumbnailData() {
    const data = this.element.itemData
    const locationArray = [data.year, data.city, data.place]
    if (!data.city && !data.place && data.country) locationArray.push(data.country)
    this.locationTarget.textContent = locationArray.filter(Boolean).join(" · ")
    this.descriptionTarget.textContent = data.description || ""
  }

  // load thumbnail image
  loadThumbnailImage() {
    const data = this.element.itemData

    this.imageTarget.addEventListener("load", () => {
      this.naturalWidth = this.imageTarget.naturalWidth
      this.naturalHeight = this.imageTarget.naturalHeight
      this.resize()

      this.element.classList.add("is-loaded")
    })

    this.imageTarget.addEventListener("error", () => {
      this.element.classList.add("is-failed-loading")
    })

    this.imageTarget.srcset = `${config.PHOTO_SOURCE}240/fortepan_${data.mid}.jpg 1x, ${config.PHOTO_SOURCE}480/fortepan_${data.mid}.jpg 2x`
    this.imageTarget.src = `${config.PHOTO_SOURCE}240/fortepan_${data.mid}.jpg`
  }
}
