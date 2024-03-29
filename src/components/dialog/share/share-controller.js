import { Controller } from "@hotwired/stimulus"
import { appState } from "../../../js/app"
import { copyToClipboard, trigger, getLocale } from "../../../js/utils"
import photoManager from "../../../js/photo-manager"
import listManager from "../../../js/list-manager"

export default class extends Controller {
  show() {
    this.element.classList.add("is-visible")
    this.imageData = appState("is-lists") ? listManager.getSelectedPhoto() : photoManager.getSelectedPhotoData()
  }

  hide() {
    this.element.classList.remove("is-visible")
  }

  shareLink(e) {
    e.preventDefault()
    const res = copyToClipboard(`${window.location.origin}/${getLocale()}/photos/?id=${this.imageData.mid}`, "link")
    if (res) trigger("dialogShare:close")
  }

  shareOnFacebook(e) {
    e.preventDefault()
    const url = `https://www.facebook.com/dialog/share?app_id=498572111052804&href=${encodeURIComponent(
      `${window.location.origin}/${getLocale()}/photos/?id=${this.imageData.mid}`
    )}`
    window.open(url, "_blank")
  }

  shareOnTwitter(e) {
    e.preventDefault()
    const url = `https://twitter.com/share?text=${encodeURIComponent(
      document.querySelector("meta[name=description]").getAttribute("content")
    )}&url=${encodeURIComponent(`${window.location.origin}/${getLocale()}/photos/?id=${this.imageData.mid}`)}`
    window.open(url, "_blank")
  }

  shareByEmail(e) {
    e.preventDefault()
    const url = `mailto:?subject=${document.title}&body=${encodeURIComponent(
      document.querySelector("meta[name=description]").getAttribute("content")
    )} ${encodeURIComponent(`${window.location.origin}/${getLocale()}/photos/?id=${this.imageData.mid}`)}`
    window.location.href = url
  }
}
