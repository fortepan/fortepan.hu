import { Controller } from "stimulus"

import { setPageMeta, getURLParams } from "../../js/utils"
import searchAPI from "../../api/search"

export default class extends Controller {
  static get targets() {
    return ["content", "title"]
  }

  connect() {
    this.renderContent()
  }

  renderContent() {
    const URLparams = getURLParams()
    searchAPI.getStatic(URLparams.content).then(data => {
      setPageMeta(data.title, data.content, null)
      this.contentTarget.innerHTML = data.content
      this.titleTarget.innerHTML = data.title
    })
  }
}
