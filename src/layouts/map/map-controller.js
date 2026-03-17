import { Controller } from "@hotwired/stimulus"
import { trigger } from "../../js/utils"
import { setAppState } from "../../js/app"

// import { trigger } from "../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["mapview"]
  }

  connect() {
    /* Promise.resolve(true).then(() => {
      // initial location // Gyor
      const bounds = {
        top_left: {
          lat: 47.727,
          lng: 17.549,
        },
        bottom_right: { lat: 47.602, lng: 17.717 },
      }

      trigger("mapview:show")
      trigger("mapview:setbounds", { bounds })
    }) */
    // document.querySelector(".header-nav").classList.add("has-shadow")

    setAppState("is-map")

    Promise.resolve(true).then(() => {
      trigger("mapview:show")
    })
  }
}
