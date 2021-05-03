import { Controller } from "stimulus"
import { lang, escapeHTML, trigger } from "../../js/utils"
import { appState } from "../../js/app"
import config from "../../data/siteConfig"
import listManager from "../../js/list-manager"

export default class extends Controller {
  static get targets() {
    return ["total", "grid"]
  }

  connect() {
    this.listRendered = false
  }

  async show() {
    if (appState("auth-signed-in")) {
      await this.renderLists()
      this.element.classList.add("is-visible")
    } else {
      this.element.classList.remove("is-visible")
      trigger("snackbar:show", { message: lang("list_signin_alert"), status: "error", autoHide: true })
      trigger("dialogSignin:show")
    }
  }

  async renderLists() {
    if (this.listRendered) return

    trigger("loader:show", { id: "loaderBase" })

    const lists = await listManager.loadListData()

    this.totalTarget.innerText = lists.length

    lists.forEach(async listData => {
      const template = document.getElementById("lists-item").content.firstElementChild

      const newListItem = template.cloneNode(true)

      const title = newListItem.getElementsByClassName("lists__item__title")[0]
      if (title) {
        title.innerHTML = escapeHTML(listData.name)
        title.setAttribute("href", listData.url)
      }

      if (listData.description) {
        const description = newListItem.getElementsByClassName("lists__item__description")[0]
        if (description) {
          description.innerHTML = escapeHTML(listData.description)
          description.classList.add("is-visible")
        }
      }

      // images
      const photos = await listManager.getListPhotos(listData.id)

      const cover = newListItem.getElementsByClassName("lists__item__cover")[0]
      if (cover && photos.length > 0) {
        cover.classList.add(photos.length > 3 ? "has-image--more" : `has-image--${photos.length}`)

        if (photos.length > 3) {
          const count = newListItem.getElementsByClassName("lists__item__counter")[0]
          count.innerText = `+${photos.length - 3}`
        }
      }

      photos.forEach((photoItem, index) => {
        if (index < 3) {
          const photoId = photoItem.id
          const photoElement = newListItem.getElementsByClassName("lists__item__photo")[index]
          const imageTarget = photoElement.getElementsByClassName("lists__item__photo__img")[0]
          const img = new Image()

          img.addEventListener("load", () => {
            imageTarget.style.backgroundImage = `url("${img.src}")`
            imageTarget.classList.add("is-loaded")
          })

          img.addEventListener("error", () => {
            imageTarget.classList.add("is-failed-loading")
          })

          img.src = `${config.PHOTO_SOURCE}240/fortepan_${photoId}.jpg`
        }
      })

      newListItem.listId = listData.id

      this.gridTarget.appendChild(newListItem)

      this.listRendered = true
      trigger("loader:hide", { id: "loaderBase" })
    })
  }

  onListCoverClick(e) {
    if (e && e.currentTarget) {
      const listData = listManager.getListById(e.currentTarget.parentElement.listId)
      if (listData && listData.url) {
        window.location = listData.url

        /* window.history.pushState(
        null,
        escapeHTML(listData.name),
        listData.url
      ) */
      }
    }
  }
}
