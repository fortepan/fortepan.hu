import { Controller } from "@hotwired/stimulus"

import throttle from "lodash/throttle"
import { getLocale, trigger, escapeHTML, asArray } from "../../js/utils"
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

    if (!data) return

    if (appState("is-lists") && !data.isDataLoaded) {
      this.element.classList.add("is-hidden")
      return
    }
    this.element.classList.remove("is-hidden")

    // fill template with data
    const baseUrl = `/${getLocale()}/photos/`

    const convertToHref = key => {
      const values = asArray(data[key])
      if (values.length === 0) return null

      return values
        .map(
          item =>
            `<a href="${baseUrl}?${key}=${encodeURIComponent(item)}">${escapeHTML(item)}</a>`
        )
        .join(",<br/>")
    }

    const locationArray = ["country", "city", "place"].map(val => convertToHref(val)).filter(Boolean)

    this.locationTarget.innerHTML = ""
    if (locationArray.length > 0) {
      this.locationTarget.innerHTML = locationArray.join(",<br/>")
      this.locationTarget.parentNode.style.display = "block"
    }

    this.descriptionTarget.innerHTML = ""
    if (data.description) {
      this.descriptionTarget.innerHTML = escapeHTML(data.description)
      this.descriptionTarget.parentNode.style.display = "block"
    } else if (locationArray.length === 0) {
      this.descriptionTarget.parentNode.style.display = "none"
    }

    const tags = asArray(data.tags)
    if (tags.length > 0) {
      this.tagsTarget.innerHTML = tags
        .map(tag => `<a href="${baseUrl}?tag=${encodeURIComponent(tag)}">${escapeHTML(tag)}</a>`)
        .join(", ")
    } else {
      this.tagsTarget.innerHTML = `<span class="carousel-sidebar__tags__empty">–</span>`
    }

    this.midTarget.innerHTML = `<a href="${baseUrl}?id=${data.mid}">${escapeHTML(data.mid)}</a>`
    this.yearTarget.innerHTML = `<a href="${baseUrl}?year=${data.year}">${escapeHTML(data.year)}</a>`

    if (data.donor) {
      this.donorTarget.innerHTML = `<a href="${baseUrl}?donor=${encodeURIComponent(data.donor)}">${escapeHTML(
        data.donor
      )}</a>`
      this.donorTarget.parentNode.style.display = "block"
    } else {
      this.donorTarget.parentNode.style.display = "none"
    }

    if (data.author) {
      this.authorTarget.innerHTML = `<a href="${baseUrl}?photographer=${encodeURIComponent(
        data.author
      )}">${escapeHTML(data.author)}</a>`
      this.authorTarget.parentNode.style.display = "block"
    } else {
      this.authorTarget.parentNode.style.display = "none"
    }

    if (!appState("is-lists") && !appState("is-map")) {
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
        anchorNode.setAttribute("rel", "noopener noreferrer")
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
    else if (!appState("carousel-fullscreen") && !appState("is-embed"))
      this.show()
  }

  openMapView() {
    trigger("mapview:show")
    trigger("mapview:update", { photosData: photoManager.getData()?.result?.items })
  }
}
