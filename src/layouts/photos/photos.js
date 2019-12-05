import animateScrollTo from "animated-scroll-to"
import { ready, trigger } from "../../app/app"

const THUMBNAILS_QUERY_LIMIT = 30

let selectedThumbnail = null
let thumbnailsCount = 0
let thumbnailsLoading = false

const Thumbnail = function(data) {
  const t = document.importNode(document.getElementById("Thumbnail").content, true)
  const [, filename, year, country, city, place, title, , , ,] = data
  t.querySelector(".photos__thumbnail__meta--description").textContent = (year || "") + (title ? ` · ${title}` : "")
  const locationArray = []
  if (country) locationArray.push(country)
  if (city) locationArray.push(city)
  if (place) locationArray.push(place)
  t.querySelector(".photos__thumbnail__meta--location").textContent = locationArray.join(" · ")
  t.querySelector(
    ".photos__thumbnail__image"
  ).style.backgroundImage = `url("http://fortepan.hu/_photo/display/${filename}.jpg")`

  // Thumbnail events
  t.querySelector(".photos__thumbnail").addEventListener("click", e => {
    // Highlight selected thumbnail
    if (selectedThumbnail) selectedThumbnail.classList.remove("photos__thumbnail--selected")
    selectedThumbnail = e.currentTarget
    selectedThumbnail.classList.add("photos__thumbnail--selected")

    // Load photo in Carousel
    trigger("carousel:loadPhoto", data)
  })

  return t
}

const Carousel = function(el) {
  this.init = function() {
    el.querySelector("#PhotoNext").addEventListener("click", e => {
      e.preventDefault()
      trigger("photos:showNextPhoto")
    })
    el.querySelector("#PhotoPrev").addEventListener("click", e => {
      e.preventDefault()
      trigger("photos:showPrevPhoto")
    })
  }

  document.addEventListener("carousel:loadPhoto", e => {
    const c = el
    const [imageId, filename, year, country, city, place, title, donor, tags, width, height] = e.detail

    const metaArray = []
    if (country) metaArray.push(`<a href="#">${country}</a>`)
    if (city) metaArray.push(`<a href="#">${city}</a>`)
    if (place) metaArray.push(`<a href="#">${place}</a>`)

    c.querySelector(".photos__carousel__meta").innerHTML = `${title ? `${title}<br/>` : ""}<b>${metaArray.join(
      " · "
    )}</b>`
    c.querySelector(".photos__carousel__meta__id h5").textContent = imageId
    c.querySelector(".photos__carousel__meta__year h5").textContent = year
    c.querySelector(".photos__carousel__meta__donor h5").textContent = donor
    c.querySelector(".photos__carousel__meta__tags p").innerHTML = tags
      .split("| ")
      .map(tag => `<a href="#">${tag}</a>`)
      .join(", ")
    c.querySelector(
      ".photos__carousel__photo"
    ).style.backgroundImage = `url(http://fortepan.hu/_photo/display/${filename}.jpg)`
    c.querySelector(".photos__carousel__photo-wrapper").style.paddingTop = `${(height / width) * 100}%`

    c.classList.add("photos__carousel--show")

    // Move carousel
  })
}

const loadPhotos = async function(el) {
  const wrapperNode = el.querySelector(".photos__wrapper")
  const resp = await fetch("/.netlify/functions/search", {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      action: "search_view",
      q: "Busz",
      limit: THUMBNAILS_QUERY_LIMIT,
      lang: "hu",
      offset: thumbnailsCount,
    }),
  })
  const data = await resp.json()

  data.data.forEach(itemData => {
    thumbnailsCount += 1
    const thumbnailFragment = new Thumbnail(itemData)
    wrapperNode.appendChild(thumbnailFragment)
  })

  thumbnailsLoading = false
}

// Photos page custom events
document.addEventListener("photos:showNextPhoto", () => {
  const next = selectedThumbnail.nextElementSibling
  if (next) {
    next.click()
  }
})

document.addEventListener("photos:showPrevPhoto", () => {
  let prev = selectedThumbnail.previousElementSibling
  if (prev.classList.contains("photos__carousel")) prev = prev.previousElementSibling
  if (prev) {
    prev.click()
  }
})

document.addEventListener("carousel:loadPhoto", () => {
  const wrapperNode = document.querySelector(".photos__wrapper")
  const carousel = document.querySelector(".photos__carousel")

  if (selectedThumbnail) {
    const carouselIdx = Array.from(wrapperNode.children).indexOf(carousel)
    const thumbIdx = Array.from(wrapperNode.children).indexOf(selectedThumbnail)
    const s = Math.round(wrapperNode.offsetWidth / selectedThumbnail.offsetWidth)

    const offset = carouselIdx < thumbIdx ? (thumbIdx - 1) % s : thumbIdx % s
    wrapperNode.insertBefore(carousel, Array.from(wrapperNode.children)[thumbIdx - offset])

    const scrollOffset = wrapperNode.children[0].offsetTop

    animateScrollTo(Math.max(carousel.offsetTop - scrollOffset, 0), { elementToScroll: document.querySelector("main") })
  }
})

// Photos page init
const initPhotos = async function(el) {
  const wrapperNode = el.querySelector(".photos__wrapper")
  const carouselFragment = document.importNode(document.getElementById("Carousel").content, true)
  new Carousel(carouselFragment.querySelector(".photos__carousel")).init()
  wrapperNode.appendChild(carouselFragment)

  // Load photos
  await loadPhotos(el)

  // Trigger click on first thumbnail
  el.querySelector(".photos__thumbnail").click()

  // bind Photos Events
  el.parentNode.addEventListener("scroll", function(e) {
    const view = e.currentTarget
    if (view.scrollTop > 0) {
      trigger("header:addShadow")
    } else {
      trigger("header:removeShadow")
    }

    if (
      view.scrollTop + view.offsetHeight >= view.scrollHeight &&
      !thumbnailsLoading &&
      thumbnailsCount % THUMBNAILS_QUERY_LIMIT === 0
    ) {
      thumbnailsLoading = true
      loadPhotos(el)
    }
  })
}

ready(() => {
  const photosNode = document.querySelector(".photos")
  if (photosNode) initPhotos(photosNode)
})
