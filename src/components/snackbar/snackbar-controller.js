import { Controller } from "stimulus"

export default class extends Controller {
  connect() {
    this.snackbarTimer = null
  }

  show(e) {
    if (!e.detail) return
    this.element.innerHTML = e.detail.message

    this.element.classList.remove("snackbar--success")
    this.element.classList.remove("snackbar--error")
    this.element.classList.add(`snackbar--${e.detail.status || "success"}`)

    setTimeout(() => {
      this.element.classList.add("snackbar--show")
    }, 50)

    if (e.detail.autoHide) {
      clearTimeout(this.snackbarTimer)
      this.snackbarTimer = setTimeout(() => {
        this.element.classList.remove("snackbar--show")
      }, 5000)
    }
  }
}
