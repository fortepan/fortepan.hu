import { Controller } from "stimulus"
import { getURLParams } from "../../js/utils"
import { removeAppState, setAppState } from "../../js/app"

export default class extends Controller {
  static get targets() {
    return []
  }

  connect() {
    // check for BE dev status
    this.checkDevStatus()
  }

  checkDevStatus() {
    const params = getURLParams()

    if (params.dev && params.dev === "1") {
      localStorage.setItem("isDev", 1)
    }

    if (params.dev && params.dev === "0") {
      localStorage.removeItem("isDev")
    }

    if (localStorage.getItem("isDev")) {
      setAppState("is-dev")
    } else {
      removeAppState("is-dev")
    }
  }
}
