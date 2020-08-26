const loadGoogleAnalytics = () => {
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ js: new Date() })
  window.dataLayer.push({ config: "UA-19831966-3" })

  const ga = document.createElement("script")
  ga.async = true
  ga.src = "https://www.googletagmanager.com/gtag/js?id=UA-19831966-3"

  const s = document.getElementsByTagName("script")[0]
  s.parentNode.insertBefore(ga, s)
}

if (localStorage.getItem("allowCookies") === "1") {
  loadGoogleAnalytics()
}
