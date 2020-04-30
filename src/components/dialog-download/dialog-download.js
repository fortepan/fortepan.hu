import config from "../../config"
import { lang } from "../../utils"

class DialogDownload extends HTMLElement {
  constructor() {
    super()

    this.bindCustomEvents()
  }

  bindCustomEvents() {
    document.addEventListener("dialogDownload:hide", this.hide.bind(this))
    document.addEventListener("dialogDownload:downloadImage", this.downloadImage.bind(this))
  }

  hide() {
    this.classList.remove("is-visible")
  }

  set bindData(data) {
    this.data = data
  }

  downloadImage() {
    this.classList.add("is-visible")
    this.querySelector(".dialog__content").innerHTML = lang("dialog_download").replace(
      "$donor",
      `<br/><b>Fortepan / ${this.data.adomanyozo_name}</b>`
    )

    const a = document.createElement("a")
    a.href = `${config.PHOTO_SOURCE_LARGE}${this.data.mid}.jpg`
    a.click()
  }
}

window.customElements.define("dialog-download", DialogDownload)
