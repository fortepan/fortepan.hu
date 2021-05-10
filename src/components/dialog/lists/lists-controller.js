import { Controller } from "stimulus"
import { trigger, lang, escapeHTML } from "../../../js/utils"
import { appState } from "../../../js/app"
import photoManager from "../../../js/photo-manager"
import listManager from "../../../js/list-manager"

export default class extends Controller {
  static get targets() {
    return [
      "addedToSection",
      "addedToList",
      "addToListForm",
      "select",
      "addToListFormName",
      "addToListFormDescription",
      "editListForm",
      "section",
      "sectionAddPhotos",
      "sectionEdit",
      "sectionDelete",
    ]
  }

  connect() {
    this.addToListFormTarget.submit = this.submitAddingToList.bind(this)
    this.role = "addPhotos"
    this.listId = 0
  }

  async submitAddingToList(e) {
    e.preventDefault()

    let listId = Number(this.selectTarget.value)
    let listName = Array.from(this.selectTarget.getElementsByTagName("option")).find(
      item => Number(item.getAttribute("value")) === listId
    ).innerText

    const nameInput = this.addToListFormTarget.name
    const descriptionInput = this.addToListFormTarget.description

    const result = {}

    // reset error states
    nameInput.parentNode.classList.remove("error")

    if (listId === 0) {
      if (nameInput.value && nameInput.value !== "") {
        // if the photo needs to be added to a new list
        listName = nameInput.value
        listId = await listManager.createList(nameInput.value, descriptionInput.value)
        result.listsChanged = listId !== 0
      } else {
        nameInput.parentNode.classList.add("error")
        result.status = "error"
        result.message = lang("list_submit_error_name_missing")
      }
    }

    if (result.status !== "error") {
      // if there isn't any error yet
      if (listId === 0) {
        // error handling if the listId is still 0
        result.status = "error"
        result.message = lang("list_create_error")
      } else {
        const resp = await listManager.addPhotoToList(photoManager.getSelectedPhotoId(), listId)

        result.status = resp.errors ? "error" : "success"
        result.message = resp.errors ? lang("list_add_error") : lang("list_add_success") + escapeHTML(listName)

        if (resp.errors) console.log(resp)
      }
    }

    trigger("snackbar:show", { message: result.message, status: result.status, autoHide: true })

    if (result.status === "success") trigger("dialogLists:hide")
    if (result.listsChanged) trigger("dialogLists:listsChanged", { action: "create", listId })
  }

  async submitEditList(e) {
    e.preventDefault()

    const nameInput = this.editListFormTarget.name
    const descriptionInput = this.editListFormTarget.description

    const result = {}

    if (nameInput.value && nameInput.value !== "") {
      if (this.listId === 0) {
        // adding a new list
        this.listId = await listManager.createList(nameInput.value, descriptionInput.value)

        result.status = this.listId === 0 ? "error" : "success"
        result.message =
          this.listId === 0 ? lang("list_create_error") : lang("list_create_success") + escapeHTML(nameInput.value)
      } else {
        // editing an existing list
        const listData = listManager.getListById(this.listId)

        if (listData.name !== nameInput.value || listData.description !== descriptionInput.value) {
          const resp = await listManager.editList(this.listId, nameInput.value, descriptionInput.value)

          result.status = resp.errors ? "error" : "success"
          result.message = resp.errors ? lang("list_edit_error") : lang("list_edit_success")

          if (resp.errors) console.log(resp)
        } else {
          // no changes, lets return
          return
        }
      }
    } else {
      nameInput.parentNode.classList.add("error")
      result.status = "error"
      result.message = lang("list_submit_error_name_missing")
    }

    trigger("snackbar:show", { message: result.message, status: result.status, autoHide: true })

    if (result.status === "success") {
      trigger("dialogLists:hide")
      trigger("dialogLists:listsChanged", { action: this.role, listId: this.listId })
    }
  }

  async deleteList(e) {
    if (e) e.preventDefault()

    const result = {}

    const resp = await listManager.deleteList(this.listId)

    result.status = resp.errors ? "error" : "success"
    result.message = resp.errors ? lang("list_delete_error") : lang("list_delete_success")

    if (resp.errors) console.log(resp)

    trigger("snackbar:show", { message: result.message, status: result.status, autoHide: true })

    if (result.status === "success") {
      trigger("dialogLists:hide")
      trigger("dialogLists:listsChanged", { action: "delete", listId: this.listId })
    }
  }

  hide() {
    this.element.classList.remove("is-visible")
  }

  toggleInput() {
    this.addToListFormNameTarget.classList.toggle("is-hidden", this.selectTarget.value !== "0")
    this.addToListFormDescriptionTarget.classList.toggle("is-hidden", this.selectTarget.value !== "0")
  }

