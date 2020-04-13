import config from "../../config"
import { ready, trigger, setPageMeta, getURLParams, copyToClipboard } from "../../utils"

const CAROUSEL_SLIDESHOW_DELAY = 4000

let carouselNode = null
let metaHiddenBeforeSlideshow = false
let carouselSlideshowTimeout = null
let currentImageMeta = null

const showCarouselPhoto = url => {
  const photosNode = document.querySelector(".carousel__photos__all")
  photosNode.querySelector(`img[src="${url}"]`).classList.add("show")

  if (document.querySelector("body").classList.contains("base--carousel-slideshow")) {
    clearTimeout(carouselSlideshowTimeout)
    carouselSlideshowTimeout = setTimeout(() => {
      trigger("photos:showNextPhoto")
    }, CAROUSEL_SLIDESHOW_DELAY)
  }
}

const downloadImage = () => {
  const dialogNode = document.querySelector(".dialog--download")
  dialogNode.classList.add("dialog--show")
  dialogNode.querySelector(".dialog__content").innerHTML = dialogNode.dataset.content.replace(
    "$donor",
    `<br/><b>Fortepan / ${currentImageMeta.adomanyozo_name}</b>`
  )

  const a = document.createElement("a")
  a.href = `${config.PHOTO_SOURCE_LARGE}${currentImageMeta.mid}.jpg`
  a.click()
}

document.addEventListener("carousel:loadPhoto", e => {
  const d = e.detail

  currentImageMeta = d

  // set meta sidebar data
  const locationArray = []
  if (d.orszag_name) {
    d.orszag_name.forEach(item => {
      locationArray.push(`<a href="?country=${encodeURIComponent(item)}">${item}</a>`)
    })
  }
  if (d.varos_name) {
    d.varos_name.forEach(item => {
      locationArray.push(`<a href="?city=${encodeURIComponent(item)}">${item}</a>`)
    })
  }
  if (d.helyszin_name) {
    d.helyszin_name.forEach(item => {
      locationArray.push(`<a href="?place=${encodeURIComponent(item)}">${item}</a>`)
    })
  }
  if (locationArray.length > 0) {
    document.querySelector(".carousel__meta__location").style.display = "block"
    document.querySelector(".carousel__meta__location h5").innerHTML = locationArray.join(",<br/>")
  } else {
    document.querySelector(".carousel__meta__location").style.display = "none"
  }
  document.querySelector(".carousel__meta__description").innerHTML = d.description ? d.description : ""
  document.querySelector(".carousel__meta__id h5").innerHTML = `<a href="?id=${d.mid}">${d.mid}</a>`
  document.querySelector(".carousel__meta__year h5").innerHTML = `<a href="?year=${d.year}">${d.year}</a>`
  document.querySelector(".carousel__meta__donor h5").innerHTML = `<a href="?donor=${encodeURIComponent(
    d.adomanyozo_name
  )}">${d.adomanyozo_name}</a>`
  document.querySelector(".carousel__meta__tags p").innerHTML = d.cimke_name
    ? d.cimke_name.map(tag => `<a href="?tag=${encodeURIComponent(tag)}">${tag}</a>`).join(", ")
    : ""

  // set carousel photo background
  const selectedPhoto = document.querySelector(".photos__thumbnail--selected")
  if (selectedPhoto) {
    const photosBackgroundNode = document.querySelector(".carousel__photos__background")
    photosBackgroundNode.style.backgroundImage = selectedPhoto.querySelector(
      ".photos__thumbnail__image"
    ).style.backgroundImage
    photosBackgroundNode.classList.remove("fade-in")
    setTimeout(() => {
      photosBackgroundNode.classList.add("fade-in")
    }, 20)
  }

  // load photo
  const photoSrc = `${config.PHOTO_SOURCE}1600/fortepan_${d.mid}.jpg`
  if (!document.querySelector(`.carousel__photos__all img[src="${photoSrc}"]`)) {
    const img = new Image()
    img.className = "carousel__photo"
    img.dataset.mediaId = d.mid
    document.querySelector(".carousel__photos__all").appendChild(img)
    document.querySelector(".carousel__photos__loader").classList.add("show")

    img.addEventListener("load", event => {
      const i = event.target
      i.dataset.naturalWidth = i.naturalWidth
      i.dataset.naturalHeight = i.naturalHeight

      if (i.dataset.mediaId === currentImageMeta.mid.join("")) {
        document.querySelector(".carousel__photos__loader").classList.remove("show")
        setTimeout(() => {
          showCarouselPhoto(photoSrc)
        }, 100)
      }
    })
    img.src = photoSrc
  } else {
    showCarouselPhoto(photoSrc)
  }

  // bind history api calls to sidabar anchors
  Array.from(document.querySelectorAll(".carousel__meta a")).forEach(anchorNode => {
    anchorNode.addEventListener("click", event => {
      event.preventDefault()
      trigger("photos:historyPushState", { url: event.currentTarget.href, resetPhotosWrapper: true })
    })
  })

  // set html page meta for social sharing
  setPageMeta(
    `#${d.mid}`,
    `${d.description ? `${d.description} — ` : ""}${document.querySelector(".carousel__meta__donor h6").textContent}: ${
      d.adomanyozo_name
    } (${d.year})`,
    `${config.PHOTO_SOURCE}${d.mid}.jpg`
  )

  // trigger further carousel events
  trigger("carousel:show")
  trigger("carousel:hideDownloadDialog")
  trigger("carousel:hideShareDialog")

  // keep pager disabled if there's only one photo thumbnail in the photos list
  if (document.querySelectorAll(".photos__thumbnail").length > 1) {
    document.querySelectorAll(".carousel__photos__pager").forEach(pager => {
      pager.classList.remove("disable")
    })
  } else {
    document.querySelectorAll(".carousel__photos__pager").forEach(pager => {
      pager.classList.add("disable")
    })
  }
})

