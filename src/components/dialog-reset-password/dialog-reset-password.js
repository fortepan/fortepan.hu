import { trigger, lang } from "../../utils"
import auth from "../../api/auth"

class DialogResetPassword extends HTMLElement {
  constructor() {
    super()

    this.bindCustomEvents()

    // auto show panel
    if (window.location.pathname.indexOf("/user/reset/") !== -1) {
      trigger("dialogResetPassword:show")
    }
  }

  bindCustomEvents() {
    document.addEventListener("dialogResetPassword:show", this.show.bind(this))
    document.addEventListener("dialogResetPassword:hide", this.hide.bind(this))

    this.querySelector("button").addEventListener("click", this.resetPassword.bind(this))
  }

  resetPassword(e) {
    e.preventDefault()
    const password = this.querySelector("input[name=password]").value

    if (password.length > 0) {
      trigger("loadingIndicator:show", { id: "LoadingIndicatorBase" })
      this.classList.add("is-disabled")

      auth
        .resetPassword(password)
        .then(() => {
          trigger("loadingIndicator:hide", { id: "LoadingIndicatorBase" })
          this.classList.remove("is-disabled")
          trigger("dialogResetPassword:hide")
          trigger("snackbar:show", { message: lang("password_reset_success"), status: "success", autoHide: true })
        })
        .catch(() => {
          trigger("loadingIndicator:hide", { id: "LoadingIndicatorBase" })
          this.classList.remove("is-disabled")
          trigger("snackbar:show", { message: lang("password_reset_error"), status: "error", autoHide: true })
        })
    }
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
