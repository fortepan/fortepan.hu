import { ready } from "../../app/app"

const Navigation = function(el) {
  this.init = () => {
    console.log(el)
  }
}

ready(() => {
  Array.from(document.querySelectorAll(".navigation")).forEach(el => {
    new Navigation(el).init()
  })
})
