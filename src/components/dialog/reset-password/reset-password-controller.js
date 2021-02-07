import { Controller } from "stimulus"
import { trigger, lang } from "../../../js/utils"
import auth from "../../../api/auth"

export default class extends Controller {
  static get targets() {
    return ["form", "password", "submitButton"]
  }

  connect() {
    this.formTarget.submit = this.submit.bind(this)

    // auto show panel
    if (window.location.pathname.indexOf("/user/reset/") !== -1) {
      trigger("dialogResetPassword:show")
    }
  }

  submit(e) {
    if (e) e.preventDefault()

    const password = this.passwordTarget.value

    if (password.length > 0) {
      trigger("loader:show", { id: "loaderBase" })
      this.element.classList.add("is-disabled")

      auth
        .resetPassword(password)
        .then(() => {
          trigger("loader:hide", { id: "loaderBase" })
          this.element.classList.remove("is-disabled")
          trigger("dialogResetPassword:hide")
          trigger("snackbar:show", { message: lang("password_reset_success"), status: "success", autoHide: true })
        })
        .catch(() => {
          trigger("loader:hide", { id: "loaderBase" })
          this.element.classList.remove("is-disabled")
          trigger("snackbar:show", { message: lang("password_reset_error"), status: "error", autoHide: true })
        })
    }
  }

  hide() {
    this.element.classList.remove("is-visible")
  }

  show() {
    this.element.classList.add("is-visible")
    this.passwordTarget.focus()
  }
}
