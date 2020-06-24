import { trigger } from "../../utils"
import auth from "../../api/auth"

class DialogResetPassword extends HTMLElement {
  constructor() {
    super()

    this.bindCustomEvents()
  }

  bindCustomEvents() {
    document.addEventListener("dialogResetPassword:show", this.show.bind(this))
    document.addEventListener("dialogResetPassword:hide", this.hide.bind(this))

    this.querySelector("button").addEventListener("click", this.resetPassword.bind(this))
  }

  resetPassword(e) {
    e.preventDefault()
    const credentials = {}
    credentials.mail = this.querySelector("input[name=email]").value
    auth
      .forgot(credentials)
      .then(() => {
        trigger("dialogResetPassword:hide")
      })
      .catch(statusText => {
        trigger("snackbar:show", { message: statusText, status: "error", autoHide: true })
      })
  }

  hide() {
    this.classList.remove("is-visible")
  }

  show() {
    this.classList.add("is-visible")
    this.querySelector("input").focus()
  }
}

window.customElements.define("dialog-reset-password", DialogResetPassword)
