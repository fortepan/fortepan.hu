// import CSS
import "./scss/styles.scss"

import { ready, isTouchDevice, trigger } from "./js/utils"

// Redirects to old site urls (if needed)
import "./js/redirects"

// Stimulus config to automatically require component and layout controller js files
import "./js/stimulus"

// Init GA event handling
import "./js/google-analytics"

// CUSTOM ELEMENTS
// Global elements
import "./components/carousel-photo/carousel-photo"
import "./components/dialog-advanced-search/dialog-advanced-search"
import "./components/dialog-download/dialog-download"
import "./components/dialog-share/dialog-share"
import "./components/dialog-simple-search/dialog-simple-search"
import "./components/dialog-signin/dialog-signin"
import "./components/dialog-signup/dialog-signup"
import "./components/dialog-reset-password/dialog-reset-password"
import "./components/dialog-reset-password-request/dialog-reset-password-request"
import "./components/header-nav/header-nav"

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
