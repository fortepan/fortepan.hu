import { Controller } from "stimulus"
import config from "../../../data/siteConfig"
import { lang, photoRes } from "../../../js/utils"
import { appState } from "../../../js/app"
import photoManager from "../../../js/photo-manager"
import listManager from "../../../js/list-manager"
import { AST_Null } from "terser"

export default class extends Controller {
  static get targets() {
    return ["content"]
  }

  show() {
    this.element.classList.add("is-visible")
    this.downloadImage()
  }

  hide() {
    this.element.classList.remove("is-visible")
  }

  downloadImage() {
    const data = appState("is-lists") ? listManager.getSelectedPhoto() : photoManager.getSelectedPhotoData()

    this.element.classList.add("is-visible")
    this.contentTarget.innerHTML = lang("dialog_download").replace("$donor", `<br/><b>Fortepan / ${data.donor} ${(data.author) ? '/ ' + data.author : ''}</b>`)

    const a = document.createElement("a")
    a.href = config.BACKEND+'/api/media/download-link/'+data.photo
    // data.photo.split('.').slice(-1)
    a.click()
  }
}
