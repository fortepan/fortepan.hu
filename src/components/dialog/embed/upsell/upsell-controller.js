import { Controller } from "@hotwired/stimulus"
import { trigger } from "../../../../js/utils"

export default class extends Controller {
  static get targets() {
    return []
  }

  showEmbedDialog(e) {
    if (e) e.preventDefault()

    trigger("dialogs:hide")
    trigger("dialogEmbed:show")
  }

  showListsDialog(e) {
    if (e) e.preventDefault()

    trigger("dialogs:hide")
    trigger("dialogLists:show")
  }
}
