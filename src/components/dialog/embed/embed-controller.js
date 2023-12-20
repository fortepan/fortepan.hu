import { Controller } from "@hotwired/stimulus"
import { getLocale, copyToClipboard, lang } from "../../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["ratio", "height", "width", "widthSwitch", "embedCode"]
  }

  connect() {}

  show(e) {
    this.listId = e?.detail?.listId
    this.element.classList.add("is-visible")

    this.generateEmbedCode()
  }

  hide() {
    delete this.listId
    this.element.classList.remove("is-visible")
  }

  restrictInput(e) {
    if (e && e.currentTarget) {
      e.currentTarget.value = e.currentTarget?.value.replace(/[^0-9]/g, "")
    }
  }

  generateEmbedCode(e) {
    const attributes = { width: this.widthTarget.value || "0", height: "", style: "" }
    let ratio

    if (e && e.currentTarget === this.heightTarget) {
      attributes.height = this.heightTarget.value || "0"

      switch (this.ratioTarget.value) {
        case "custom":
          // do nothing
          break

        default:
          this.widthSwitchTarget.classList.remove("is-selected")

          ratio = this.ratioTarget.value.split("/")
          this.widthTarget.value = Math.round(
            ((parseInt(this.heightTarget.value, 10) || 0) / parseInt(ratio[1], 10)) * parseInt(ratio[0], 10)
          )
          attributes.width = this.widthTarget.value
          break
      }
    } else {
      switch (this.widthTarget.value) {
        case "100%":
          attributes.width = "100%"

          switch (this.ratioTarget.value) {
            case "custom":
              if (this.heightTarget.value === "auto") {
                this.heightTarget.value = this.prevHeightValue || "360"
              }
              attributes.height = this.heightTarget.value
              break

            default:
              this.heightTarget.value = "auto"
              attributes.style = `aspect-ratio:${this.ratioTarget.value};`
              break
          }

          break

        default:
          this.widthSwitchTarget.classList.remove("is-selected")

          switch (this.ratioTarget.value) {
            case "custom":
              if (this.heightTarget.value === "auto") {
                this.heightTarget.value = this.prevHeightValue || "360"
              }
              break

            default:
              ratio = this.ratioTarget.value.split("/")
              this.heightTarget.value = Math.round(
                ((parseInt(this.widthTarget.value, 10) || 0) / parseInt(ratio[0], 10)) * parseInt(ratio[1], 10)
              )

              break
          }

          attributes.height = this.heightTarget.value

          break
      }
    }

    if (attributes.width) attributes.width = `width="${attributes.width}"`
    if (attributes.height) attributes.height = `height="${attributes.height}"`
    if (attributes.style) attributes.style = `style="${attributes.style}"`

    this.embedCodeTarget.value = `<iframe ${attributes.width} ${attributes.height} ${
      attributes.style
    } src="https://fortepan.hu/${getLocale()}/embed/${
      this.listId
    }" frameborder="0" allow="fullscreen" allowfullscreen="true" loading="lazy"></iframe>`
  }

  toggleWidthSwitch() {
    this.widthSwitchTarget.classList.toggle("is-selected")

    if (this.widthSwitchTarget.classList.contains("is-selected")) {
      this.prevWidthValue = this.widthTarget.value
      this.prevHeightValue = this.heightTarget.value
      this.widthTarget.value = "100%"
    } else {
      this.widthTarget.value = this.prevWidthValue || "640"
    }

    this.generateEmbedCode()
  }

  copyEmbedCode(e) {
    e?.preventDefault()

    copyToClipboard(
      this.embedCodeTarget.value,
      undefined,
      lang("embed").dialog.embed_code_copied,
      lang("embed").dialog.embed_code_copy_failed
    )
  }
}
