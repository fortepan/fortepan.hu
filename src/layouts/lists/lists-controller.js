import { Controller } from "stimulus"
import { getLocale, lang, slugify, escapeHTML, trigger } from "../../js/utils"
import { appState } from "../../js/app"
import listsAPI from "../../api/lists"
import config from "../../data/siteConfig"

export default class extends Controller {
  static get targets() {
    return ["total", "grid"]
  }

  connect() {
    this.listRendered = false
  }

  show() {
    if (appState("auth-signed-in")) {
      this.element.classList.add("is-visible")
      this.renderLists()
    } else {
      this.element.classList.remove("is-visible")
      trigger("snackbar:show", { message: lang("list_signin_alert"), status: "error", autoHide: true })
      trigger("dialogSignin:show")
    }
  }

  async renderLists() {
    if (this.listRendered) return

    const resp = await listsAPI.getLists()

    this.totalTarget.innerText = Object.keys(resp).length

    Object.keys(resp).forEach(async key => {
      const listID = key
      const listName = resp[key]
      const url = `/${getLocale()}/lists/${slugify(listName, true)}`
      const template = document.getElementById("lists-item").content.firstElementChild

      const newListItem = template.cloneNode(true)

      const title = newListItem.getElementsByClassName("lists__item__title")[0]
      if (title) {
        title.innerHTML = escapeHTML(listName)
        title.setAttribute("href", url)
      }

      // images
      const rawPhotosResp = await listsAPI.getListPhotos(listID)
      const photoCount = Object.keys(rawPhotosResp.flags).length

      const cover = newListItem.getElementsByClassName("lists__item__cover")[0]
      if (cover && photoCount > 0) {
        cover.classList.add(photoCount > 3 ? "has-image--more" : `has-image--${photoCount}`)

        if (photoCount > 3) {
          const count = newListItem.getElementsByClassName("lists__item__counter")[0]
          count.innerText = `+${photoCount - 3}`
        }
      }

      Object.keys(rawPhotosResp.flags).forEach((photoKey, index) => {
        if (index < 3) {
          const photoId = rawPhotosResp.flags[photoKey]
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

      // TODO: add the description once it returns from backend
      /* const description = newListItem.getElementsByClassName("lists__item__description")[0]
      if (description) {
        description.innerHTML = escapeHTML(
          "Random lista leírás, maximum 140 karakter hosszú, és minden listához egyenként hozzáadható. Megjelenik a listákat listázó oldalon és máshol."
        )
        description.classList.add("is-visible")
      } */

      newListItem.listID = listID
      newListItem.listName = listName
      newListItem.url = url

      this.gridTarget.appendChild(newListItem)

      this.listRendered = true
    })
  }

  onListCoverClick(e) {
    if (e && e.currentTarget) {
      window.location = e.currentTarget.parentElement.url

      /* window.history.pushState(
        null,
        escapeHTML(e.currentTarget.parentElement.listName),
        e.currentTarget.parentElement.url
      ) */
    }
  }
}
