import lang from "./data/lang"

export const isTouchDevice = () => {
  return "ontouchstart" in window || window.navigator.maxTouchPoints > 0 || window.navigator.msMaxTouchPoints > 0
}

export const ready = fn => {
  if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
    fn()
  } else {
    document.addEventListener("DOMContentLoaded", fn)
  }
}

export const trigger = (eventId, obj = {}, scope = document) => {
  const event = new CustomEvent(eventId, {
    detail: obj,
  })
  scope.dispatchEvent(event)
}

export const click = () => {
  return isTouchDevice() ? "touchstart" : "click"
}

export const getURLParams = () => {
  return Object.fromEntries(new URLSearchParams(window.location.search.substring(1)))
}

export const removeClassByPrefix = (el, prefix) => {
  const regx = new RegExp(`\\b${prefix}(.[^\\s]*)?\\b`, "g")
  // eslint-disable-next-line no-param-reassign
  el.className = el.className.replace(regx, "")
  return el
}

export const numberWithCommas = x => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export const slugify = (str, removeSpaces) => {
  let s = str.toString()

  const map = {
    a: "á|à|ã|â|À|Á|Ã|Â",
    e: "é|è|ê|É|È|Ê",
    i: "í|ì|î|Í|Ì|Î",
    o: "ó|ò|ö|ô|õ|ő|Ó|Ò|Ö|Ô|Õ|Ő",
    u: "ú|ù|û|ü|ű|Ú|Ù|Û|Ü|Ű",
    c: "ç|Ç",
    n: "ñ|Ñ",
  }

  s = s.toLowerCase()

  Object.keys(map).forEach(pattern => {
    s = s.replace(new RegExp(map[pattern], "g"), pattern)
  })

  if (removeSpaces) {
    s = s.replace(new RegExp("·|/|_|,|:|;| ", "g"), "-")
  }

  return s
}

export const setPageMeta = (title, description, imgSrc) => {
  if (title) {
    const titleText = `Fortepan — ${title}`
    document.title = titleText
    document.querySelector('meta[property="twitter:title"]').setAttribute("content", titleText)
    document.querySelector('meta[property="og:title"]').setAttribute("content", titleText)
  }
  if (description) {
    document.querySelector('meta[name="description"]').setAttribute("content", description)
    document.querySelector('meta[property="twitter:description"]').setAttribute("content", description)
    document.querySelector('meta[property="og:description"]').setAttribute("content", description)
  }
  if (imgSrc) {
    document.querySelector('meta[property="twitter:image:src"]').setAttribute("content", imgSrc)
    document.querySelector('meta[property="og:image"]').setAttribute("content", imgSrc)
  }
}

export const copyToClipboard = (textToCopy, type) => {
  const input = document.createElement("textarea")
  input.className = "visuallyhidden"
  input.value = textToCopy

  document.body.appendChild(input)

  input.select()

  const l = lang[document.querySelector("body").dataset.lang]
  const res = document.execCommand("copy")
  if (res) {
    trigger("snackbar:show", {
      message: type === "link" ? l.copy_link_clipboard : l.copy_text_clipboard,
      autoHide: true,
      status: "success",
    })
  } else {
    trigger("snackbar:show", {
      message: type === "link" ? l.copy_link_clipboard_failed : l.copy_text_clipboard_failed,
      autoHide: true,
      status: "error",
    })
  }

  document.body.removeChild(input)
  return res
}
