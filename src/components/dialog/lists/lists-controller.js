import { Controller } from "stimulus"
import { trigger, lang } from "../../../js/utils"
import { appState } from "../../../js/app"
import photoManager from "../../../js/photo-manager"
import listsAPI from "../../../api/lists"

export default class extends Controller {
  static get targets() {
    return ["addedTo", "addedToList", "form", "select", "name", "description", "submitButton"]
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

    await listsAPI.addToList(photoManager.getSelectedPhotoId(), listID)

    trigger("dialogLists:hide")
  }

  success() {
    trigger("loader:hide", { id: "loaderBase" })
    this.element.classList.remove("is-disabled")

    trigger("snackbar:show", { message: lang("user_signup_success"), status: "success", autoHide: true })
    trigger("dialogLists:hide")
  }

  hide() {
    this.element.classList.remove("is-visible")
  }

  toggleInput() {
    this.nameTarget.classList.toggle("is-hidden", this.selectTarget.value !== "0")
    this.descriptionTarget.classList.toggle("is-hidden", this.selectTarget.value !== "0")
  }

  async renderOptions() {
    const resp = await listsAPI.getLists()
    let innerHTML = ""
    Object.keys(resp).forEach(key => {
      innerHTML += `<option value="${key}">${resp[key]}</option>`
    })
    innerHTML += `<option value="0">${lang("list_new")}</option>`
    this.selectTarget.innerHTML = innerHTML

    return resp
  }

  async getContainingLists(id) {
    /*
      TODO
    */
    /* const resp = await listsAPI.getContainingLists(id)

    // list the lists that contains the image
    let innerHTML = ""
    Object.keys(resp).forEach(key => {
      innerHTML += `<li><h5><a href="/">{ list name }</a></h5> (<a href="#">${lang("list_edit")}</a>)</li>`
    })
    this.addedToListTarget.innerHTML = innerHTML

    this.addedToTarget.classList.toggle("is-visible", resp.length !== -1)

    return resp */
    return id
  }

  async show() {
    if (appState("auth-signed-in")) {
      this.element.classList.add("is-visible")
      await this.getContainingLists(photoManager.getSelectedPhotoId())
      await this.renderOptions()
      this.toggleInput()
    } else {
      trigger("snackbar:show", { message: lang("list_signin_alert"), status: "error", autoHide: true })
      trigger("dialogSignin:show")
    }
  }
}
