import config from "../../config"
import { lang, trigger, setPageMeta } from "../../utils"

const THUMBNAIL_HEIGHT = 160

class PhotosThumbnail extends HTMLElement {
  connectedCallback() {
    // add default classNames
    this.className = "photos-thumbnail is-hidden"

    // bind events
    this.bindEvents()
  }

  bindEvents() {
    this.addEventListener(
      "click",
      function() {
        // select thumbnail in photos list
        trigger("layoutPhotos:selectThumbnail", { node: this })

        // Load photo in Carousel
        trigger("photosCarousel:showPhoto", this.data)

        // set html page meta for social sharing
        setPageMeta(
          `#${this.data.mid}`,
          `${this.data.description ? `${this.data.description} — ` : ""}${lang("donor")}: ${
            this.data.adomanyozo_name
          } (${this.data.year})`,
          `${config.PHOTO_SOURCE}${this.data.mid}.jpg`
        )
      }.bind(this)
    )
  }

  set bindData(d) {
    // eslint-disable-next-line no-underscore-dangle
    this.data = d._source

    // inject extra data
    this.data.elIndex = Array.prototype.indexOf.call(this.parentElement.children, this) + 1
    this.data.thumbnailNode = this

    // extend custom element with nodes
    this.innerHTML = `
     <div class="photos-thumbnail__image"></div>
     <div class="photos-thumbnail__meta photos-thumbnail__meta--location"></div>
     <div class="photos-thumbnail__meta photos-thumbnail__meta--description"></div>`

    // render thumbnail data
    this.render()

    // load thumbnail image
    this.loadImage()
  }

  resize() {
    const i = this.querySelector(".photos-thumbnail__image")
    const h = window.innerWidth < 640 ? (THUMBNAIL_HEIGHT * 2) / 3 : THUMBNAIL_HEIGHT
    if (!this.naturalWidth) return
    i.style.height = `${h}px`
    const w = (this.naturalWidth / this.naturalHeight) * h
    this.style.flex = `${w}`
    this.style.minWidth = `${w}px`
  }

  render() {
    // Fill template with data
    const locationArray = []
    if (this.data.year) locationArray.push(this.data.year)
    if (this.data.varos_name) locationArray.push(this.data.varos_name)
    if (this.data.helyszin_name) locationArray.push(this.data.helyszin_name)
    if (!this.data.varos_name && !this.data.helyszin_name && this.data.orszag_name)
      locationArray.push(this.data.orszag_name)
    this.querySelector(".photos-thumbnail__meta--location").textContent = locationArray.join(" · ")
    this.querySelector(".photos-thumbnail__meta--description").textContent = this.data.description
      ? this.data.description
      : ""
  }

  loadImage() {
    const img = new Image()
    const imgContainer = this.querySelector(".photos-thumbnail__image")
    img.draggable = false

    img.addEventListener(
      "load",
      function() {
        this.naturalWidth = img.naturalWidth
        this.naturalHeight = img.naturalHeight
        imgContainer.parentNode.classList.remove("is-hidden")

        setTimeout(() => {
          imgContainer.parentNode.classList.add("is-visible")
        }, 100)

        this.resize(imgContainer.parentNode)
      }.bind(this)
    )

    img.srcset = `${config.PHOTO_SOURCE}240/fortepan_${this.data.mid}.jpg 1x, ${config.PHOTO_SOURCE}480/fortepan_${this.data.mid}.jpg 2x`
    img.src = `${config.PHOTO_SOURCE}240/fortepan_${this.data.mid}.jpg`
    imgContainer.appendChild(img)
  }
}
window.customElements.define("photos-thumbnail", PhotosThumbnail)
