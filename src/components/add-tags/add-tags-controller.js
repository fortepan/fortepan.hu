import { Controller } from "stimulus"

import { selectedThumbnail } from "../../js/app"
import { trigger, lang } from "../../js/utils"
import auth from "../../api/auth"
import addTag from "../../api/add-tag"

export default class extends Controller {
  static get targets() {
    return ["tags", "addButton", "submitButton", "form", "input"]
  }

  connect() {
    this.formTarget.submit = this.submit.bind(this)

    // reset selectize control
    setTimeout(() => {
      this.inputTarget.selectizeControl.reset()
      this.hideForm()
    }, 100)
  }

  showForm() {
    auth.getUserStatus().then(userIsSignedIn => {
      if (userIsSignedIn) {
        this.addButtonTarget.classList.add("is-hidden")
        this.formTarget.classList.remove("is-hidden")
        this.inputTarget.selectizeControl.focus()
      } else {
        trigger("snackbar:show", { message: lang("tags_signin_alert"), status: "error", autoHide: true })
        trigger("dialogSignin:show")
      }
    })
  }

  hideForm() {
    this.addButtonTarget.classList.remove("is-hidden")
    this.formTarget.classList.add("is-hidden")
  }

  submit(e) {
    if (e) e.preventDefault()
    const tags = this.inputTarget.selectizeControl.value
    const data = selectedThumbnail.itemData

    if (tags.length > 0) {
      addTag(tags, data.mid[0])
        .then(() => {
          this.inputTarget.selectizeControl.reset()
          trigger("snackbar:show", { message: lang("tags_save_success"), status: "success", autoHide: true })
        })
        .catch(() => {
          trigger("snackbar:show", { message: lang("tags_save_error"), status: "error", autoHide: true })
        })
    }
  }
}
