import { Controller } from "@hotwired/stimulus"
import throttle from "lodash/throttle"

import config from "../../../data/siteConfig"
import { setAppState } from "../../../js/app"
import listManager from "../../../js/list-manager"
import {
  copyToClipboard,
  escapeHTML,
  getLocale,
  urlToArray,
  isElementInViewport,
  lang,
  setPageMeta,
  trigger,
} from "../../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["title", "subtitle", "username", "count", "description", "grid", "placeholder"]
  }

  connect() {
    this.listData = null
    setAppState("is-lists")

    this.onScroll = throttle(this.onScroll, 200)
  }

  async show(e) {
    this.hide()

    if (e && e.detail && e.detail.listId) {
      // flag the current list item as the selected one
      const listData = listManager.selectListById(e.detail.listId)

      this.isPublic = !!e.detail.isPublic
      this.element.classList.toggle("is-public", this.isPublic)

      if (listData) {
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

        const urlValues = urlToArray(window.location.pathname.split(listData.url).join("/"))

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
        }
      } else {
        // some issue here -- redirect to the lists page
        window.history.pushState(null, lang("lists"), `/${getLocale()}/lists/`)
        trigger("popstate", null, window)
      }
    }
  }

  hide() {
    // close carousel if it is open
    trigger("photosCarousel:close", { silent: true })

    this.element.scrollTop = 0
    this.element.classList.remove("is-visible")
    this.gridTarget.classList.add("is-hidden")
    this.placeholderTarget.classList.add("is-hidden")
    this.placeholderTarget.classList.remove("is-visible")
    this.isPublic = false
  }

  async renderPhotos() {
    // avoid duplicate overlapping renders
    // - can happen because of the async nature, and multiple
    //   call on the function before it finishes loading
    if (this.renderingPhotos) return

    this.renderingPhotos = true

    this.element.querySelector(".lists-private-icon").classList.toggle("is-visible", this.listData.private)
    this.element.querySelector(".header-nav__link--copy-url").classList.toggle("is-hidden", this.listData.private)

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
    // set the proper url
    window.history.pushState(null, null, listManager.getSelectedList().url)

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

  // context menu functions

  showContextMenu(e) {
    if (e) {
      e.preventDefault()

      const listItemMenu = e.currentTarget.parentNode
      const dropdown = listItemMenu.querySelector(".header-nav__popup")

      this.hideAllContextMenu(dropdown)
      dropdown.classList.toggle("is-visible")
      listItemMenu.classList.toggle("is-open")

      dropdown.removeAttribute("style")
      const bounds = dropdown.getBoundingClientRect()

      if (bounds.left < 16) {
        dropdown.style.right = "auto"
        dropdown.style.left = 0
      }

      if (bounds.right > window.innerWidth - 16) {
        dropdown.style.right = "auto"
        dropdown.style.left = `${window.innerWidth -
          16 -
          e.currentTarget.getBoundingClientRect().left -
          bounds.width}px`
      }

      if (bounds.bottom > window.innerHeight - 16) {
        dropdown.style.top = `-${bounds.height}px`
      }
    }
  }

  hideAllContextMenu(elementToExclude) {
    this.element.querySelectorAll(".header-nav__popup").forEach(dropdown => {
      if (!elementToExclude || elementToExclude !== dropdown) {
        dropdown.classList.remove("is-visible")
        dropdown.parentNode.classList.remove("is-open")
      }
    })
  }

  editList(e) {
    if (e) e.preventDefault()
    trigger("dialogLists:show", { action: "edit", listId: this.listData.id })
  }

  deleteList(e) {
    if (e) e.preventDefault()
    trigger("dialogLists:show", { action: "delete", listId: this.listData.id })
  }

  onListsChanged(e) {
    if (this.element.classList.contains("is-visible")) {
      if (e && e.detail && e.detail.action) {
        switch (e.detail.action) {
          case "delete":
            // upon delete jump back to the lists page
            if (!e.detail.listId || e.detail.listId === this.listData.id) {
              this.backToLists()
            }
            break
          case "edit":
          default:
            this.reloadPhotos()
            break
        }
      } else {
        this.reloadPhotos()
      }
    }
  }

  reloadPhotos() {
    // passing the current listId as it would be passed in an event
    const e = { detail: { listId: this.listData.id } }
    this.show(e)
  }

  jumpToPhotos(e) {
    if (e) e.preventDefault()
    window.location = `/${getLocale()}/photos/`
  }

  backToLists(e) {
    if (e) e.preventDefault()

    window.history.pushState(null, `Fortepan — ${lang("lists")}`, `/${getLocale()}/lists/`)
    trigger("popstate", null, window)
  }

  async removePhoto(e) {
    if (e) e.preventDefault()

    if (e && e.currentTarget) {
      trigger("loader:show", { id: "loaderBase" })

      const thumbnail = Array.from(this.element.querySelectorAll(".photos-thumbnail")).find(thumb =>
        thumb.contains(e.currentTarget)
      )
      const result = {}

      const resp = await listManager.deletePhotoFromList(thumbnail.photoId, this.listData.id)

      result.status = resp.errors ? "error" : "success"
      result.message = resp.errors
        ? lang("list_remove_from_error")
        : lang("list_remove_from_success") + escapeHTML(this.listData.name)

      // eslint-disable-next-line no-console
      if (resp.errors) console.error(resp.errors)

      if (result.status === "success") {
        this.reloadPhotos()
      }

      trigger("loader:hide", { id: "loaderBase" })

      trigger("snackbar:show", { message: result.message, status: result.status, autoHide: true })

      trigger("listPhotos:photoRemoved", { id: thumbnail.photoId })
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
