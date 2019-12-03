import { ready } from "../../app/app"

const Base = function(el) {
  this.init = () => {
    // add event listeners
    document.addEventListener("toggleTheme", () => {
      el.classList.toggle("theme--light")
      el.classList.toggle("theme--dark")
    })
  }
}

ready(() => {
  new Base(document.querySelector("body")).init()
})
