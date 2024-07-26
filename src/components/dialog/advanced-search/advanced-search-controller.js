import { Controller } from "@hotwired/stimulus"
// import { appState } from "../../../js/app"
import { trigger, getURLParams, getLocale } from "../../../js/utils"
import { appState } from "../../../js/app"

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
      const linkedCheckbox = this.formTarget.querySelector(
        `.dialog-advanced-search__checkbox input[name=${input.name}-empty]`
      )

      if (linkedCheckbox && linkedCheckbox.checked) {
        queryURL += `${queryURL.length < 1 ? "?advancedSearch=1" : ""}&${input.name}=null`
      } else if (input.value && input.value.length) {
        queryURL += `${queryURL.length < 1 ? "?advancedSearch=1" : ""}&${input.name}=${input.value}`
      }
    })

    if (queryURL.length === 0) queryURL = `?q`

    if (window.location.pathname.indexOf("/photos") === -1 || appState("is-lists")) {
      window.location = `/${getLocale()}/photos/${queryURL}`
    } else {
      trigger("photos:historyPushState", {
        url: queryURL,
        resetPhotosGrid: true,
      })

      this.hide()
    }
  }

  show() {
    this.element.classList.add("is-visible")

    // resetting all the inputs
    this.formTarget
      .querySelectorAll(".dialog-advanced-search__input input, .dialog-advanced-search__input select")
      .forEach(input => {
        input.value = ""
      })

    // resetting all the checkboxes
    this.formTarget.querySelectorAll(".dialog-advanced-search__checkbox input").forEach(input => {
      input.checked = false
    })

    const params = getURLParams()

    if (params.advancedSearch) {
      Object.keys(params).forEach(key => {
        if (params[key] === "null") {
          this.formTarget.querySelector(`.dialog-advanced-search__checkbox input[name=${key}-empty]`).checked = true
        } else {
          const input =
            this.formTarget.querySelector(`.dialog-advanced-search__input input[name=${key}]`) ||
            this.formTarget.querySelector(`.dialog-advanced-search__input select[name=${key}]`)

          if (input) {
            input.value = params[key]
          }
        }
      })
    }
  }

  hide() {
    this.element.classList.remove("is-visible")
  }

  restrictInput(e) {
    if (e && e.currentTarget) {
      e.currentTarget.value = e.currentTarget?.value.replace(/[^0-9]/g, "")
    }
  }

  onInputChange(e) {
    if (e && e.currentTarget) {
      // on typing in the input uncheck the linked checkbox
      this.formTarget.querySelector(
        `.dialog-advanced-search__checkbox input[name=${e.currentTarget.name}-empty]`
      ).checked = false
    }
  }

  onCheckboxChange(e) {
    if (e && e.currentTarget && e.currentTarget.checked) {
      // on checking in the linked checkbox empty the input value
      this.formTarget.querySelector(
        `.dialog-advanced-search__input input[name=${e.currentTarget.name.replace("-empty", "")}]`
      ).value = ""
    }
  }
}
