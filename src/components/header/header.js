import { ready, trigger } from "../../app/app"

const Header = function(el) {
  this.init = () => {
    el.querySelector("#DarkThemeSwitcher").addEventListener("click", () => {
      trigger("toggleTheme")
    })
    el.querySelector("#LightThemeSwitcher").addEventListener("click", () => {
      trigger("toggleTheme")
    })
  }
}

ready(() => {
  Array.from(document.querySelectorAll(".header")).forEach(el => {
    new Header(el).init()
  })
})
