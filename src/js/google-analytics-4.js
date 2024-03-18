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

const GA4 = {
  init: () => {
    // inject GA script to document header
    const a = document.createElement("script")
    a.async = true
    a.src = "https://www.googletagmanager.com/gtag/js?id=G-BQPYXSY6WP"
    const s = document.getElementsByTagName("script")[0]
    s.parentNode.insertBefore(a, s)

    // pollute window
    window.dataLayer = window.dataLayer || []
    function gtag(...args) {
      window.dataLayer.push(args)
    }
    gtag("js", new Date())
    gtag("config", "G-BQPYXSY6WP")

    // trigger the page view event as the script will be added by a delay and won't fire automatically
    window.dataLayer.push({
      event: "page_view",
    })
  },
  trackPageView: () => {
    // GA4 tracks page view on browser history change automatically
    // we'll not use the code below for now
    /* if (window.dataLayer)
      window.dataLayer.push("event", "page_view", {
        page_location: document.location.pathname + document.location.search,
      }) */
  },
  trackEvent: (c, a, l, v) => {
    if (window.dataLayer)
      window.dataLayer.push("event", a, {
        event_category: c,
        event_label: l,
        event_value: v,
      })
  },
}

/** Custom event listeners */

document.addEventListener("analytics:trackEvent", GA4.trackEvent)
document.addEventListener("analytics:trackPageView", GA4.trackPageView)

/** GA tracking is only allowed when users approve it with the cookie consent */

document.addEventListener("cookieConsent:cookiesAllowed", GA4.init)
