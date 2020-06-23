import throttle from "lodash/throttle"
import { trigger, isTouchDevice } from "../../utils"
import auth from "../../api/auth"

class HeaderNav extends HTMLElement {
  constructor() {
    super()

    this.navTimer = 0

    this.initPopup()
    this.bindCustomEvents()
    this.bindScroll()

    auth
      .queryUser()
      .then(res => {
        console.log(res)
      })
      .catch(error => {
        console.log(error)
      })
  }

  bindCustomEvents() {
    // bind listeners
    document.addEventListener("headerNav:toggleMenu", e => {
      this.togglePopup(
        e.detail.currentTarget,
        this.querySelector("#HeaderNavigationMenu"),
        e.detail && e.detail.forceHide
      )
    })
    document.addEventListener("headerNav:toggleProfile", e => {
      this.togglePopup(
        e.detail.currentTarget,
        this.querySelector("#HeaderNavigationProfile"),
        e.detail && e.detail.forceHide
      )
    })
    document.addEventListener("photosCarousel:show", this.addShadow.bind(this))
    document.addEventListener("photosCarousel:hide", this.removeShadow.bind(this))
  }

  togglePopup(itemNode, popupNode, forceHide = false) {
    const itemRect = itemNode.getBoundingClientRect()
    this.querySelectorAll(".header-nav__popup").forEach(node => {
      if (node === popupNode && !forceHide) {
        node.style.left = `${itemRect.x + itemRect.width / 2}px`
        node.classList.add("is-visible")
      } else {
        node.classList.remove("is-visible")
      }
    })
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

  initPopup() {
    document.addEventListener(
      "mousemove",
      throttle(e => {
        if (this.navTimer) clearTimeout(this.navTimer)
        this.navTimer = setTimeout(() => {
          const navNode = this.querySelector(".header-nav__popup.is-visible")
          if (navNode) {
            const navBounds = navNode.getBoundingClientRect()
            if (e.clientX < navBounds.left || e.clientX > navBounds.right || e.clientY > navBounds.bottom) {
              navNode.classList.remove("is-visible")
            }
          }
        }, 200)
      }, 100).bind(this)
    )

    //
    this.querySelectorAll(".header-nav__popup *[data-trigger]").forEach(el => {
      el.addEventListener(isTouchDevice() ? "touchstart" : "click", e => {
        e.preventDefault()
        trigger(e.currentTarget.dataset.trigger, { currentTarget: e.currentTarget })
      })
    })
  }
}
window.customElements.define("header-nav", HeaderNav)
