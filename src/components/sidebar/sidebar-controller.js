import { Controller } from "@hotwired/stimulus"

import throttle from "lodash/throttle"
import { getLocale, trigger } from "../../js/utils"
import { setAppState, removeAppState, toggleAppState, appState } from "../../js/app"
import photoManager from "../../js/photo-manager"
import listManager from "../../js/list-manager"

export default class extends Controller {
  static get targets() {
    return ["location", "description", "year", "donor", "author", "mid", "tags"]
  }

  connect() {
    this.element.carouselSidebar = this

    // throttle functions
    this.toggleOnResize = throttle(this.toggleOnResize.bind(this), 400)
  }

  init() {
    const data = appState("is-lists") ? listManager.getSelectedPhoto() : photoManager.getSelectedPhotoData()

    if (appState("is-lists") && !data.isDataLoaded) {
      this.element.classList.add("is-hidden")
      return
    }
    this.element.classList.remove("is-hidden")

    // fill template with data
    const baseUrl = `/${getLocale()}/photos/`

    // create a string of anchors from array
    const convertToHref = key => {
      if (data[key]) {
        const resp = []
        data[key].forEach(item => {
          resp.push(`<a href="${baseUrl}?${key}=${encodeURIComponent(item)}">${item}</a>`)
        })
        return resp.join(",<br/>")
      }
      return null
    }

    const locationArray = ["country", "city", "place"].map(val => convertToHref(val)).filter(Boolean)

    this.locationTarget.innerHTML = ""
    if (locationArray.length > 0) {
      this.locationTarget.innerHTML = locationArray.join(",<br/>")
      this.locationTarget.parentNode.style.display = "block"
    }

    this.descriptionTarget.innerHTML = ""
    if (data.description) {
      this.descriptionTarget.innerHTML = data.description
      this.descriptionTarget.parentNode.style.display = "block"
    } else if (locationArray.length === 0) {
      this.descriptionTarget.parentNode.style.display = "none"
    }

    if (data.tags) {
      this.tagsTarget.innerHTML = data.tags
        .map(tag => `<a href="${baseUrl}?tag=${encodeURIComponent(tag)}">${tag}</a>`)
        .join(", ")
    } else {
      this.tagsTarget.innerHTML = `<span class="carousel-sidebar__tags__empty">–</span>`
    }

    this.midTarget.innerHTML = `<a href="${baseUrl}?id=${data.mid}">${data.mid}</a>`
    this.yearTarget.innerHTML = `<a href="${baseUrl}?year=${data.year}">${data.year}</a>`
    this.donorTarget.innerHTML = `<a href="${baseUrl}?donor=${encodeURIComponent(data.donor)}">${data.donor}</a>`

    if (data.author) {
      this.authorTarget.innerHTML = `<a href="${baseUrl}?photographer=${encodeURIComponent(data.author)}">${
        data.author
      }</a>`
      this.authorTarget.parentNode.style.display = "block"
    } else {
      this.authorTarget.parentNode.style.display = "none"
    }

    if (!appState("is-lists")) {
      // bind history api calls to sidabar anchors
      this.element.querySelectorAll(".carousel-sidebar a:not([class])").forEach(anchorNode => {
        anchorNode.addEventListener("click", event => {
          event.preventDefault()
          trigger("photos:historyPushState", { url: event.currentTarget.href, resetPhotosGrid: true })
        })
      })
    }

    if (appState("is-embed")) {
      // bind history api calls to sidabar anchors
      this.element.querySelectorAll(".carousel-sidebar a").forEach(anchorNode => {
        anchorNode.setAttribute("target", "_blank")
      })
    }
  }

  show() {
    removeAppState("hide-carousel-sidebar")
    this.element.scrollTop = 0
  }

  hide() {
    setAppState("hide-carousel-sidebar")
  }

  toggle() {
    toggleAppState("hide-carousel-sidebar")

    if (!appState("hide-carousel-sidebar")) {
      this.element.scrollTop = 0
    }
  }

  toggleOnResize() {
    if (window.innerWidth < 768) this.hide()
    else if (!appState("play-carousel-slideshow") && !appState("carousel-fullscreen") && !appState("is-embed"))
      this.show()
  }
}
