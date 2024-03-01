import { Controller } from "@hotwired/stimulus"

import config from "../../../data/siteConfig"
import { lang } from "../../../js/utils"
import { appState } from "../../../js/app"
import photoManager from "../../../js/photo-manager"
import listManager from "../../../js/list-manager"

export default class extends Controller {
  static get targets() {
    return ["content"]
  }

  show() {
    this.element.classList.add("is-visible")

    this.photoData = appState("is-lists") ? listManager.getSelectedPhoto() : photoManager.getSelectedPhotoData()
    this.contentTarget.innerHTML = lang("dialog_download").replace(
      "$donor",
      `<br><b>Fortepan / ${this.photoData.donor}</b>`
    )
  }

  hide() {
    this.element.classList.remove("is-visible")
  }

  downloadImage(e) {
    if (e) e.preventDefault()

    const a = document.createElement("a")
    a.href = `${config().PHOTO_SOURCE_LARGE}${this.photoData.mid}.jpg`
    a.click()
  }
}
