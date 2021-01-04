import { trigger, lang } from "../../js/utils"
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

    trigger("loadingIndicator:show", { id: "LoadingIndicatorBase" })
    this.classList.add("is-disabled")

    auth
      .signin(credentials)
      .then(this.success.bind(this))
      .catch(this.error.bind(this))
  }

  errorMessageHandler(text) {
    const errorMessages = {
      "The user has not been activated or is blocked.": lang("user_signin_error"),
      "Sorry, unrecognized username or password.": lang("user_signin_error"),
    }

    return errorMessages[text]
  }

  error(statusText) {
    this.classList.remove("is-disabled")
    trigger("loadingIndicator:hide", { id: "LoadingIndicatorBase" })
    trigger("snackbar:show", { message: this.errorMessageHandler(statusText), status: "error", autoHide: true })
  }

  success() {
    this.classList.remove("is-disabled")
    trigger("loadingIndicator:hide", { id: "LoadingIndicatorBase" })
    trigger("dialogSignin:hide")
    trigger("snackbar:show", { message: lang("user_signin_success"), status: "success", autoHide: true })
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
