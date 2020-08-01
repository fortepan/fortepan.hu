import search from "../../api/search"
import { numberWithCommas } from "../../utils"

const bgIds = [50563, 52724, 54176, 54178, 55558, 55617, 58473, 60057, 60155, 60490, 71299, 71443, 71955, 78498, 78835]

class LayoutHome extends HTMLElement {
  constructor() {
    super()
    this.heroBg = this.querySelector(".layout-home__hero__background")

    if (this.heroBg) {
      this.loadBackgroundImage()
    }

    this.getTotalItemsNumber()
  }

  loadBackgroundImage() {
    const img = new Image()

    const onLoad = () => {
      this.heroBg.style.backgroundImage = `url("${img.src}")`
      this.heroBg.classList.add("is-visible")
    }
    img.addEventListener("load", onLoad.bind(this))

    const id = bgIds[Math.floor(Math.random() * bgIds.length)]
    img.src = `/uploads/${id}.jpg`
  }

  getTotalItemsNumber() {
    search.getTotal(data => {
      this.querySelector(".layout-home__hero__total a span").textContent = numberWithCommas(data.hits.total.value)
      this.querySelector(".layout-home__hero__total").classList.add("is-visible")
    })
  }
}
window.customElements.define("layout-home", LayoutHome)
