import { ready } from "../../utils"
import config from "../../config"

let heroBg = null
const bgIds = [50563, 52724, 54176, 54178, 55558, 55617, 58473, 60057, 60155, 60490, 71299, 71443, 71955, 78498, 78835]

const loadBackgroundImage = () => {
  const img = new Image()
  img.onload = () => {
    heroBg.style.backgroundImage = `url("${img.src}")`
    heroBg.classList.add("home__hero__background--show")
  }
  const id = bgIds[Math.floor(Math.random() * bgIds.length)]
  img.src = `${config.PHOTO_SOURCE}${id}.jpg`
}

const init = () => {
  // add event listeners
  heroBg = document.querySelector(".home__hero__background")
  loadBackgroundImage()
}

ready(() => {
  console.log("x")
  if (document.querySelector(".home")) {
    init()
  }
})
