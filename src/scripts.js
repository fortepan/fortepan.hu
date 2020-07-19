import { ready, isTouchDevice, trigger } from "./utils"

// CUSTOM ELEMENTS
// Global elements
import "./components/background-icon/background-icon"
import "./components/carousel-photo/carousel-photo"
import "./components/carousel-sidebar/carousel-sidebar"
import "./components/dialog-download/dialog-download"
import "./components/dialog-share/dialog-share"
import "./components/dialog-simple-search/dialog-simple-search"
import "./components/dialog-signin/dialog-signin"
import "./components/dialog-signup/dialog-signup"
import "./components/dialog-reset-password/dialog-reset-password"
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

// Layouts and layout elements
import "./layouts/layout-home/layout-home"
import "./layouts/layout-photos/layout-photos"
import "./layouts/layout-donors/layout-donors"

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
