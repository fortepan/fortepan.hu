import { Controller } from "stimulus"

import searchAPI from "../../api/search"
import { getLocale, numberWithCommas, setPageMeta } from "../../js/utils"
import config from "../../data/siteConfig"
import photoManager from "../../js/photo-manager"

export default class extends Controller {
  static get targets() {
    return ["heroBg", "total", "totalVal", "title", "content", "description", "announcementtitle", "announcementcaption", "announcementcontent", "buttons"]
  }

  connect() {

    this.getTotalItemsNumber()
    this.renderContent()
  }

  renderContent() {
    console.log('content for landing::')
    searchAPI.getLanding().then(data => {
      setPageMeta(data.title, data.content, null)
      this.loadBackgroundImage(data.media)
      this.contentTarget.innerText = data.description_long_on_right
      this.descriptionTarget.innerText = data.description_short_on_left
      this.announcementtitleTarget.innerText = data.announcement_title
      this.announcementcaptionTarget.innerText = data.announcement_caption
      this.announcementcontentTarget.innerText = data.announcement_content
      this.renderButtons(data.buttons)
    })
  }

  renderButtons(buttons) {
    buttons.forEach(item => {
      let button = document.createElement("a")
      button.textContent = item.text
      button.innerHTML += '&nbsp;<svg xmlns="http://www.w3.org/2000/svg" width="14" height="10" viewBox="0 0 14 10"> <path   fill="none"   stroke="currentColor"   stroke-linecap="round"   stroke-linejoin="round"   stroke-width="2"   d="M2,6 L6,10 L10,6 M6,-2 L6,9"   transform="rotate(-90 7 4)" /></svg>'
      button.classList.add("button")
      button.href = item.link
      button.classList.add("button--medium")
      button.classList.add("button--primary")
      this.buttonsTarget.appendChild(button)
    });
  }
  /**
   * Load photos randomly to the hero background
   */
  loadBackgroundImage(photo) {
    const img = new Image()
    img.src = `${config.PHOTO_SOURCE}/photo/thumbnail-${window.innerWidth > 1600 ? 2560 : 1600}-${photo.photo}`
    const onLoad = () => {
      this.heroBgTarget.style.backgroundImage = `url("${img.src}")`
      this.heroBgTarget.classList.add("is-visible")
    }
    img.addEventListener("load", onLoad.bind(this))

    // const id = bgIds[Math.floor(Math.random() * bgIds.length)]
    
    // TODO: generate also a 2560 preview and a 1600 preview in the backend
    // img.src = `${config.PHOTO_SOURCE}photo/${id}`

    this.initTimeline(photo.id)
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
    photoManager.selectPhotoById(id, false)

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
