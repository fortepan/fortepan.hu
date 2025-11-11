import { Controller } from "@hotwired/stimulus"

import config from "../../../data/siteConfig"
import { copyToClipboard } from "../../../js/utils"
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
    this.photoCredits = `Fortepan / ${this.photoData.donor}`
    if (this.photoData.author) {
      this.photoCredits += ` / ${this.photoData.author}`
    }

    this.contentTarget.innerHTML = this.photoCredits
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

  onCopyClicked(e) {
    if (e) e.preventDefault()

    copyToClipboard(this.photoCredits)
  }
}
