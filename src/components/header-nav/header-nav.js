import throttle from "lodash/throttle"
import auth from "../../api/auth"

class HeaderNav extends HTMLElement {
  constructor() {
    super()

    this.navTimer = 0

    this.initPopup()
    this.bindCustomEvents()
    this.bindScroll()

    this.initNotifications()

    this.updateProfile()
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
    document.addEventListener("headerNav:toggleNotifications", e => {
      this.togglePopup(
        e.detail.currentTarget,
        this.querySelector("#HeaderNavigationNotifications"),
        e.detail && e.detail.forceHide
      )
    })
    document.addEventListener("photosCarousel:show", this.addShadow.bind(this))
    document.addEventListener("photosCarousel:hide", this.removeShadow.bind(this))

    document.addEventListener("auth:signedIn", this.updateProfile.bind(this))

    // bind logout
    this.querySelector("#HeaderSignout").addEventListener("click", e => {
      e.preventDefault()
      auth.signout()
    })
  }

  togglePopup(itemNode, popupNode, forceHide = false) {
    const itemRect = itemNode.getBoundingClientRect()
    this.querySelectorAll(".header-nav__popup").forEach(node => {
      if (node === popupNode && !forceHide) {
        // eslint-disable-next-line no-param-reassign
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

  updateProfile() {
    auth.querySignedInUser().then(userData => {
      if (userData) {
        this.querySelector("#HeaderProfileName").textContent = userData.name
        this.querySelector("#HeaderProfileEmail").textContent = userData.mail
      }
    })
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
  }

  initNotifications() {
    const lastSeen = localStorage.getItem("notificationsLastSeen")

    const firstMessage = this.querySelector(".header-nav__notifications__message")
    const lastMessageTimestamp = firstMessage ? firstMessage.dataset.date : undefined

    const notificationIcon = this.querySelector(".header-nav__notification-icon")

    if (lastSeen < lastMessageTimestamp) {
      setTimeout(() => {
        notificationIcon.classList.add("has-badge")
      }, 500)
    }

    notificationIcon.addEventListener("click", () => {
      if (document.querySelector("body.cookies-allowed")) {
        localStorage.setItem("notificationsLastSeen", lastMessageTimestamp.toString())
      }
      notificationIcon.classList.remove("has-badge")
    })
  }
}
window.customElements.define("header-nav", HeaderNav)
