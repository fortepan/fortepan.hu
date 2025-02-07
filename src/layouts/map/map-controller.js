import { Controller } from "@hotwired/stimulus"

import { trigger } from "../../js/utils"
import photoManager from "../../js/photo-manager"

export default class extends Controller {
  static get targets() {
    return ["map"]
  }

  connect() {
    trigger("mapview:show")
  }
}
