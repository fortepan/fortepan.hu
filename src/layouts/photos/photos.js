import throttle from "lodash/throttle"
import animateScrollTo from "animated-scroll-to"
import config from "../../config"
import { ready, trigger } from "../../utils"

const THUMBNAIL_HEIGHT = 160

let photosNode = null
let selectedThumbnail = null
let thumbnailsCount = 0
let thumbnailsLoading = false
let totalHits = 0

const isThumbnailInViewport = el => {
  if (el) {
    const bounds = el.getBoundingClientRect()
    return bounds.top >= document.querySelector(".header").offsetHeight && bounds.bottom <= window.innerHeight
  }
  return false
}

const setTotalHits = t => {
  totalHits = t
  document.querySelector(".photos__subtitle span").textContent = totalHits
  document.querySelector(".photos__subtitle").classList.add("photos__subtitle--show")
}

const resizeThumbnail = thumbnail => {
  const t = thumbnail
  const i = t.querySelector(".photos__thumbnail__image")
  const h = window.innerWidth < 640 ? (THUMBNAIL_HEIGHT * 2) / 3 : THUMBNAIL_HEIGHT
  if (!i.dataset.naturalWidth) return
  i.style.height = `${h}px`
  const w = (i.dataset.naturalWidth / i.dataset.naturalHeight) * h
  t.style.flex = `${w}`
  t.style.minWidth = `${w}px`
}

const Thumbnail = data => {
  // eslint-disable-next-line no-underscore-dangle
  const d = data._source
  const t = document.createRange().createContextualFragment(document.getElementById("Thumbnail").innerHTML)

  // Fill template with data
  const locationArray = []
  if (d.year) locationArray.push(d.year)
  if (d.varos_name) locationArray.push(d.varos_name)
  if (d.helyszin_name) locationArray.push(d.helyszin_name)
  t.querySelector(".photos__thumbnail__meta--location").textContent = locationArray.join(" · ")
  t.querySelector(".photos__thumbnail__meta--description").textContent = d.description ? d.description : ""

  const img = new Image()
  const imgContainer = t.querySelector(".photos__thumbnail__image")

  img.addEventListener("load", e => {
    const i = e.target
    imgContainer.style.backgroundImage = `url("${e.target.currentSrc}")`
    imgContainer.dataset.naturalWidth = i.naturalWidth
    imgContainer.dataset.naturalHeight = i.naturalHeight

    imgContainer.parentNode.classList.add("photos__thumbnail--display")

    setTimeout(() => {
      imgContainer.parentNode.classList.add("photos__thumbnail--show")
    }, 100)

    resizeThumbnail(imgContainer.parentNode)
  })
  img.src = `${config.PHOTO_SOURCE}${d.mid}.jpg`

  // Bind events
  t.querySelector(".photos__thumbnail").addEventListener("click", e => {
    // Highlight selected thumbnail
    if (selectedThumbnail) selectedThumbnail.classList.remove("photos__thumbnail--selected")
    selectedThumbnail = e.currentTarget
    selectedThumbnail.classList.add("photos__thumbnail--selected")

    // Load photo in Carousel
    trigger("carousel:loadPhoto", d)

    // Scroll to thumbnail if it's not in the viewport
    if (!isThumbnailInViewport(selectedThumbnail.querySelector(".photos__thumbnail__image"))) {
      animateScrollTo(selectedThumbnail.offsetTop - 16, {
        elementToScroll: photosNode,
      })
    }
  })

  return t
}

const loadPhotos = () => {
  return new Promise((resolve, reject) => {
    const wrapperNode = photosNode.querySelector(".photos__wrapper")

    const defaultParams = {
      size: config.THUMBNAILS_QUERY_LIMIT,
      from: thumbnailsCount,
    }

    const urlParams = Object.fromEntries(new URLSearchParams(window.location.search.substring(1)))
    Object.assign(defaultParams, urlParams)

    const qs = Object.keys(defaultParams)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(defaultParams[k])}`)
      .join("&")

    fetch(`.netlify/functions/search?${qs}`, {
      method: "GET",
    }).then(response => {
      response
        .json()
        .then(data => {
          setTotalHits(data.hits.total.value)
          data.hits.hits.forEach(itemData => {
            thumbnailsCount += 1
            const thumbnailFragment = new Thumbnail(itemData)
            wrapperNode.appendChild(thumbnailFragment)
          })
          thumbnailsLoading = false
          resolve()
        })
        .catch(err => {
          reject(err)
        })
    })
  })
}

const resizeThumbnails = () => {
  const thumbnails = photosNode.querySelectorAll(".photos__thumbnail")
  Array.from(thumbnails).forEach(el => {
    resizeThumbnail(el)
  })
}

ready(() => {
  photosNode = document.querySelector(".photos")
  if (!photosNode) return

  // Bind window events
  window.addEventListener("resize", throttle(resizeThumbnails, 1000))

  // Bind custom events
  document.addEventListener("photos:showNextPhoto", () => {
    let next = selectedThumbnail.nextElementSibling
    if (next) {
      next.click()
    } else if (thumbnailsCount % config.THUMBNAILS_QUERY_LIMIT === 0) {
      thumbnailsLoading = true
      loadPhotos().then(() => {
        next = selectedThumbnail.nextElementSibling
        if (next) {
          next.click()
        }
      })
    }
  })

  document.addEventListener("photos:showPrevPhoto", () => {
    const prev = selectedThumbnail.previousElementSibling
    if (prev) {
      prev.click()
    }
  })

  // Load photos
  loadPhotos().then(() => {
    // bind scroll event to photos container
    photosNode.addEventListener("scroll", e => {
      const view = e.target
      if (view.scrollTop > 0) {
        trigger("header:addShadow")
      } else {
        trigger("header:removeShadow")
      }

      if (
        view.scrollTop + view.offsetHeight >= view.scrollHeight &&
        !thumbnailsLoading &&
        thumbnailsCount % config.THUMBNAILS_QUERY_LIMIT === 0
      ) {
        thumbnailsLoading = true
        loadPhotos()
      }
    })
  })
})
