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
  const headerNode = document.querySelector(".header")
  if (headerNode) new Header(headerNode).init()
})
