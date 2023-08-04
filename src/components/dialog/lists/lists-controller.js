import { Controller } from "@hotwired/stimulus"
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
      "privacySwitch",
      "privacySwitchLabel",
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
    this.containingLists = null
    this.lastSelectedListId = 0

    // setting up the input fields on the forms to submit the form on pressing Enter
    if (!this.formSetupOnce) {
      this.element.querySelectorAll("form").forEach(form => {
        form.querySelectorAll("input").forEach(input => {
          input.addEventListener("keydown", e => {
            if (e.key && e.key === "Enter") {
              e.preventDefault()
              trigger("click", {}, form.querySelector("button"))
            }
          })
        })
      })
      this.formSetupOnce = true
    }
  }

  async submitAddingToList(e) {
    e.preventDefault()

    let listId = Number(this.selectTarget.value)

    if (listId < 0) return

    this.element.classList.add("is-disabled")
    trigger("loader:show", { id: "loaderBase" })

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
        // saving the last selected list to be displayed as the first option in the dropdown
        this.lastSelectedListId = listId

        const resp = await listManager.addPhotoToList(
          appState("is-lists") ? listManager.getSelectedPhotoId() : photoManager.getSelectedPhotoId(),
          listId
        )

        result.status = resp.errors ? "error" : "success"
        result.message = resp.errors ? lang("list_add_error") : lang("list_add_success") + escapeHTML(listName)

        // eslint-disable-next-line no-console
        if (resp.errors) console.error(resp.errors)
      }
    }

    this.element.classList.remove("is-disabled")
    trigger("loader:hide", { id: "loaderBase" })

    trigger("snackbar:show", { message: result.message, status: result.status, autoHide: true })

    if (result.status === "success") trigger("dialogLists:hide")
    if (result.listsChanged) trigger("dialogLists:listsChanged", { action: "create", listId })
  }

  async submitEditList(e) {
    e.preventDefault()

    this.element.classList.add("is-disabled")
    trigger("loader:show", { id: "loaderBase" })

    const nameInput = this.editListFormTarget.name
    const descriptionInput = this.editListFormTarget.description
    const isPrivate = this.privacySwitchTarget.private

    const result = {}

    if (nameInput.value && nameInput.value !== "") {
      if (this.listId === 0) {
        // adding a new list
        this.listId = await listManager.createList(nameInput.value, descriptionInput.value, isPrivate)

        result.status = this.listId === 0 ? "error" : "success"
        result.message =
          this.listId === 0 ? lang("list_create_error") : lang("list_create_success") + escapeHTML(nameInput.value)
      } else {
        // editing an existing list
        const listData = listManager.getListById(this.listId)

        if (
          listData.name !== nameInput.value ||
          listData.description !== descriptionInput.value ||
          listData.private !== isPrivate
        ) {
          const resp = await listManager.editList(listData.uuid, nameInput.value, descriptionInput.value, isPrivate)

          result.status = resp.errors ? "error" : "success"
          result.message = resp.errors ? lang("list_edit_error") : lang("list_edit_success")

          // eslint-disable-next-line no-console
          if (resp.errors) console.error(resp.errors)
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

    this.element.classList.remove("is-disabled")
    trigger("loader:hide", { id: "loaderBase" })

    trigger("snackbar:show", { message: result.message, status: result.status, autoHide: true })

    if (result.status === "success") {
      trigger("dialogLists:hide")
      trigger("dialogLists:listsChanged", { action: this.role, listId: this.listId })
    }
  }

  async deleteList(e) {
    if (e) e.preventDefault()

    this.element.classList.add("is-disabled")
    trigger("loader:show", { id: "loaderBase" })

    const result = {}

    const resp = await listManager.deleteList(listManager.getListById(this.listId).uuid)

    result.status = resp.errors ? "error" : "success"
    result.message = resp.errors ? lang("list_delete_error") : lang("list_delete_success")

    // eslint-disable-next-line no-console
    if (resp.errors) console.error(resp.errors)

    this.element.classList.remove("is-disabled")
    trigger("loader:hide", { id: "loaderBase" })

    trigger("snackbar:show", { message: result.message, status: result.status, autoHide: true })

    if (result.status === "success") {
      trigger("dialogLists:hide")
      trigger("dialogLists:listsChanged", { action: "delete", listId: this.listId })
    }
  }

  hide() {
    this.element.classList.remove("is-disabled")
    trigger("loader:hide", { id: "loaderBase" })

    this.element.classList.remove("is-visible")
  }

  toggleInput() {
    this.addToListFormNameTarget.classList.toggle("is-hidden", this.selectTarget.value !== "0")
    this.addToListFormDescriptionTarget.classList.toggle("is-hidden", this.selectTarget.value !== "0")
  }

  async renderOptions() {
    const lists = await listManager.getLists()
    let innerHTML = ""

    if (!this.containingLists) {
      this.containingLists = await listManager.getContainingLists(
        appState("is-lists") ? listManager.getSelectedPhotoId() : photoManager.getSelectedPhotoId()
      )
    }

    if (
      this.lastSelectedListId !== 0 &&
      this.containingLists.indexOf(listManager.getListById(this.lastSelectedListId)) === -1
    ) {
      const lastListData = listManager.getListById(this.lastSelectedListId)
      innerHTML += `<option value="${lastListData.id}">${escapeHTML(lastListData.name)}</option>`
    } else {
      innerHTML += `<option value="-1" disabled selected>${lang("list_select")}</option>`
    }

    // adding the option to create a new list at the end
    innerHTML += `<option value="0">${lang("list_new")}</option>`

    lists.forEach(listData => {
      if (
        this.lastSelectedListId.toString() !== listData.id.toString() &&
        this.containingLists.indexOf(listData) === -1
      ) {
        innerHTML += `<option value="${listData.id}">${escapeHTML(listData.name)}</option>`
      }
    })

    this.selectTarget.innerHTML = innerHTML

    return lists
  }

  async renderContainingLists() {
    if (!this.containingLists) {
      this.containingLists = await listManager.getContainingLists(
        appState("is-lists") ? listManager.getSelectedPhotoId() : photoManager.getSelectedPhotoId()
      )
    }

    // remove all list tags first
    this.addedToListTarget.querySelectorAll(".dialog-lists__list-tag").forEach(item => item.remove())

    if (this.containingLists.length) {
      // list the list tags that contains the photo
      this.containingLists.forEach(listData => {
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

    this.addedToSectionTarget.classList.toggle("is-visible", this.containingLists.length > 0)

    return this.containingLists
  }

  async show(e) {
    if (appState("auth-signed-in")) {
      this.element.classList.add("is-disabled")
      trigger("loader:show", { id: "loaderBase" })

      this.role = e && e.detail && e.detail.action ? e.detail.action : "addPhotos"
      this.listId = e && e.detail && e.detail.listId ? e.detail.listId : 0
      this.containingLists = null

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

      this.element.classList.remove("is-disabled")
      trigger("loader:hide", { id: "loaderBase" })
    } else {
      trigger("snackbar:show", { message: lang("list_signin_alert"), status: "error", autoHide: true })
      trigger("dialogSignin:show")
    }
  }

  async deletePhotoFromList(e) {
    if (e) e.preventDefault()

    if (e && e.currentTarget) {
      this.element.classList.add("is-disabled")
      trigger("loader:show", { id: "loaderBase" })

      this.closeListTagDropdowns()

      const listData = listManager.getListById(e.currentTarget.listId)
      const result = {}
      const photoId = appState("is-lists") ? listManager.getSelectedPhotoId() : photoManager.getSelectedPhotoId()

      const resp = await listManager.deletePhotoFromList(photoId, listData.id)

      result.status = resp.errors ? "error" : "success"
      result.message = resp.errors
        ? lang("list_remove_from_error")
        : lang("list_remove_from_success") + escapeHTML(listData.name)

      // eslint-disable-next-line no-console
      if (resp.errors) console.error(resp.errors)

      if (!resp.errors) {
        // reset the continaing list
        this.containingLists = null

        // re-render the forms to exclude the deleted list
        await this.renderContainingLists()
        await this.renderOptions()
        this.toggleInput()
      }

      this.element.classList.remove("is-disabled")
      trigger("loader:hide", { id: "loaderBase" })

      trigger("snackbar:show", { message: result.message, status: result.status, autoHide: true })

      trigger("dialogLists:photoRemoved", { id: photoId })
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

    this.renderPrivacySwitch(listData ? listData.private : false)
  }

  renderDeleteSection(listId) {
    const listData = listManager.getListById(listId)
    const title = this.sectionDeleteTarget.querySelector(".dialog-lists__delete-title")

    title.innerHTML = escapeHTML(listData.name)
  }

  togglePrivacySwitch() {
    const isPrivate = !this.privacySwitchTarget.private
    this.renderPrivacySwitch(isPrivate)
  }

  renderPrivacySwitch(isPrivate) {
    this.privacySwitchTarget.private = isPrivate
    this.privacySwitchTarget.classList.toggle("is-selected", isPrivate)

    this.privacySwitchLabelTarget.innerHTML = isPrivate
      ? lang("list_edit_private_label")
      : lang("list_edit_public_label")
  }
}
