import { Controller } from "stimulus"
import { trigger, lang } from "../../../js/utils"
import auth from "../../../api/auth"

export default class extends Controller {
  static get targets() {
    return ["form", "email", "submitButton"]
  }

  connect() {
    this.formTarget.submit = this.submit.bind(this)
  }

  submit(e) {
    if (e) e.preventDefault()

    const email = this.emailTarget.value

    if (email.length > 0) {
      trigger("loader:show", { id: "loaderBase" })
      this.element.classList.add("is-disabled")

      auth
        .forgot(email)
        .then(() => {
          trigger("loader:hide", { id: "loaderBase" })
          this.element.classList.remove("is-disabled")
          trigger("dialogResetPasswordRequest:hide")
          trigger("snackbar:show", { message: lang("password_forgot_success"), status: "success", autoHide: true })
        })
        .catch(statusText => {
          trigger("loader:hide", { id: "loaderBase" })
          this.element.classList.remove("is-disabled")
          trigger("snackbar:show", { message: this.errorMessageHandler(statusText), status: "error", autoHide: true })
        })
    }
  }

  errorMessageHandler(text) {
    const errorMessages = {
      "Unrecognized username or email address.": lang("password_forgot_error"),
      "The user has not been activated or is blocked.": lang("password_forgot_not_activated"),
    }

    return errorMessages[text]
  }

  hide() {
    this.element.classList.remove("is-visible")
  }

  show() {
    this.element.classList.add("is-visible")
    this.emailTarget.focus()
  }
}
