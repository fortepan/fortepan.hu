import { Controller } from "stimulus"
import throttle from "lodash/throttle"
import auth from "../../api/auth"
import siteConfig from "../../data/siteConfig"
import { trigger } from "../../js/utils"
import { appState } from "../../js/app"

export default class extends Controller {
  static get targets() {
    return [
      "logoLabel",
      "notification",
      "profileName",
      "profileEmail",
      "popup",
      "menu",
      "notifications",
      "profile",
      "notificationIcon",
    ]
  }

  connect() {
    this.showNotificationIconBadge()
    this.autoHideNavShadowOnScroll()

    this.checkIfUserIsSignedIn()

    this.displayDevStatus()
  }

  // show a popup
  togglePopup(e) {
    e.preventDefault()

    if (this.activePopup) {
      this.activePopup.classList.remove("is-visible")

      if (this.activePopup === this[`${e.currentTarget.dataset.popup}Target`]) {
        this.activePopup = null
        return
      }
    }

    this.activePopup = this[`${e.currentTarget.dataset.popup}Target`]
    this.activePopup.classList.add("is-visible")

    // translate popup under the icon
    if (window.innerWidth < 480) {
      this.activePopup.style.left = ""
    } else {
      const rect = e.currentTarget.getBoundingClientRect()
      this.activePopup.style.left = `${rect.x + rect.width / 2}px`
    }
  }

  // hide all popups that are opened and visible
  hidePopups(e) {
    this.popupTargets.forEach(popup => {
      if (popup.classList.contains("is-visible")) {
        let button = null
        this.element.querySelectorAll(".button-circular").forEach(btn => {
          if (btn === e.target && popup.dataset.headerNavTarget.indexOf(btn.dataset.popup) > -1) {
            button = btn
          }
        })

        if (
          e.type === "resize" ||
          (popup !== e.target && !popup.contains(e.target) && (!button || !button.contains(e.target)))
        ) {
          popup.classList.remove("is-visible")
          this.activePopup = null
        }
      }
    })
  }

  addNavShadow() {
    this.element.classList.add("header-nav--carousel-show")
  }

  removeNavShadow() {
    this.element.classList.remove("header-nav--carousel-show")
  }

  autoHideNavShadowOnScroll() {
    const scrollviewElements = document.querySelectorAll(".scrollview")

    scrollviewElements.forEach(item => {
      item.addEventListener(
        "scroll",
        throttle(() => {
          const hasTimeline = document.querySelector(".photos-timeline")
          this.element.classList.toggle(
            "has-shadow",
            item.scrollTop > 0 && (!hasTimeline || item.classList.contains("home"))
          )
        }, 100)
      )
    })
  }

  signOut(e) {
    e.preventDefault()
    auth.signout()
  }

  showSigninDialog(e) {
    e.preventDefault()
    trigger("dialogSignin:show")
  }

  showSignupDialog(e) {
    e.preventDefault()
    trigger("dialogSignup:show")
  }

  showSearchDialog(e) {
    e.preventDefault()
    trigger("dialogSearch:show")
  }

  toggleTheme(e) {
    e.preventDefault()
    trigger("theme:toggleTheme")
  }

  checkIfUserIsSignedIn() {
    auth.querySignedInUser().then(userData => {
      if (userData) {
        this.profileNameTarget.textContent = userData.name
        this.profileEmailTarget.textContent = userData.mail
      }
    })
  }

  // switch language
  switchLocale(e) {
    e.preventDefault()
    const l = e.currentTarget.dataset.lang
    if (l !== "en") {
      document.location.href = `/${l}`
    } else {
      document.location.href = `/`
    }
  }

  // show badge on the notification icon when there's a new notification
  showNotificationIconBadge() {
    const lastSeen = localStorage.getItem("notificationsLastSeen")
    const lastMessageTimestamp = this.hasNotificationTarget ? this.notificationTarget.dataset.date : undefined
    if (lastSeen < lastMessageTimestamp) {
      setTimeout(() => {
        this.notificationIconTarget.classList.add("has-badge")
      }, 500)
    }
  }

  // hide new notifiction badge
  hideNotificationIconBadge() {
    const lastMessageTimestamp = this.hasNotificationTarget ? this.notificationTarget.dataset.date : undefined
    if (lastMessageTimestamp) {
      localStorage.setItem("notificationsLastSeen", lastMessageTimestamp.toString())
    }
    this.notificationIconTarget.classList.remove("has-badge")
  }

  displayDevStatus() {
    if (appState("is-dev")) {
      this.logoLabelTarget.innerHTML = `${this.logoLabelTarget.textContent}<i>:dev</i>`
    }
  }
}
