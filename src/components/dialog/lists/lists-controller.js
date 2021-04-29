import { Controller } from "stimulus"
import { trigger, lang, getLocale, slugify, escapeHTML } from "../../../js/utils"
import { appState } from "../../../js/app"
import photoManager from "../../../js/photo-manager"
import listsAPI from "../../../api/lists"

export default class extends Controller {
  static get targets() {
    return ["addedToSection", "addedToList", "addToListForm", "select", "name", "description", "submitButton"]
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

    trigger("snackbar:show", {
      message: lang("list_add_success") + escapeHTML(listName),
      status: "success",
      autoHide: true,
    })
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
      // TODO: exclude the lists from the dropdown that already contains the photo
      innerHTML += `<option value="${key}">${escapeHTML(resp[key])}</option>`
    })

    // adding the option to create a new list at the end
    innerHTML += `<option value="0">${lang("list_new")}</option>`

    this.selectTarget.innerHTML = innerHTML

    return resp
  }

  async renderContainingLists() {
    // TODO: get the all the lists containing the photo
    // const resp = await listsAPI.getContainingLists(photoManager.getSelectedPhotoId())

    const resp = await listsAPI.getLists(photoManager.getSelectedPhotoId())

    if (Object.keys(resp).length) {
      // remove all list tags first
      const listTags = Array.from(this.addedToListTarget.getElementsByClassName("dialog-lists__list-tag"))
      listTags.forEach(item => item.remove())

      // list the list tags that contains the photo
      Object.keys(resp).forEach(key => {
        const url = `/${getLocale()}/lists/${slugify(resp[key], true)}`
        const template = document.getElementById("dialog-list-tag").content.firstElementChild

        const newTag = template.cloneNode(true)
        newTag.setAttribute("data-action", "mouseleave->dialog--lists#closeListTagDropdowns")

        const listLabel = newTag.getElementsByClassName("dialog-lists__list-tag__label")[0]
        if (listLabel) {
          listLabel.innerHTML = escapeHTML(resp[key])
          listLabel.setAttribute("href", url)
        }

        const dropdownButton = newTag.getElementsByClassName("dialog-lists__list-tag__icon")[0]
        if (dropdownButton) dropdownButton.setAttribute("data-action", "click->dialog--lists#openListTagDropdown")

        const listLink = newTag.getElementsByClassName("dialog-lists__tag-link--open-list")[0]
        if (listLink) listLink.setAttribute("href", url)

        const removeLink = newTag.getElementsByClassName("dialog-lists__tag-link--remove")[0]
        if (removeLink) {
          removeLink.setAttribute("data-action", "click->dialog--lists#deletePhotoFromList")
          removeLink.dataset.listID = key
          removeLink.dataset.listName = resp[key]
        }

        newTag.classList.add("is-visible")

        this.addedToListTarget.appendChild(newTag)
      })
    }

    this.addedToSectionTarget.classList.toggle("is-visible", Object.keys(resp).length !== -1)

    return resp
  }

  async show() {
    if (appState("auth-signed-in")) {
      this.element.classList.add("is-visible")

      await this.renderContainingLists()
      await this.renderOptions()
      this.toggleInput()
    } else {
      trigger("snackbar:show", { message: lang("list_signin_alert"), status: "error", autoHide: true })
      trigger("dialogSignin:show")
    }
  }

  async deletePhotoFromList(e) {
    if (e) e.preventDefault()

    if (e && e.currentTarget) {
      const data = e.currentTarget.dataset
      const listTag = e.currentTarget.parentNode.parentNode

      await listsAPI.deleteFromList(photoManager.getSelectedPhotoId(), data.listID)

      trigger("snackbar:show", {
        message: lang("list_remove_from_success") + escapeHTML(data.listName),
        status: "success",
        autoHide: true,
      })

      // temporarily remove the list-tag (until the api callback returns, see below)
      listTag.remove()

      // re-render the forms to exclude the deleted list
      await this.renderContainingLists()
      await this.renderOptions()
      this.toggleInput()
    }
  }

  openListTagDropdown(e) {
    if (e) {
      e.preventDefault()

      const listTag = e.currentTarget.parentNode
      const dropdown = listTag.getElementsByClassName("header-nav__popup")[0]

      this.closeListTagDropdowns(dropdown)
      dropdown.classList.toggle("is-visible")
    }
  }

  closeListTagDropdowns(elementToExclude) {
    if (this.addedToSectionTarget.classList.contains("is-visible")) {
      const dropdowns = Array.from(this.element.getElementsByClassName("header-nav__popup"))

      dropdowns.forEach(dropdown => {
        if (!elementToExclude || elementToExclude !== dropdown) {
          dropdown.classList.remove("is-visible")
        }
      })
    }
  }
}
