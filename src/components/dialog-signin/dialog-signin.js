import { trigger } from "../../utils"
import auth from "../../api/auth"

class DialogSignin extends HTMLElement {
  constructor() {
    super()

    this.bindCustomEvents()
  }

  bindCustomEvents() {
    document.addEventListener("dialogSignin:show", this.show.bind(this))
    document.addEventListener("dialogSignin:hide", this.hide.bind(this))

    this.querySelector("button").addEventListener("click", this.signin.bind(this))
  }

  signin(e) {
    e.preventDefault()
    const credentials = {}
    credentials.name = this.querySelector("input[name=name]").value
    credentials.pass = this.querySelector("input[name=password]").value
    auth
      .signin(credentials)
      .then(this.success)
      .catch(this.error)
  }

  error(statusText) {
    trigger("snackbar:show", { message: statusText, status: "error", autoHide: true })
  }

  success() {
    trigger("dialogSignin:hide")
  }

  hide() {
    this.classList.remove("is-visible")
  }

  show() {
    this.classList.add("is-visible")
    this.querySelector("input").focus()
  }
}

window.customElements.define("dialog-signin", DialogSignin)
