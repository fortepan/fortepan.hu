import config from "../../config"
import { lang, trigger } from "../../utils"
import auth from "../../api/auth"

class DialogResetPassword extends HTMLElement {
  constructor() {
    super()

    this.bindCustomEvents()
  }

  bindCustomEvents() {
    document.addEventListener("dialogSignin:show", this.show.bind(this))
    document.addEventListener("dialogSignin:hide", this.hide.bind(this))

    this.querySelector("button").addEventListener("click", this.resetPassword.bind(this))
  }

  resetPassword(e) {
    e.preventDefault()
    const credentials = {}
    credentials.email = this.querySelector("input[name=email]").value
    auth
      .signin(credentials)
      .then(resp => {
        trigger("dialogSignin:hide")
        console.log(resp)
      })
      .catch(err => {
        console.log(err)
      })
  }

  hide() {
    this.classList.remove("is-visible")
  }

  show() {
    this.classList.add("is-visible")
  }
}

window.customElements.define("dialog-reset-password", DialogResetPassword)
