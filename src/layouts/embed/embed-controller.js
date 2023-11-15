import { Controller } from "@hotwired/stimulus"
import throttle from "lodash/throttle"

import config from "../../data/siteConfig"
import { setAppState } from "../../js/app"
import listManager from "../../js/list-manager"
import { escapeHTML, getLocale, urlToArray, lang, setPageMeta, trigger } from "../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["infobar", "title", "subtitle", "username", "count", "description", "grid", "message"]
  }

  connect() {
    this.listData = null
    setAppState("is-lists")
    setAppState("is-embed")
    setAppState("theme--dark")
    setAppState("hide-carousel-sidebar")

    this.onScroll = throttle(this.onScroll, 200)

    // allow cookies by default
    setTimeout(() => {
      trigger("cookieConsent:cookiesAllowed")
    }, 100)

    this.show()
  }

  async show() {
    // check for a list id in the url
    const listId = urlToArray(window.location.pathname.split(`/${getLocale()}/embed/`).join("/"))[0] || null
    let is404 = false

    if (listId) {
      // we have a list id, check if the list is public
      trigger("loader:show", { id: "loaderBase" })
      const listData = await listManager.loadPublicListDataById(listId)
      listManager.selectListById(listId)
      trigger("loader:hide", { id: "loaderBase" })

      if (listData) {
        this.listData = listData
        this.element.classList.add("is-visible")

        await this.renderPhotos()

        if (this.listData.photos.length > 0) {
          // the list has photos
          this.gridTarget.classList.remove("is-hidden")

          // lets force thumbnail image loading: upon creating the thumbnails the parent element is still hidden,
          // so checking if they're in the viewport fails (and that's needed to start loading the first set in the viewport)
          this.onScroll()

          // opening the carousel at the first photo if no photos are defined in the url to start with
          trigger("photosThumbnail:select", { data: listManager.selectPhotoById(listData.id, listData.photos[0].id) })

          // selecting the relevant thumbnail
          trigger("photos:selectThumbnail", { index: listManager.getSelectedPhotoIndex() })
        } else {
          // the list doesn't have photos
          this.toggleInfobar()
          this.element.classList.add("is-empty")

          this.messageTarget.classList.add("is-visible")
          this.messageTarget.textContent = lang("embed").empty_list
        }
      } else {
        // the list is private or doesn't exist
        is404 = true
      }
    } else {
      // no list id present
      is404 = true
    }

    if (is404) {
      this.toggleInfobar()
      this.element.classList.add("is-empty", "is-404")

      this.titleTarget.textContent = lang("embed").title_404
      this.messageTarget.classList.add("is-visible")
      this.messageTarget.textContent = lang("embed").message_404
    }
  }

  async renderPhotos() {
    // avoid duplicate overlapping renders
    // - can happen because of the async nature, and multiple
    //   call on the function before it finishes loading
    if (this.renderingPhotos) return

    this.renderingPhotos = true

    this.usernameTarget.textContent = this.listData.username // only exists (and visible) when it's public

    this.titleTarget.innerHTML = `<a href="https://fortepan.hu${this.listData.url}" target="_blank">${escapeHTML(
      this.listData.name
    )}</a>`
    this.subtitleTarget.classList.remove("is-visible")

    setPageMeta(`${this.listData.name} — ${lang("lists")}`, this.listData.description, null)

    // remove any existing thumbnails from the grid
    // this.element.querySelectorAll(".photos-thumbnail").forEach(thumbnail => thumbnail.remove())
    this.gridTarget.textContent = ""

    trigger("loader:show", { id: "loaderBase" })

    // then load the extended photo data (from elastic search)
    await listManager.loadExtendedListPhotoData(this.listData.id)

    // we have the photos loaded now, lets build the dom
    this.listData.photos.forEach((item, index) => {
      // clone thumnail template
      const thumbnail = document.getElementById("photos-thumbnail").content.firstElementChild.cloneNode(true)

      this.gridTarget.appendChild(thumbnail)

      // set thumnail node element index
      thumbnail.index = index

      // apply photo id to node
      thumbnail.photoId = item.mid

      // apply year data to node
      thumbnail.year = item.year

      if (index === 0) {
        // set the meta image
        setPageMeta(null, null, `${config().PHOTO_SOURCE}480/fortepan_${item.mid}.jpg`)
      }
    })

    trigger("loader:hide", { id: "loaderBase" })

    this.countTarget.textContent = this.listData.photos.length
    this.subtitleTarget.classList.add("is-visible")

    this.descriptionTarget.innerHTML = escapeHTML(this.listData.description)
    this.descriptionTarget.classList.toggle("is-visible", !!this.listData.description)

    delete this.renderingPhotos
  }

  onPhotoSelected(e) {
    const id = e && e.detail && e.detail.photoId ? e.detail.photoId : listManager.getSelectedPhotoId()

    setPageMeta(
      `${this.listData.name} — #${id}`,
      this.listData.description,
      `${config().PHOTO_SOURCE}480/fortepan_${id}.jpg`
    )
  }

  // Set a thumbnail's selected state
  selectThumbnail(e = null, index = -1) {
    if ((e && e.detail && e.detail.index > -1) || index !== -1) {
      this.element.querySelectorAll(".photos-thumbnail").forEach(thumb => thumb.classList.remove("is-selected"))

      const selectedIndex = e && e.detail && e.detail.index > -1 ? e.detail.index : index

      const element = this.element.querySelectorAll(".photos-thumbnail")[selectedIndex]
      if (element) element.classList.add("is-selected")
    }
  }

  onScroll() {
    this.loadThumbnails()
  }

  loadThumbnails() {
    this.element.querySelectorAll(".photos-thumbnail:not(.is-loaded)").forEach(thumbnail => {
      if (thumbnail.photosThumbnail) {
        thumbnail.photosThumbnail.loadThumbnailImage()
      }
    })
  }

  scrollToSelectedThumbnail() {
    const thumbnail = this.element.querySelectorAll(".photos-thumbnail")[listManager.getSelectedPhotoIndex()]
    if (thumbnail) this.gridTarget.scrollLeft = thumbnail.offsetLeft - 16 - 32
  }

  toggleInfobar() {
    this.infobarTarget.classList.toggle("is-visible")

    if (this.infobarTarget.classList.contains("is-visible")) {
      this.scrollToSelectedThumbnail()
      setTimeout(() => {
        this.onScroll()
      }, 400)
    }
  }
}
