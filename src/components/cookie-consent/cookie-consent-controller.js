import { Controller } from "stimulus"
import { trigger, globalSettings } from "../../js/utils"

export default class CookieConsent extends Controller {
  static get targets() {
    return ["form"]
  }

  connect() {
    this.addEventListeners()

    /**
     *  Check local storage settings
     */
    if (localStorage.getItem("allowCookies") !== "1") {
      // When no cookie consent related local storage items are set
      setTimeout(() => {
        this.show()
      }, 100)
    } else {
      // Otherwise
      setTimeout(() => {
        this.publishState()
      }, 100)
    }
  }

  /**
   * Custom event listeners
   *
   * When an other component controller fires the events below, the following methods will be called
   * cookieConsent:show -> this.show
   * cookieConsent:hide -> this.hide
   */
  addEventListeners() {
    document.addEventListener("cookieConsent:show", this.show.bind(this))
    document.addEventListener("cookieConsent:hide", this.hide.bind(this))
  }

  /**
   * Disable form submit and submit on Enter
   */
  disableFormSubmitOnEnter(e) {
    if (e.key === "Enter") {
      e.preventDefault()
    }
  }

  disableFormSubmit(e) {
    e.preventDefault()
  }

  /**
   * Allow cookies by accepting the consent
   */
  accept() {
    localStorage.setItem("allowCookies", "1")

    this.publishState()

    this.hide()
  }

  publishState() {
    // Publish the approval to the application for other component listeners
    trigger("cookieConsent:cookiesAllowed")

    // Save the state to the dom
    globalSettings.setItem("cookiesAllowed", true)
  }

  /** Show / hide component */
  hide() {
    this.element.classList.remove("is-visible")
  }

  show() {
    this.element.classList.add("is-visible")
  }
}
