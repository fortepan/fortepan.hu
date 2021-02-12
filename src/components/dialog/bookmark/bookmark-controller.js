import { Controller } from "stimulus"
import { trigger, lang } from "../../../js/utils"
import { appState, selectedThumbnail } from "../../../js/app"
import listsAPI from "../../../api/lists"

export default class extends Controller {
  static get targets() {
    return ["form", "select", "name", "submitButton"]
  }

  connect() {
    this.formTarget.submit = this.submit.bind(this)
  }

  async submit(e) {
    e.preventDefault()

    let listID = Number(this.selectTarget.value)
    // if the photo needs to be added to a new list
    if (listID === 0) {
      listID = await listsAPI.createList(this.formTarget.name.value)
    }

    await listsAPI.addToList(selectedThumbnail.itemData.mid[0], listID)

    trigger("dialogBookmark:hide")
  }

  success() {
    trigger("loader:hide", { id: "loaderBase" })
    this.element.classList.remove("is-disabled")

    trigger("snackbar:show", { message: lang("user_signup_success"), status: "success", autoHide: true })
    trigger("dialogBookmark:hide")
  }

  hide() {
    this.element.classList.remove("is-visible")
  }

  toggleInput() {
    this.nameTarget.classList.toggle("is-hidden", this.selectTarget.value !== "0")
  }

  async renderOptions() {
    const resp = await listsAPI.getLists()
    let innerHTML = `<option value="0">${lang("bookmark_new")}</option>`
    Object.keys(resp).forEach(key => {
      innerHTML += `<option value="${key}">${resp[key]}</option>`
    })
    this.selectTarget.innerHTML = innerHTML

    return resp
  }

  async show() {
    if (appState("auth-signed-in")) {
      this.element.classList.add("is-visible")
      await this.renderOptions()
      this.toggleInput()
    } else {
      trigger("snackbar:show", { message: lang("bookmark_signin_alert"), status: "error", autoHide: true })
      trigger("dialogSignin:show")
    }
  }
}
