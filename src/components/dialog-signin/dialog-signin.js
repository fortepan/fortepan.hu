import config from "../../config"
import { lang } from "../../utils"

class DialogSignin extends HTMLElement {
  constructor() {
    super()

    this.bindCustomEvents()
  }

  bindCustomEvents() {
    document.addEventListener("DialogSignin:show", this.show.bind(this))
    document.addEventListener("DialogSignin:hide", this.hide.bind(this))
  }

  hide() {
    this.classList.remove("is-visible")
  }

  show() {
    this.classList.add("is-visible")
  }
}

window.customElements.define("dialog-signin", DialogSignin)
