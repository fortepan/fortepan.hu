import { Controller } from "stimulus"

import config from "../../../data/siteConfig"
import { setAppState } from "../../../js/app"
import listManager from "../../../js/list-manager"
import {
  escapeHTML,
  getLocale,
  getPrettyURLValues,
  isElementInViewport,
  lang,
  setPageMeta,
  trigger,
} from "../../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["title", "titleLabel", "subtitle", "count", "description", "grid"]
  }

  connect() {
    this.listData = null
    setAppState("is-lists")
  }

  async show(e) {
    if (e && e.detail && e.detail.listId) {
      // flag the current list item as the selected one
      const listData = listManager.selectListById(e.detail.listId)

      if (listData) {
        this.listData = listData
        this.element.classList.add("is-visible")

        await this.renderPhotos()

        const urlValues = getPrettyURLValues(window.location.pathname.split(`/${getLocale()}/lists/`).join("/"))
        const photoId = urlValues[1]

        if (photoId) {
          // open carousel
          const selectedPhotoData = listManager.selectPhotoById(listData.id, photoId)
          if (selectedPhotoData) {
            // Load photo in Carousel
            trigger("photosThumbnail:select", { data: selectedPhotoData })
          }
        } else {
          // close carousel if it is open
          trigger("photosCarousel:close", { silent: true })
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
  }

  async renderPhotos() {
    this.titleLabelTarget.innerHTML = escapeHTML(this.listData.name)
    this.subtitleTarget.classList.remove("is-visible")

    setPageMeta(`${this.listData.name} — ${lang("lists")}`, this.listData.description, null)

    // remove any existing thumbnails from the grid
    this.element.querySelectorAll(".photos-thumbnail").forEach(thumbnail => thumbnail.remove())

    trigger("loader:show", { id: "loaderBase" })

    // load photo data if it hasn't been loaded yet
    if (!this.listData.photos) await listManager.loadListPhotosData(this.listData.id)

    // then load the extended photo data (from elastic search)
    await listManager.loadExtendedListPhotoData(this.listData.id)

    const thumbnailLoadingPromises = []

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
        setPageMeta(null, null, `${config.PHOTO_SOURCE}240/fortepan_${item.mid}.jpg`)
      }

      // observe when the thumbnail class attribute changes and contains 'is-loaded'
      const thumbnailLoadingPromise = new Promise(res => {
        const classObserver = new window.MutationObserver(() => {
          if (thumbnail.classList.contains("is-loaded") || thumbnail.classList.contains("is-failed-loading")) res()
        })
        classObserver.observe(thumbnail, {
          attributes: true,
          attributeFilter: ["class"],
        })
      })
      thumbnailLoadingPromises.push(thumbnailLoadingPromise)
    })

    // load all thumbnail images
    await Promise.all(thumbnailLoadingPromises)

    this.element.querySelectorAll(".photos-thumbnail.is-loaded:not(.is-visible)").forEach(thumbnail => {
      thumbnail.photosThumbnail.show()
    })

    trigger("loader:hide", { id: "loaderBase" })

    this.countTarget.textContent = this.listData.photos.length
    this.subtitleTarget.classList.add("is-visible")

    /* this.listData.description =
      "Random lista leírás, maximum 140 karakter hosszú, és minden listához egyenként hozzáadható. Megjelenik a listákat listázó oldalon és máshol." */

    this.descriptionTarget.innerHTML = escapeHTML(this.listData.description)
    this.descriptionTarget.classList.toggle("is-visible", !!this.listData.description)
  }

  onPhotoSelected(e) {
    const id = e && e.detail && e.detail.photoId ? e.detail.photoId : listManager.getSelectedPhotoId()
    const url = `${listManager.getSelectedList().url}/${id}`

    setPageMeta(
      `${this.listData.name} — #${id}`,
      this.listData.description,
      `${config.PHOTO_SOURCE}240/fortepan_${id}.jpg`
    )

    if (window.location.pathname !== url) {
      // set the proper url
      window.history.pushState(
        null,
        `Fortepan — ${this.listData.name} — #${id}`,
        `${listManager.getSelectedList().url}/${id}`
      )
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
    }
  }

  hideAllContextMenu(elementToExclude) {
    this.element.querySelectorAll(".header-nav__popup").forEach(dropdown => {
      if (!elementToExclude || elementToExclude !== dropdown) {
        dropdown.classList.remove("is-visible")
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
      if (e && e.action) {
        switch (e.action) {
          case "delete":
            // upon delete jump back to the lists page
            this.backToLists()
            break
          case "edit":
          default:
            // TODO: modify the listItem
            this.reloadPhotos()
            break
        }
      } else {
        this.reloadPhotos()
      }
    }
  }

  reloadPhotos() {
    this.show()
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
      const thumbnail = Array.from(this.element.querySelectorAll(".photos-thumbnail")).find(thumb =>
        thumb.contains(e.currentTarget)
      )
      const result = {}

      const resp = await listManager.deletePhotoFromList(thumbnail.photoId, this.listData.id)

      result.status = resp.errors ? "error" : "success"
      result.message = resp.errors
        ? lang("list_remove_from_error")
        : lang("list_remove_from_success") + escapeHTML(this.listData.name)

      if (resp.errors) console.log(resp)

      trigger("snackbar:show", { message: result.message, status: result.status, autoHide: true })

      if (result.status === "success") {
        // remove the thumbnail from the DOM on success
        thumbnail.remove()

        // update the photo counter
        this.countTarget.textContent = this.listData.photos.length
      }
    }
  }
}
