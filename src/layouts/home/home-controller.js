import { Controller } from "stimulus"

import searchAPI from "../../api/search"
import { numberWithCommas } from "../../js/utils"

const bgIds = [50563, 52724, 54176, 54178, 55558, 55617, 58473, 60057, 60155, 60490, 71299, 71443, 71955, 78498, 78835]

export default class extends Controller {
  static get targets() {
    return ["heroBg", "total", "totalVal"]
  }

  connect() {
    this.loadBackgroundImage()
    this.getTotalItemsNumber()
  }

  /**
   * Load photos randomly to the hero background
   */
  loadBackgroundImage() {
    const img = new Image()

    const onLoad = () => {
      this.heroBgTarget.style.backgroundImage = `url("${img.src}")`
      this.heroBgTarget.classList.add("is-visible")
    }
    img.addEventListener("load", onLoad.bind(this))

    const id = bgIds[Math.floor(Math.random() * bgIds.length)]
    img.src = `/uploads/${id}.jpg`
  }

  /**
   * Get the total number of photos and inject the result
   */
  getTotalItemsNumber() {
    searchAPI.getTotal().then(data => {
      this.totalValTarget.textContent = numberWithCommas(data.total)
      this.totalTarget.classList.add("is-visible")
    })
  }
}
