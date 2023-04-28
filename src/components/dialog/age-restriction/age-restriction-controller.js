import { Controller } from "stimulus"
import { trigger } from "../../../js/utils"
import photoManager from "../../../js/photo-manager"
import listManager from "../../../js/list-manager"
import { appState } from "../../../js/app"

export default class extends Controller {
  static get targets() {
    return []
  }

  connect() {}

  remove(e) {
    if (e) e.preventDefault()

    const params = {}
    if (this.photoId) {
      params.photoId = this.photoId

      const photoData = appState("is-lists")
        ? listManager.getListPhotoById(listManager.getSelectedListId(), this.photoId)
        : photoManager.getPhotoDataByID(this.photoId)

      if (photoData) photoData.ageRestrictionRemoved = true
    }

    trigger("dialogAgeRestriction:remove", params)

    this.hide()
  }

  show(e) {
    this.photoId = e?.detail?.photoId
    this.element.classList.add("is-visible")
  }

  hide() {
    delete this.photoId
    this.element.classList.remove("is-visible")
  }
}
