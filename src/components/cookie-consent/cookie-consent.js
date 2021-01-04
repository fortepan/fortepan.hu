import { trigger } from "../../js/utils"

class CookieConsent extends HTMLElement {
  constructor() {
    super()

    this.bindCustomEvents()

    // check cookie settings
    if (localStorage.getItem("allowCookies") !== "1") {
      setTimeout(() => {
        this.show()
      }, 100)
    } else {
      setTimeout(() => {
        this.publishState()
      }, 100)
    }
  }

  bindCustomEvents() {
    document.addEventListener("cookieConsent:show", this.show.bind(this))
    document.addEventListener("cookieConsent:hide", this.hide.bind(this))

    this.form = this.querySelector("form")
    this.initForm()
  }

  initForm() {
    this.form.querySelector(".cookie-consent__form__accept").addEventListener("click", this.allowCookies.bind(this))
    this.form.querySelector(".cookie-consent__form__decline").addEventListener("click", this.hide.bind(this))

    // reset form submit and submit with Enter
    this.form.addEventListener("keypress", e => {
      if (e.key === "Enter") {
        e.preventDefault()
      }
    })
    this.form.addEventListener("submit", e => {
      e.preventDefault()
    })
  }

  allowCookies() {
    localStorage.setItem("allowCookies", "1")
    this.publishState()
    this.hide()
  }

  publishState() {
    trigger("cookiesAllowed")
    document.querySelector("body").classList.add("cookies-allowed")
  }

  hide() {
    this.classList.remove("is-visible")
  }

  show() {
    this.classList.add("is-visible")
  }
}

window.customElements.define("cookie-consent", CookieConsent)
