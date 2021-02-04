import { trigger, lang } from "../../js/utils"
import auth from "../../api/auth"

class DialogResetPasswordRequest extends HTMLElement {
  constructor() {
    super()

    this.bindCustomEvents()
  }

  bindCustomEvents() {
    document.addEventListener("dialogResetPasswordRequest:show", this.show.bind(this))
    document.addEventListener("dialogResetPasswordRequest:hide", this.hide.bind(this))

    this.querySelector("button").addEventListener("click", this.resetPassword.bind(this))
  }

  resetPassword(e) {
    e.preventDefault()
    const email = this.querySelector("input[name=email]").value

    if (email.length > 0) {
      trigger("loader:show", { id: "loaderBase" })
      this.classList.add("is-disabled")

      auth
        .forgot(email)
        .then(() => {
          trigger("loader:hide", { id: "loaderBase" })
          this.classList.remove("is-disabled")
          trigger("dialogResetPasswordRequest:hide")
          trigger("snackbar:show", { message: lang("password_forgot_success"), status: "success", autoHide: true })
        })
        .catch(statusText => {
          trigger("loader:hide", { id: "loaderBase" })
          this.classList.remove("is-disabled")
          trigger("snackbar:show", { message: this.errorMessageHandler(statusText), status: "error", autoHide: true })
        })
    }
  }

  errorMessageHandler(text) {
    const errorMessages = {
      "Unrecognized username or email address.": lang("password_forgot_error"),
    }

    return errorMessages[text]
  }

  hide() {
    this.classList.remove("is-visible")
  }

  show() {
    this.classList.add("is-visible")
    this.querySelector("input").focus()
  }
}

window.customElements.define("dialog-reset-password-request", DialogResetPasswordRequest)
