import { copyToClipboard, trigger } from "../../js/utils"

class DialogShare extends HTMLElement {
  constructor() {
    super()

    this.bindEvents()
    this.bindCustomEvents()
  }

  bindCustomEvents() {
    document.addEventListener("dialogShare:show", this.show.bind(this))
    document.addEventListener("dialogShare:hide", this.hide.bind(this))
  }

  bindEvents() {
    document.querySelector("#ShareLink").addEventListener("click", this.shareLink.bind(this))
    document.querySelector("#ShareFacebook").addEventListener("click", this.shareOnFacebook.bind(this))
    document.querySelector("#ShareTwitter").addEventListener("click", this.shareOnTwitter.bind(this))
    document.querySelector("#ShareEmail").addEventListener("click", this.shareByEmail.bind(this))
  }

  show() {
    this.classList.add("is-visible")
  }

  hide() {
    this.classList.remove("is-visible")
  }

  set bindData(data) {
    this.data = data
  }

  shareLink(e) {
    e.preventDefault()
    const res = copyToClipboard(`${window.location.origin + window.location.pathname}?id=${this.data.mid}`, "link")
    if (res) trigger("dialogShare:close")
  }

  shareOnFacebook(e) {
    e.preventDefault()
    const url = `https://www.facebook.com/dialog/share?app_id=498572111052804&href=${encodeURIComponent(
      `${window.location.origin + window.location.pathname}?id=${this.data.mid}`
    )}`
    window.open(url, "_blank")
  }

  shareOnTwitter(e) {
    e.preventDefault()
    const url = `https://twitter.com/share?text=${encodeURIComponent(
      document.querySelector("meta[name=description]").getAttribute("content")
    )}&url=${encodeURIComponent(`${window.location.origin + window.location.pathname}?id=${this.data.mid}`)}`
    window.open(url, "_blank")
  }

  shareByEmail(e) {
    e.preventDefault()
    const url = `mailto:?subject=${document.title}&body=${encodeURIComponent(
      document.querySelector("meta[name=description]").getAttribute("content")
    )} ${encodeURIComponent(`${window.location.origin + window.location.pathname}?id=${this.data.mid}`)}`
    window.location.href = url
  }
}

window.customElements.define("dialog-share", DialogShare)
