class BackgroundIcon extends HTMLElement {
  constructor() {
    super()
    const svg = this.querySelector(".background__icon__svg")
    const main = document.querySelector(".scrollview")
    main.addEventListener("scroll", () => {
      svg.style.transform = `rotateY(${Math.min(90, main.scrollTop / 10)}deg) translateZ(-${main.scrollTop / 10}px)`
      svg.style.opacity = Math.max(0, 100 - main.scrollTop / 20) / 100
    })
  }
}
window.customElements.define("background-icon", BackgroundIcon)
