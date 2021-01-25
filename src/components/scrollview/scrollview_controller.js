import { Controller } from "stimulus"

export default class ScrollView extends Controller {
  connect() {
    // Find the bg svg in the DOM as it's not inside of the controller and it can't be a target
    this.backgroundSVG = document.querySelector(".background__icon__svg")
  }

  handleScroll() {
    // Transform the banckground SVG icon when scrollview is scrolling
    if (this.backgroundSVG) {
      this.backgroundSVG.style.transform = `rotateY(${Math.min(90, this.element.scrollTop / 10)}deg) translateZ(-${this
        .element.scrollTop / 10}px)`
      this.backgroundSVG.style.opacity = Math.max(0, 100 - this.element.scrollTop / 20) / 100
    }
  }
}
