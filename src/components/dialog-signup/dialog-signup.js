import { trigger, lang } from "../../js/utils"
import auth from "../../api/auth"

class DialogSignup extends HTMLElement {
  constructor() {
    super()

    this.bindCustomEvents()
  }

  bindCustomEvents() {
    document.addEventListener("dialogSignup:show", this.show.bind(this))
    document.addEventListener("dialogSignup:hide", this.hide.bind(this))

    this.querySelector("button").addEventListener("click", this.signup.bind(this))
  }

  signup(e) {
    e.preventDefault()
    const credentials = {}
    credentials.name = { value: this.querySelector("input[name=name]").value }
    credentials.mail = { value: this.querySelector("input[name=email]").value }
    credentials.pass = { value: this.querySelector("input[name=password]").value }

    trigger("loadingIndicator:show", { id: "LoadingIndicatorBase" })
    this.classList.add("is-disabled")

    auth
      .signup(credentials)
      .then(() => {
        this.success()
        // user should be signed in after a successful registration
        /* auth
          .signin(credentials)
          .then(this.success.bind(this))
          .catch(this.error.bind(this))
        */
      })
      .catch(this.error.bind(this))
  }

  errorMessageHandler(text) {
    if (text.indexOf("Meg kell adni egy felhasználónevet") !== -1) {
      return lang("user_signup_username_missing")
    }

    if (text.indexOf("The username is already taken") !== -1) {
      return lang("user_signup_username_taken")
    }

    if (text.indexOf("email address") !== -1 && text.indexOf("already taken") !== -1) {
      return lang("user_signup_email_taken")
    }

    if (text.indexOf("E-mail mező szükséges") !== -1) {
      return lang("user_signup_email_missing")
    }

    if (text.indexOf("This value is not a valid email address") !== -1) {
      return lang("user_signup_email_invalid")
    }

    if (text.indexOf("No password provided") !== -1) {
      return lang("user_signup_password_missing")
    }

    if (text.indexOf("unrecognized username or password") !== -1) {
      return lang("user_signin_error")
    }

    return text
  }

  error(statusText) {
    trigger("loadingIndicator:hide", { id: "LoadingIndicatorBase" })
    this.classList.remove("is-disabled")
    trigger("snackbar:show", { message: this.errorMessageHandler(statusText), status: "error", autoHide: true })
  }

  success() {
    trigger("loadingIndicator:hide", { id: "LoadingIndicatorBase" })
    this.classList.remove("is-disabled")
    trigger("snackbar:show", { message: lang("user_signup_success"), status: "success", autoHide: true })
    trigger("dialogSignup:hide")
  }

  hide() {
    this.classList.remove("is-visible")
  }

  show() {
    this.classList.add("is-visible")
    this.querySelector("input").focus()
  }
}

window.customElements.define("dialog-signup", DialogSignup)
