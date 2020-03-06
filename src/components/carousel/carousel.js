import throttle from "lodash/throttle"
import config from "../../config"
import { ready, trigger } from "../../utils"

const CAROUSEL_SLIDESHOW_DELAY = 4000

let carouselNode = null
let carouselControl = null
let carouselControlTimer
let metaHiddenBeforeSlideshow = false
let carouselSlideshowInterval = null

const downloadImage = (name, uri) => {
  const a = document.createElement("a")
  a.href = uri
  a.download = name
  a.target = "_blank"
  a.click()
}

document.addEventListener("carousel:loadPhoto", e => {
  const d = e.detail

  const locationArray = []
  if (d.orszag_name) locationArray.push(`<a href="?country=${encodeURIComponent(d.orszag_name)}">${d.orszag_name}</a>`)
  if (d.varos_name) locationArray.push(`<a href="?city=${encodeURIComponent(d.varos_name)}">${d.varos_name}</a>`)
  if (d.helyszin_name)
    locationArray.push(`<a href="?place=${encodeURIComponent(d.helyszin_name)}">${d.helyszin_name}</a>`)

  if (locationArray.length > 0) {
    document.querySelector(".carousel__meta__location").style.display = "block"
    document.querySelector(".carousel__meta__location h5").innerHTML = locationArray.join(",<br/>")
  } else {
    document.querySelector(".carousel__meta__location").style.display = "none"
  }
  document.querySelector(".carousel__meta__description").innerHTML = d.description ? d.description : ""
  document.querySelector(".carousel__meta__id h5").textContent = d.mid
  document.querySelector(".carousel__meta__year h5").innerHTML = `<a href="?year=${d.year}">${d.year}</a>`
  document.querySelector(".carousel__meta__donor h5").innerHTML = `<a href="?donor=${encodeURIComponent(
    d.adomanyozo_name
  )}">${d.adomanyozo_name}</a>`
  document.querySelector(".carousel__meta__tags p").innerHTML = d.cimke_name
    ? d.cimke_name.map(tag => `<a href="?tag=${encodeURIComponent(tag)}">${tag}</a>`).join(", ")
    : ""
  document.querySelector(".carousel__photo").style.backgroundImage = `url(${config.PHOTO_SOURCE}${d.mid}.jpg)`

  Array.from(document.querySelectorAll(".carousel__meta a")).forEach(anchorNode => {
    anchorNode.addEventListener("click", event => {
      event.preventDefault()
      trigger("photos:historyPushState", { url: event.currentTarget.href, resetPhotosWrapper: true })
    })
  })

  // Set download button
  carouselControl.querySelector("#PhotoDownload").setAttribute("data-name", `${d.mid}.jpg`)
  carouselControl.querySelector("#PhotoDownload").setAttribute("data-uri", `${config.PHOTO_SOURCE_LARGE}${d.mid}.jpg`)

  // Set Controller meta
  carouselControl.querySelector(".carousel__control__search").innerHTML = document.getElementById(
    "PhotosSearchExpression"
  ).innerHTML
  carouselControl.querySelector(".carousel__control__counter").textContent = `${d.elIndex} / ${
    document.getElementById("PhotosCount").textContent
  }`

  trigger("carousel:show")
})

document.addEventListener("carousel:show", () => {
  if (!carouselNode.classList.contains("carousel--show")) {
    carouselNode.classList.add("carousel--show")
    carouselControl.classList.add("carousel__control--show")
  }
})

document.addEventListener("carousel:hide", () => {
  // pause slideshow when carousel gets closed
  if (document.querySelector("body").classList.contains("base--carousel-slideshow")) trigger("carousel:pauseSlideshow")

  carouselNode.classList.remove("carousel--show")
})

document.addEventListener("carousel:toggleMeta", () => {
  document.querySelector("body").classList.toggle("base--hide-carousel-meta")
  document.querySelector("#PhotoDetails").classList.toggle("button__circular--disabled")
})

document.addEventListener("carousel:hideMeta", () => {
  document.querySelector("body").classList.add("base--hide-carousel-meta")
  document.querySelector("#PhotoDetails").classList.add("button__circular--disabled")
})

document.addEventListener("carousel:playSlideshow", () => {
  document.querySelector("body").classList.add("base--carousel-slideshow")
  metaHiddenBeforeSlideshow = document.querySelector("body").classList.contains("base--hide-carousel-meta")
  trigger("carousel:hideMeta")

  carouselSlideshowInterval = setInterval(() => {
    trigger("photos:showNextPhoto")
  }, CAROUSEL_SLIDESHOW_DELAY)
})

document.addEventListener("carousel:pauseSlideshow", () => {
  document.querySelector("body").classList.remove("base--carousel-slideshow")
  if (!metaHiddenBeforeSlideshow) trigger("carousel:toggleMeta")
  clearInterval(carouselSlideshowInterval)
})

document.addEventListener("carousel:toggleSlideshow", () => {
  if (document.querySelector("body").classList.contains("base--carousel-slideshow")) {
    trigger("carousel:pauseSlideshow")
  } else {
    trigger("carousel:playSlideshow")
  }
})

const initCarousel = el => {
  // bind events
  el.querySelector("#PhotoNext").addEventListener("click", e => {
    e.preventDefault()
    trigger("photos:showNextPhoto")
  })
  el.querySelector("#PhotoPrev").addEventListener("click", e => {
    e.preventDefault()
    trigger("photos:showPrevPhoto")
  })

  el.querySelector("#PhotoDetails").addEventListener("click", e => {
    e.preventDefault()
    trigger("carousel:toggleMeta")
  })

  el.querySelector("#PhotoSlideshowPlay").addEventListener("click", e => {
    e.preventDefault()
    trigger("carousel:playSlideshow")
  })

  el.querySelector("#PhotoSlideshowPause").addEventListener("click", e => {
    e.preventDefault()
    trigger("carousel:pauseSlideshow")
  })

  el.querySelector("#PhotoDownload").addEventListener("click", e => {
    e.preventDefault()
    downloadImage(e.currentTarget.dataset.name, e.currentTarget.dataset.uri)
  })

  carouselNode.addEventListener(
    "mousemove",
    throttle(e => {
      if (!carouselControl.classList.contains("carousel__control--show")) {
        carouselControl.classList.add("carousel__control--show")
      }

      if (carouselControlTimer) clearTimeout(carouselControlTimer)
      carouselControlTimer = setTimeout(() => {
        const bounds = carouselControl.getBoundingClientRect()
        if (
          !(
            e.clientX >= bounds.left &&
            e.clientX <= bounds.right &&
            e.clientY >= bounds.top &&
            e.clientY <= bounds.bottom
          )
        ) {
          carouselControl.classList.remove("carousel__control--show")
        }
      }, 1000)
    }, 400)
  )

  document.addEventListener("keydown", e => {
    if (!carouselNode.classList.contains("carousel--show")) return

    switch (e.key) {
      case "Escape":
        trigger("carousel:hide")
        break
      case " ":
        trigger("carousel:toggleSlideshow")
        break
      case "ArrowLeft":
        trigger("photos:showPrevPhoto")
        break
      case "ArrowRight":
        trigger("photos:showNextPhoto")
        break
      default:
    }
  })
}

ready(() => {
  carouselNode = document.querySelector(".carousel")
  carouselControl = document.querySelector(".carousel__control")
  if (carouselNode) initCarousel(carouselNode)
})
