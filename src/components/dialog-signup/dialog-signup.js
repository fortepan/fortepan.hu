import config from "../../config"
import { lang } from "../../utils"
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
    auth.signup(credentials)
    .then(resp => {
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

window.customElements.define("dialog-signup", DialogSignup)
