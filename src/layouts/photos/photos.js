import config from "../../config"
import { ready, trigger } from "../../utils"

const THUMBNAIL_HEIGHT = 160

let photosNode = null
let selectedThumbnail = null
let thumbnailsCount = 0
let thumbnailsLoading = false

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
    const w = (i.naturalWidth / i.naturalHeight) * THUMBNAIL_HEIGHT
    imgContainer.style.height = `${THUMBNAIL_HEIGHT}px`
    imgContainer.style.backgroundImage = `url("${e.target.currentSrc}")`

    const p = imgContainer.parentNode
    p.style.flex = `${w}`
    p.style.minWidth = `${w}px`
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

ready(() => {
  photosNode = document.querySelector(".photos")
  if (!photosNode) return

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
      const view = e.currentTarget
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