  async renderOptions() {
    const lists = await listManager.getLists()
    let innerHTML = ""

    lists.forEach(listData => {
      // TODO: exclude the lists from the dropdown that already contains the photo
      innerHTML += `<option value="${listData.id}">${escapeHTML(listData.name)}</option>`
    })

    // adding the option to create a new list at the end
    innerHTML += `<option value="0">${lang("list_new")}</option>`

    this.selectTarget.innerHTML = innerHTML

    return lists
  }

  async renderContainingLists() {
    // TODO: get the all the lists containing the photo
    // const resp = await listManager.getContainingLists(photoManager.getSelectedPhotoId())

    const lists = await listManager.getLists()

    if (lists.length) {
      // remove all list tags first
      this.addedToListTarget.querySelectorAll(".dialog-lists__list-tag").forEach(item => item.remove())

      // list the list tags that contains the photo
      lists.forEach(listData => {
        const template = document.getElementById("dialog-list-tag").content.firstElementChild

        const newTag = template.cloneNode(true)
        newTag.setAttribute("data-action", "mouseleave->dialog--lists#closeListTagDropdowns")

        const listLabel = newTag.querySelector(".dialog-lists__list-tag__label")
        if (listLabel) {
          listLabel.innerHTML = escapeHTML(listData.name)
          listLabel.setAttribute("href", listData.url)
        }

        const dropdownButton = newTag.querySelector(".dialog-lists__list-tag__icon")
        if (dropdownButton) dropdownButton.setAttribute("data-action", "click->dialog--lists#openListTagDropdown")

        const listLink = newTag.querySelector(".dialog-lists__tag-link--open-list")
        if (listLink) listLink.setAttribute("href", listData.url)

        const removeLink = newTag.querySelector(".dialog-lists__tag-link--remove")
        if (removeLink) {
          removeLink.setAttribute("data-action", "click->dialog--lists#deletePhotoFromList")
          removeLink.listId = listData.id
        }

        newTag.classList.add("is-visible")

        this.addedToListTarget.appendChild(newTag)
      })
    }

    this.addedToSectionTarget.classList.toggle("is-visible", lists.length > 0)

    return lists
  }

  async show(e) {
    if (appState("auth-signed-in")) {
      this.role = e && e.detail && e.detail.action ? e.detail.action : "addPhotos"
      this.listId = e && e.detail && e.detail.listId ? e.detail.listId : 0

      this.sectionTargets.forEach(section => section.classList.remove("is-visible"))

      switch (this.role) {
        case "addPhotos":
        default:
          await this.renderContainingLists()
          await this.renderOptions()
          this.toggleInput()
          break
        case "create":
        case "edit":
          this.renderEditSection(this.listId, this.role)
          break
        case "delete":
          this.renderDeleteSection(this.listId)
          break
      }

      this.sectionTargets
        .find(section => {
          const role = this.role === "create" ? "edit" : this.role
          return section.getAttribute("role") === role
        })
        .classList.add("is-visible")

      this.element.classList.add("is-visible")
    } else {
      trigger("snackbar:show", { message: lang("list_signin_alert"), status: "error", autoHide: true })
      trigger("dialogSignin:show")
    }
  }

  async deletePhotoFromList(e) {
    if (e) e.preventDefault()

    if (e && e.currentTarget) {
      const listData = listManager.getListById(e.currentTarget.listId)
      const listTag = e.currentTarget.parentNode.parentNode
      const result = {}

      const resp = await listManager.deletePhotoFromList(photoManager.getSelectedPhotoId(), listData.id)

      result.status = resp.errors ? "error" : "success"
      result.message = resp.errors
        ? lang("list_remove_from_error")
        : lang("list_remove_from_success") + escapeHTML(listData.name)

      if (resp.errors) console.log(resp)

      trigger("snackbar:show", { message: result.message, status: result.status, autoHide: true })

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
      const dropdown = listTag.querySelector(".header-nav__popup")

      this.closeListTagDropdowns(dropdown)
      dropdown.classList.toggle("is-visible")
    }
  }

  closeListTagDropdowns(elementToExclude) {
    if (this.addedToSectionTarget.classList.contains("is-visible")) {
      this.element.querySelectorAll(".header-nav__popup").forEach(dropdown => {
        if (!elementToExclude || elementToExclude !== dropdown) {
          dropdown.classList.remove("is-visible")
        }
      })
    }
  }

  renderEditSection(listId, role) {
    const header = this.sectionEditTarget.getElementsByTagName("h3")[0]
    if (header) header.innerHTML = role === "edit" ? lang("list_edit_header") : lang("list_create_header")

    const listData = listManager.getListById(listId)

    this.editListFormTarget.name.value = listData ? listData.name || "" : ""
    trigger("change", null, this.editListFormTarget.name)

    this.editListFormTarget.description.value = listData ? listData.description || "" : ""
    trigger("change", null, this.editListFormTarget.description)
  }

  renderDeleteSection(listId) {
    const listData = listManager.getListById(listId)
    const title = this.sectionDeleteTarget.querySelector(".dialog-lists__delete-title")

    title.innerHTML = escapeHTML(listData.name)
  }
}
