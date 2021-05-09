import { Controller } from "stimulus"

import config from "../../../data/siteConfig"
import { setAppState } from "../../../js/app"
import listManager from "../../../js/list-manager"
import { escapeHTML, getLocale, getPrettyURLValues, lang, setPageMeta, trigger } from "../../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["title", "subtitle", "count", "grid"]
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
          document.querySelector(".carousel").classList.remove("is-visible")
        }
      } else {
        // some issue here -- redirect to the lists page
        window.history.pushState(null, lang("lists"), `/${getLocale()}/lists/`)
        trigger("popstate", null, window)
      }
    }
  }

  hide() {
    this.element.classList.remove("is-visible")
  }

  async renderPhotos() {
    this.titleTarget.innerHTML = escapeHTML(this.listData.name)
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
  }
}
