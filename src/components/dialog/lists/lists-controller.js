import { Controller } from "stimulus"
import { trigger, lang, getLocale, slugify } from "../../../js/utils"
import { appState } from "../../../js/app"
import photoManager from "../../../js/photo-manager"
import listsAPI from "../../../api/lists"

export default class extends Controller {
  static get targets() {
    return ["addedTo", "addedToList", "addToListForm", "select", "name", "description", "submitButton"]
  }

  connect() {
    this.addToListFormTarget.submit = this.submitAddingToList.bind(this)
  }

  async submitAddingToList(e) {
    e.preventDefault()

    let listID = Number(this.selectTarget.value)
    let listName = Array.from(this.selectTarget.getElementsByTagName("option")).find(
      item => Number(item.getAttribute("value")) === listID
    ).innerText
    const nameInput = this.addToListFormTarget.name

    // reset error states
    nameInput.parentNode.classList.remove("error")

    // if the photo needs to be added to a new list
    if (listID === 0) {
      if (nameInput.value && nameInput.value !== "") {
        listName = nameInput.value
        listID = await listsAPI.createList(listName)
      } else {
        nameInput.parentNode.classList.add("error")
        trigger("snackbar:show", { message: lang("list_submit_error_name_missing"), status: "error", autoHide: true })
        return
      }
    }

    await listsAPI.addToList(photoManager.getSelectedPhotoId(), listID)

    trigger("snackbar:show", { message: lang("list_add_success") + listName, status: "success", autoHide: true })
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

  async renderContainingLists(id) {
    // TODO
    // const resp = await listsAPI.getContainingLists(id)

    const resp = await listsAPI.getLists(id)

    if (Object.keys(resp).length) {
      const defaultListItem = this.addedToListTarget.getElementsByClassName("dialog-lists__added-to-list-item")[0]

      // remove all list items first
      const listItems = Array.from(this.addedToListTarget.getElementsByClassName("dialog-lists__added-to-list-item"))
      listItems.forEach(item => {
        if (item !== defaultListItem) {
          this.addedToListTarget.removeChild(item)
        }
      })

      // list the lists that contains the image
      Object.keys(resp).forEach(key => {
        const newItem = defaultListItem.cloneNode(true)
        const url = `/${getLocale()}/lists/${slugify(resp[key], true)}`

        const listLink = newItem.getElementsByClassName("dialog-lists__list-link")[0]
        if (listLink) {
          listLink.innerHTML = resp[key]
          listLink.setAttribute("href", url)
        }

        const editLink = newItem.getElementsByClassName("dialog-lists__edit-link")[0]
        if (editLink) editLink.setAttribute("href", url)

        newItem.classList.add("is-visible")

        this.addedToListTarget.appendChild(newItem)
      })
    }

    this.addedToTarget.classList.toggle("is-visible", Object.keys(resp).length !== -1)

    return resp
  }

  async show() {
    if (appState("auth-signed-in")) {
      this.element.classList.add("is-visible")
      await this.renderContainingLists(photoManager.getSelectedPhotoId())
      await this.renderOptions()
      this.toggleInput()
    } else {
      trigger("snackbar:show", { message: lang("list_signin_alert"), status: "error", autoHide: true })
      trigger("dialogSignin:show")
    }
  }
}