document.addEventListener("carousel:show", () => {
  if (!carouselNode.classList.contains("carousel--show")) {
    carouselNode.classList.add("carousel--show")
  }
})

document.addEventListener("carousel:hide", () => {
  // pause slideshow if the slideshow is playing
  if (document.querySelector("body").classList.contains("base--carousel-slideshow")) {
    trigger("carousel:pauseSlideshow")
  } else {
    // hide all photos
    trigger("carousel:hidePhotos")

    // hide dialogs
    trigger("carousel:hideShareDialog")

    // hide carousel
    carouselNode.classList.remove("carousel--show")

    // load all photos if there's only one photo loaded in the carousel
    if (!(document.querySelectorAll(".photos__thumbnail").length > 1) && getURLParams().id > 0) {
      trigger("photos:historyPushState", { url: "?q=", resetPhotosWrapper: true })
    }
  }
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

  carouselSlideshowTimeout = setTimeout(() => {
    trigger("photos:showNextPhoto")
  }, CAROUSEL_SLIDESHOW_DELAY)
})

document.addEventListener("carousel:pauseSlideshow", () => {
  document.querySelector("body").classList.remove("base--carousel-slideshow")
  if (!metaHiddenBeforeSlideshow) trigger("carousel:toggleMeta")
  clearTimeout(carouselSlideshowTimeout)
})

document.addEventListener("carousel:toggleSlideshow", () => {
  if (document.querySelector("body").classList.contains("base--carousel-slideshow")) {
    trigger("carousel:pauseSlideshow")
  } else {
    trigger("carousel:playSlideshow")
  }
})

document.addEventListener("carousel:hidePhotos", () => {
  const photosNode = document.querySelector(".carousel__photos__all")
  photosNode.querySelectorAll("img").forEach(img => {
    img.classList.remove("show")
  })
})

