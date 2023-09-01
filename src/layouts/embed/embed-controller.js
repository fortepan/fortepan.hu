import { Controller } from "@hotwired/stimulus"
import throttle from "lodash/throttle"

import config from "../../data/siteConfig"
import { setAppState } from "../../js/app"
import listManager from "../../js/list-manager"
import {
  copyToClipboard,
  escapeHTML,
  getLocale,
  getPrettyURLValues,
  isElementInViewport,
  lang,
  setPageMeta,
  trigger,
} from "../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["title", "subtitle", "username", "count", "description", "grid", "placeholder"]
  }

  connect() {
    this.listData = null
    setAppState("is-lists")
    setAppState("embed")
    setAppState("theme--dark")

    this.onScroll = throttle(this.onScroll, 200)

    this.show()
  }

  async show() {
    // check for a list id in the url
    const listId = getPrettyURLValues(window.location.pathname.split(`/${getLocale()}/embed/`).join("/"))[0] || null

    if (listId) {
      // we have a list id, check if the list is public
      trigger("loader:show", { id: "loaderBase" })
      const listData = await listManager.loadPublicListDataById(listId)
      listManager.selectListById(listId)
      trigger("loader:hide", { id: "loaderBase" })

      if (listData) {
        // the list exist in the public domain
        this.isPublic = true
        this.element.classList.toggle("is-public", this.isPublic)

        this.listData = listData
        this.element.classList.add("is-visible")

        await this.renderPhotos()

        if (this.listData.photos.length > 0) {
          this.gridTarget.classList.remove("is-hidden")
        } else {
          this.placeholderTarget.classList.remove("is-hidden")
          setTimeout(() => {
            this.placeholderTarget.classList.add("is-visible")
          }, 100)
        }

        // lets force thumbnail image loading: upon creating the thumbnails the parent element is still hidden,
        // so checking if they're in the viewport fails (and that's needed to start loading the first set in the viewport)
        this.onScroll()

        const urlValues = getPrettyURLValues(window.location.pathname.split(listData.url).join("/"))

        // urlValues[0] is simply photos for better readibility
        const photoId = urlValues[1]

        if (urlValues[0] === "photos" && photoId) {
          // open carousel
          const selectedPhotoData = listManager.selectPhotoById(listData.id, photoId)
          if (selectedPhotoData) {
            // scroll to top
            this.element.scrollTop = 0

            // Load photo in Carousel
            trigger("photosThumbnail:select", { data: selectedPhotoData })
          }
        } else {
          // opening the carousel at the first photo if no photos are defined in the url to start with
          trigger("photosThumbnail:select", { data: listManager.selectPhotoById(listData.id, listData.photos[0].id) })
        }
      } else {
        // TO-DO: the list doesn't exist in the public domain, show the login screen instead
      }
    } else {
      // TO-DO: no list id present
    }
  }

  async renderPhotos() {
    // avoid duplicate overlapping renders
    // - can happen because of the async nature, and multiple
    //   call on the function before it finishes loading
    if (this.renderingPhotos) return

    this.renderingPhotos = true

    this.element.querySelector(".lists-private-icon").classList.toggle("is-visible", this.listData.private)

    this.usernameTarget.textContent = this.listData.username // only exists (and visible) when it's public

    this.titleTarget.innerHTML = escapeHTML(this.listData.name)
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
    const url = `${listManager.getSelectedList().url}/photos/${id}`

    setPageMeta(
      `${this.listData.name} — #${id}`,
      this.listData.description,
      `${config().PHOTO_SOURCE}480/fortepan_${id}.jpg`
    )

    if (window.location.pathname !== url) {
      // set the proper url
      window.history.pushState(null, `Fortepan — ${this.listData.name} — #${id}`, url)
    }
  }

  onCarouselClosed() {
    // scroll to the last selected thumbnail
    this.scrollToSelectedThumbnail()
  }

  scrollToSelectedThumbnail() {
    const thumbnail = this.element.querySelector(".photos-thumbnail.is-selected")

    // scroll to thumbnail if it's not in the viewport
    if (thumbnail) {
      if (!isElementInViewport(thumbnail.querySelector(".photos-thumbnail__image"))) {
        const viewportOffsetTop = document.querySelector(".header-nav").offsetHeight + 16

        this.element.scrollTop = thumbnail.offsetTop - viewportOffsetTop
      }
    }
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

  shareLink(e) {
    e.preventDefault()

    copyToClipboard(`${window.location.origin}/${getLocale()}/lists/${this.listData.id}`, "link")
  }
}
