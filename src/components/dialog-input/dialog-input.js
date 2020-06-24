class DialogInput extends HTMLElement {
  constructor() {
    super()

    this.bindEvents()
  }

  bindEvents() {
    this.querySelector("input").addEventListener(
      "keyup",
      function(e) {
        if (e.currentTarget.value.length > 0) {
          this.querySelector("label").classList.add("is-visible")
        } else {
          this.querySelector("label").classList.remove("is-visible")
        }
      }.bind(this)
    )

    this.querySelector("input").addEventListener(
      "keydown",
      function(e) {
        if (e.key === "Enter") {
          this.parentNode.querySelector("button").click()
        }
      }.bind(this)
    )
  }
}

window.customElements.define("dialog-input", DialogInput)
