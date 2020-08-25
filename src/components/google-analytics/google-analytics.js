const loadGoogleAnalytics = () => {
  window.dataLayer = window.dataLayer || []
  const gtag = (...args) => {
    window.dataLayer.push(args)
  }
  gtag("js", new Date())
  gtag("config", "UA-19831966-3")

  const ga = document.createElement("script")
  ga.async = true
  ga.src = "https://www.googletagmanager.com/gtag/js?id=UA-19831966-3"

  const s = document.getElementsByTagName("script")[0]
  s.parentNode.insertBefore(ga, s)
}

document.addEventListener("cookiesAllowed", loadGoogleAnalytics)
