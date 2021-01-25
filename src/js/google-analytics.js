/**
 * GA Helper
 *
 * You can trigger the following events from any components
 * by using the trigger() method from utils
 *
 * trigger("analytics:trackPageview")
 * trigger("analytics:trackEvent", {eventCategory, eventAction, eventLabel})
 *
 */

const GA = {
  init: () => {
    // pollute window
    window.ga =
      window.ga ||
      function(...args) {
        window.ga.q = window.ga.q || []
        window.ga.q.push(args)
      }
    window.ga.l = +new Date()
    window.ga("create", "UA-19831966-3", "auto")
    window.ga("send", "pageview")

    // inject GA script to document header
    const a = document.createElement("script")
    a.async = true
    a.src = "https://www.google-analytics.com/analytics.js"
    const s = document.getElementsByTagName("script")[0]
    s.parentNode.insertBefore(a, s)
  },
  trackPageView: () => {
    if (window.ga) window.ga("send", "pageview", document.location.pathname + document.location.search)
  },
  trackEvent: (c, a, l) => {
    if (window.ga)
      window.ga("send", {
        hitType: "event",
        eventCategory: c,
        eventAction: a,
        eventLabel: l,
      })
  },
}

/** Custom event listeners */

document.addEventListener("analytics:trackEvent", GA.trackEvent)
document.addEventListener("analytics:trackPageView", GA.trackPageView)

/** GA tracking is only allowed when users approve it with the cookie consent */

document.addEventListener("cookieConsent:cookiesAllowed", GA.init)