document.addEventListener("carousel:hideDownloadDialog", () => {
  document.querySelector(".dialog--download").classList.remove("dialog--show")
})

document.addEventListener("carousel:showShareDialog", () => {
  document.querySelector(".dialog--share").classList.add("dialog--show")
})

document.addEventListener("carousel:hideShareDialog", () => {
  document.querySelector(".dialog--share").classList.remove("dialog--show")
})

const initCarousel = el => {
  // bind close button event
  el.querySelector("#CarouselClose").addEventListener("click", e => {
    e.preventDefault()
    trigger("carousel:hide")
  })

  // bind pager events
  el.querySelector("#PhotoNext").addEventListener("click", e => {
    e.preventDefault()
    trigger("photos:showNextPhoto")
  })
  el.querySelector("#PhotoPrev").addEventListener("click", e => {
    e.preventDefault()
    trigger("photos:showPrevPhoto")
  })

  // bind sidebar toggle button event
  el.querySelector("#PhotoDetails").addEventListener("click", e => {
    e.preventDefault()
    trigger("carousel:toggleMeta")
  })

  // bind slideshow button events
  el.querySelector("#PhotoSlideshowPlay").addEventListener("click", e => {
    e.preventDefault()
    trigger("carousel:playSlideshow")
  })
  el.querySelector("#PhotoSlideshowPause").addEventListener("click", e => {
    e.preventDefault()
    trigger("carousel:pauseSlideshow")
  })

  // bind download button event
  el.querySelector("#PhotoDownload").addEventListener("click", e => {
    e.preventDefault()
    downloadImage()
  })

  // bind share button event
  el.querySelector("#PhotoShare").addEventListener("click", e => {
    e.preventDefault()
    trigger("carousel:showShareDialog")
  })

  // bind share panel button events
  document.querySelector("#ShareLink").addEventListener("click", e => {
    e.preventDefault()
    const res = copyToClipboard(
      `${window.location.origin + window.location.pathname}?id=${currentImageMeta.mid}`,
      "link"
    )
    if (res) trigger("carousel:hideShareDialog")
  })
  document.querySelector("#ShareFacebook").addEventListener("click", e => {
    e.preventDefault()
    const url = `https://www.facebook.com/dialog/share?app_id=498572111052804&href=${encodeURIComponent(
      `${window.location.origin + window.location.pathname}?id=${currentImageMeta.mid}`
    )}`
    window.open(url, "_blank")
  })
  document.querySelector("#ShareTwitter").addEventListener("click", e => {
    e.preventDefault()
    const url = `https://twitter.com/share?text=${encodeURIComponent(
      document.querySelector("meta[name=description]").getAttribute("content")
    )}&url=${encodeURIComponent(`${window.location.origin + window.location.pathname}?id=${currentImageMeta.mid}`)}`
    window.open(url, "_blank")
  })
  document.querySelector("#ShareEmail").addEventListener("click", e => {
    e.preventDefault()
    const url = `mailto:?subject=${document.title}&body=${encodeURIComponent(
      document.querySelector("meta[name=description]").getAttribute("content")
    )} ${encodeURIComponent(`${window.location.origin + window.location.pathname}?id=${currentImageMeta.mid}`)}`
    window.location.href = url
  })

  // bind download panel button events
  document.querySelector("#DialogDownloadClose").addEventListener("click", e => {
    e.preventDefault()
    trigger("carousel:hideDownloadDialog")
  })
  document.querySelector("#DialogShareClose").addEventListener("click", e => {
    e.preventDefault()
    trigger("carousel:hideShareDialog")
  })

  // add photos container hover actions
  document.querySelector(".carousel__photos").addEventListener("mouseover", e => {
    e.currentTarget.classList.remove("hide-controls")
  })

  document.querySelector(".carousel__photos").addEventListener("mouseout", e => {
    e.currentTarget.classList.add("hide-controls")
  })

  // bind key events
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
  if (carouselNode) initCarousel(carouselNode)
})
