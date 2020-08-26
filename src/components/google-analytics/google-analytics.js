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

document.addEventListener("analytics:trackEvent", GA.trackEvent)
document.addEventListener("analytics:trackPageView", GA.trackPageView)
document.addEventListener("cookiesAllowed", GA.init)
