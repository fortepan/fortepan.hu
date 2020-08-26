const loadGoogleAnalytics = () => {
  window.ga =
    window.ga ||
    function(...args) {
      window.ga.q = window.ga.q || []
      window.ga.q.push(args)
    }
  window.ga.l = +new Date()
  window.ga("create", "UA-19831966-3", "auto")
  window.ga("send", "pageview")

  const a = document.createElement("script")
  a.async = true
  a.src = "https://www.google-analytics.com/analytics.js"
  const s = document.getElementsByTagName("script")[0]
  s.parentNode.insertBefore(a, s)
}

document.addEventListener("cookiesAllowed", loadGoogleAnalytics)
