import { Controller } from "@hotwired/stimulus"

import { trigger } from "../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["map"]
  }

  connect() {
    trigger("mapview:show")
  }
}
