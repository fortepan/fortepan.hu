/**
 * GA Helper
 */

const GA4 = {
  init: () => {
    // inject GA script to document header
    const s = document.getElementsByTagName("script")[0]
    const a = document.createElement("script")
    s.parentNode.insertBefore(a, s)
    a.async = true
    a.src = "https://www.googletagmanager.com/gtag/js?id=G-BQPYXSY6WP"

    // pollute window
    window.dataLayer = window.dataLayer || []
    function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments)
    }
    gtag("js", new Date())
    gtag("config", "G-BQPYXSY6WP")

    window.gtag = gtag
  },
}

/** GA tracking is only allowed when users approve it with the cookie consent */

document.addEventListener("cookieConsent:cookiesAllowed", GA4.init)
