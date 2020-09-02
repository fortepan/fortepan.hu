import { ready, isTouchDevice, trigger, getURLParams } from "./utils"

// CUSTOM ELEMENTS
// Global elements
import "./components/background-icon/background-icon"
import "./components/carousel-photo/carousel-photo"
import "./components/carousel-sidebar/carousel-sidebar"
import "./components/dialog-advanced-search/dialog-advanced-search"
import "./components/dialog-download/dialog-download"
import "./components/dialog-share/dialog-share"
import "./components/dialog-simple-search/dialog-simple-search"
import "./components/dialog-signin/dialog-signin"
import "./components/dialog-signup/dialog-signup"
import "./components/dialog-reset-password/dialog-reset-password"
import "./components/dialog-reset-password-request/dialog-reset-password-request"
import "./components/dialog-input/dialog-input"
import "./components/header-nav/header-nav"
import "./components/input-search/input-search"
import "./components/loading-indicator/loading-indicator"
import "./components/photos-carousel/photos-carousel"
import "./components/photos-thumbnail/photos-thumbnail"
import "./components/photos-timeline/photos-timeline"
import "./components/photos-title/photos-title"

import "./components/snackbar/snackbar"
import "./components/toggle-theme/toggle-theme"
import "./components/selectize-control/selectize-control"
import "./components/cookie-consent/cookie-consent"

import "./components/google-analytics/google-analytics"

// Layouts and layout elements
import "./layouts/layout-home/layout-home"
import "./layouts/layout-photos/layout-photos"
import "./layouts/layout-donors/layout-donors"

// redirect calls from fortepan.eu and beta.fortepan.hu
const redirectDomains = ["fortepan.eu", "beta.fortepan.hu"]
redirectDomains.forEach(domain => {
  if (window.location.hostname.indexOf(domain) > -1) {
    window.location.href = window.location.href.replace(domain, "fortepan.hu")
  }
})

// redirect old search params
if (window.location.pathname === "/" || window.location.pathname === "/advanced-search") {
  const urlParams = getURLParams()
  const transformParams = {
    image_id: "id",
    img: "id",
    donors: "donor",
    tags: "tag",
    "AdvancedSearch[tag]": "tag",
    "AdvancedSearch[country]": "country",
    "AdvancedSearch[city]": "city",
    search: "q",
  }
  const newParams = {}
  Object.keys(urlParams).forEach(key => {
    const newKey = transformParams[key] || key
    newParams[newKey] = urlParams[key]
  })
  const q = new URLSearchParams(newParams).toString()
  window.location.href = `/hu/photos/?${q}`
}

ready(() => {
  document.querySelectorAll("[data-trigger]").forEach(n => {
    n.addEventListener(isTouchDevice() ? "touchstart" : "click", e => {
      e.preventDefault()
      e.currentTarget.dataset.trigger.split("|").forEach(command => {
        trigger(command, { currentTarget: e.currentTarget })
      })
    })
  })
})
