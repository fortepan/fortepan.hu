import throttle from "lodash/throttle"

class HeaderNav extends HTMLElement {
  constructor() {
    super()

    this.navNode = this.querySelector(".header-nav__nav")
    this.navTimer = 0

    this.initNavigation()
    this.bindCustomEvents()
    this.bindScroll()
  }

  bindCustomEvents() {
    // bind listeners
    document.addEventListener("headerNav:toggleNav", this.toggleNav.bind(this))
    document.addEventListener("photosCarousel:show", this.addShadow.bind(this))
    document.addEventListener("photosCarousel:hide", this.removeShadow.bind(this))
  }

  toggleNav(e) {
    const navToggleRect = e.detail.currentTarget.getBoundingClientRect()
    this.navNode.style.left = `${navToggleRect.x + navToggleRect.width / 2}px`
    this.navNode.classList.toggle("is-visible")
  }

  addShadow() {
    this.classList.add("header-nav--carousel-show")
  }

  removeShadow() {
    this.classList.remove("header-nav--carousel-show")
  }

  bindScroll() {
    const scrollView = document.querySelector(".js-header-watchscroll")
    if (scrollView) {
      scrollView.addEventListener(
        "scroll",
        function() {
          if (scrollView.scrollTop > 0) {
            this.classList.add("has-shadow")
          } else {
            this.classList.remove("has-shadow")
          }
        }.bind(this)
      )
    }
  }

  initNavigation() {
    document.addEventListener(
      "mousemove",
      throttle(e => {
        if (this.navTimer) clearTimeout(this.navTimer)
        this.navTimer = setTimeout(() => {
          const navBounds = this.navNode.getBoundingClientRect()
          if (e.clientX < navBounds.left || e.clientX > navBounds.right || e.clientY > navBounds.bottom) {
            this.navNode.classList.remove("is-visible")
          }
        }, 200)
      }, 100).bind(this)
    )
  }
}
window.customElements.define("header-nav", HeaderNav)
