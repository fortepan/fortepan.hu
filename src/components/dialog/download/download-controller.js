import { Controller } from "stimulus"
import config from "../../../data/siteConfig"
import { lang } from "../../../js/utils"
import { selectedThumbnail } from "../../../js/app"

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
    const data = selectedThumbnail.itemData

    this.element.classList.add("is-visible")
    this.contentTarget.innerHTML = lang("dialog_download").replace("$donor", `<br/><b>Fortepan / ${data.donor}</b>`)

    const a = document.createElement("a")
    a.href = `${config.PHOTO_SOURCE_LARGE}${data.mid}.jpg`
    a.click()
  }
}
