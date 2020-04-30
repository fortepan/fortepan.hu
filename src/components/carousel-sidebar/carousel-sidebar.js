import { trigger } from "../../utils"

class CarouselSidebar extends HTMLElement {
  constructor() {
    super()
    this.bindCustomEvents()
  }

  set bindData(data) {
    this.data = data
    this.render()
  }

  render() {
    // set sidebar sidebar data
    const locationArray = []
    if (this.data.orszag_name) {
      this.data.orszag_name.forEach(item => {
        locationArray.push(`<a href="?country=${encodeURIComponent(item)}">${item}</a>`)
      })
    }
    if (this.data.varos_name) {
      this.data.varos_name.forEach(item => {
        locationArray.push(`<a href="?city=${encodeURIComponent(item)}">${item}</a>`)
      })
    }
    if (this.data.helyszin_name) {
      this.data.helyszin_name.forEach(item => {
        locationArray.push(`<a href="?place=${encodeURIComponent(item)}">${item}</a>`)
      })
    }
    if (locationArray.length > 0) {
      this.querySelector(".carousel-sidebar__location").style.display = "block"
      this.querySelector(".carousel-sidebar__location h5").innerHTML = locationArray.join(",<br/>")
    } else {
      this.querySelector(".carousel-sidebar__location").style.display = "none"
    }
    this.querySelector(".carousel-sidebar__description").innerHTML = this.data.description ? this.data.description : ""
    this.querySelector(".carousel-sidebar__id h5").innerHTML = `<a href="?id=${this.data.mid}">${this.data.mid}</a>`
    this.querySelector(
      ".carousel-sidebar__year h5"
    ).innerHTML = `<a href="?year=${this.data.year}">${this.data.year}</a>`
    this.querySelector(".carousel-sidebar__donor h5").innerHTML = `<a href="?donor=${encodeURIComponent(
      this.data.adomanyozo_name
    )}">${this.data.adomanyozo_name}</a>`
    this.querySelector(".carousel-sidebar__tags p").innerHTML = this.data.cimke_name
      ? this.data.cimke_name.map(tag => `<a href="?tag=${encodeURIComponent(tag)}">${tag}</a>`).join(", ")
      : ""

    // bind history api calls to sidabar anchors
    Array.from(this.querySelectorAll(".carousel-sidebar a")).forEach(anchorNode => {
      anchorNode.addEventListener("click", event => {
        event.preventDefault()
        trigger("layoutPhotos:historyPushState", { url: event.currentTarget.href, resetPhotosGrid: true })
      })
    })
  }

  show() {
    document.querySelector("body").classList.remove("hide-carousel-sidebar")
  }

  hide() {
    document.querySelector("body").classList.add("hide-carousel-sidebar")
  }

  toggle() {
    document.querySelector("body").classList.toggle("hide-carousel-sidebar")
  }

  bindCustomEvents() {
    document.addEventListener("carouselSidebar:show", this.show)
    document.addEventListener("carouselSidebar:hide", this.hide)
    document.addEventListener("carouselSidebar:toggle", this.toggle)
  }
}

window.customElements.define("carousel-sidebar", CarouselSidebar)
