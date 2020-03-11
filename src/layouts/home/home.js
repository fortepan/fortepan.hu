import { ready, trigger } from "../../utils"
import api from "../../components/api/api"

let heroBg = null
const bgIds = [50563, 52724, 54176, 54178, 55558, 55617, 58473, 60057, 60155, 60490, 71299, 71443, 71955, 78498, 78835]

const loadBackgroundImage = () => {
  const img = new Image()
  img.onload = () => {
    heroBg.style.backgroundImage = `url("${img.src}")`
    heroBg.classList.add("home__hero__background--show")
  }
  const id = bgIds[Math.floor(Math.random() * bgIds.length)]
  img.src = `/uploads/${id}.jpg`
}

const init = () => {
  // add event listeners
  heroBg = document.querySelector(".home__hero__background")
  loadBackgroundImage()

  api.getTotal(data => {
    document.querySelector(".home__hero__total a span").textContent = data.hits.total.value
    document.querySelector(".home__hero__total").classList.add("home__hero__total--show")
  })

  document.querySelector(".home").addEventListener("scroll", e => {
    const view = e.target
    if (view.scrollTop > 0) {
      trigger("header:addShadow")
    } else {
      trigger("header:removeShadow")
    }
  })
}

ready(() => {
  if (document.querySelector(".home")) {
    init()
  }
})
