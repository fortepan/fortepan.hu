class SelectizeControl extends HTMLElement {
  constructor() {
    super()
    this.initInput()
    this.bindEvents()
  }

  addTag(val) {
    console.log(val)
    const inputNode = this.querySelector("input")
    const tagNode = document.createElement("div")
    tagNode.className = "selectize-control__tag"
    tagNode.textContent = val
    inputNode.parentElement.insertBefore(tagNode, inputNode)
  }

  initInput() {
    const inputNodeLabel = document.createElement("div")
    inputNodeLabel.className = "selectize-control__input hide"
    this.appendChild(inputNodeLabel)
    const inputNode = this.querySelector("input")
    inputNode.addEventListener("input", function(e) {
      inputNodeLabel.textContent = inputNode.value
      inputNode.style.width = `${Math.max(4, inputNodeLabel.offsetWidth + 4)}px`
    })

    inputNode.addEventListener(
      "keyup",
      function(e) {
        if (e.key === "Enter") {
          if (inputNode.value.length > 0) {
            this.addTag(inputNode.value)
            inputNode.value = ""
          }
        }

        if (inputNode.value === "" && e.key === "Backspace") {
          if (inputNode.previousElementSibling) {
            inputNode.parentElement.removeChild(inputNode.previousElementSibling)
          }
        }
      }.bind(this)
    )
  }

  bindEvents() {
    this.addEventListener(
      "click",
      function() {
        this.querySelector("input").focus()
      }.bind(this)
    )
  }
}

window.customElements.define("selectize-control", SelectizeControl)
