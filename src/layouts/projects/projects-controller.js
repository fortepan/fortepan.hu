import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    const images = this.element.querySelectorAll(".project-logo img")

    images.forEach(img => {
      if (img.src.includes("@2x")) {
        if (img.complete) {
          // Image already loaded
          img.style.width = `${img.naturalWidth / 2}px`
          img.style.height = "auto"
        } else {
          // Wait for image to load
          img.onload = () => {
            img.style.width = `${img.naturalWidth / 2}px`
            img.style.height = "auto"
          }
        }
      }
    })
  }
}
