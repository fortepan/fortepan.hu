import { Controller } from "stimulus"

import searchAPI from "../../api/search"
import { getLocale, numberWithCommas, setPageMeta, photoRes, getOrg } from "../../js/utils"
import photoManager from "../../js/photo-manager"

export default class extends Controller {
  static get targets() {
    return [
      "heroBg",
      "total",
      "totalVal",
      "extraText",
      "homeText",
      "title",
      "content",
      "description",
      "announcementtitle",
      "announcementcaption",
      "announcementcontent",
      "buttons",
    ]
  }

  connect() {
    this.getTotalItemsNumber()
    this.renderContent()
  }

  renderContent() {
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
      const button = document.createElement("a")
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
    img.src = photoRes('large', photo.photo)
    const onLoad = () => {
      this.heroBgTarget.style.backgroundImage = `url("${img.src}")`
      this.heroBgTarget.classList.add("is-visible")
    }
    img.addEventListener("load", onLoad.bind(this))

    // const id = bgIds[Math.floor(Math.random() * bgIds.length)]
    // TODO: generate also a 2560 preview and a 1600 preview in the backend


    this.initTimeline(photo.id)
  }

  async initTimeline(id) {
    // get default and seatch query params
    const params = {
      id,
      from: 0, // needs to pass this to get years parameter back
      size: 10,
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
      let langvar = {
        italy: {
          en: "photos in Photolux Festival Collection",
          hu: "kép a Photolux Festival gyűjteményében",
          pl: "zdjęć w kolekcji Photolux Festival",
          it: "immagini nella collezione Photolux Festival"
        },
        poland: {
          en: "photos in Fotofestiwal Collection",
          hu: "kép a Fotofestiwal Collection gyűjteményében",
          pl: "zdjęć w kolekcji Fotofestiwal",
          it: "immagini nella collezione Fotofestiwal"
        },
        hungary: {
          en: "photos in Fortepan Collection",
          hu: "kép a Fortepan gyűjteményében",
          pl: "zdjęć w kolekcji Fortepan",
          it: "immagini nella collezione Fortepan"
        },
        null: {
          en: "photos in total",
          hu: "kép összesen",
          pl:  "zdjęć",
          it: "immagini in totale"
        },
      }
      let homeT = {
        en: "Browse all photos of the Fortepan Method Project!",
        it: "Naviga tutte le immagini del Progetto Fortepan Method!",
        hu: "Nézze meg a Fortepan Method Projekt összes képét",
        pl: "Przeglądaj wszystkie zdjęcia z projektu Fortepan Method!"
      }
      this.totalValTarget.textContent = numberWithCommas(data.total)
      this.extraTextTarget.textContent = langvar[getOrg()][getLocale()]
      if (null != getOrg())
        this.homeTextTarget.textContent = homeT[getLocale()]
      

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
