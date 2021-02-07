import { Controller } from "stimulus"
import { trigger, lang } from "../../../js/utils"
import auth from "../../../api/auth"

export default class extends Controller {
  static get targets() {
    return ["form", "name", "password", "submitButton"]
  }

  connect() {
    this.formTarget.submit = this.submit.bind(this)
  }

  submit(e) {
    if (e) e.preventDefault()
    const credentials = {}
    credentials.name = this.nameTarget.value
    credentials.pass = this.passwordTarget.value

    trigger("loader:show", { id: "loaderBase" })
    this.element.classList.add("is-disabled")

    auth
      .signin(credentials)
      .then(this.success.bind(this))
      .catch(this.error.bind(this))
  }

  // the server response returns a string based error message in English
  // so it needs to be localized
  errorMessageHandler(text) {
    const errorMessages = {
      "The user has not been activated or is blocked.": lang("user_signin_error"),
      "Sorry, unrecognized username or password.": lang("user_signin_error"),
    }

    return errorMessages[text]
  }

  error(statusText) {
    this.element.classList.remove("is-disabled")
    trigger("loader:hide", { id: "loaderBase" })

    console.log(statusText)
    // show snackbar message
    trigger("snackbar:show", { message: this.errorMessageHandler(statusText), status: "error", autoHide: true })
  }

  success() {
    this.element.classList.remove("is-disabled")
    trigger("loader:hide", { id: "loaderBase" })
    trigger("dialogSignin:hide")

    // show snackbar message
    trigger("headerNav:refreshProfile")
    trigger("snackbar:show", { message: lang("user_signin_success"), status: "success", autoHide: true })
  }

  hide() {
    this.element.classList.remove("is-visible")
  }

  show() {
    this.element.classList.add("is-visible")
    this.nameTarget.focus()
  }

  showPasswordRequestDialog(e) {
    e.preventDefault()
    trigger("dialogs:hide")
    trigger("dialogResetPasswordRequest:show")
  }

  showSignupDialog(e) {
    e.preventDefault()
    trigger("dialogs:hide")
    trigger("dialogSignup:show")
  }
}
