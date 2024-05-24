import { Controller } from "@hotwired/stimulus"
// import { appState } from "../../../js/app"
import { trigger, getURLParams, getLocale } from "../../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["form"]
  }

  connect() {
    this.formTarget.submit = this.submit.bind(this)
  }

  submit(e) {
    if (e) e.preventDefault()

    const inputs = this.formTarget.querySelectorAll(
      ".dialog-advanced-search__input input, .dialog-advanced-search__input select"
    )
    let queryURL = ""

    inputs.forEach(input => {
      // console.log(input.name, !!input.value)
      if (input.value && input.value !== "") {
        queryURL += `${queryURL.length < 1 ? "?advancedSearch=1" : ""}&${input.name}=${input.value}`
      }
    })

    if (queryURL.length > 0) {
      window.location = `/${getLocale()}/photos/${queryURL}`
    } else {
      window.location = `/${getLocale()}/photos/?q`
    }
  }

  show() {
    this.element.classList.add("is-visible")

    this.formTarget
      .querySelectorAll(".dialog-advanced-search__input input, .dialog-advanced-search__input select")
      .forEach(input => {
        input.value = ""
        trigger("change", null, input)
      })

    const params = getURLParams()

    Object.keys(params).forEach(key => {
      const input =
        this.formTarget.querySelector(`.dialog-advanced-search__input input[name=${key}]`) ||
        this.formTarget.querySelector(`.dialog-advanced-search__input select[name=${key}]`)
      if (input) {
        input.value = params[key]
        trigger("change", null, input)
      }
    })
  }

  hide() {
    this.element.classList.remove("is-visible")
  }

  restrictInput(e) {
    if (e && e.currentTarget) {
      e.currentTarget.value = e.currentTarget?.value.replace(/[^0-9]/g, "")
    }
  }
}
