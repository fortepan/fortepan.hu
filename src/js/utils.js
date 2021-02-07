import langData from "../data/lang"

export const getLocale = () => {
  return document.querySelector("body").dataset.lang
}

export const lang = key => {
  const l = langData[getLocale()]
  const val = l[key] ? l[key] : key
  return val.replace(/(?:\r\n|\r|\n)/g, "<br/>")
}

export const isTouchDevice = () => {
  return "ontouchstart" in window || window.navigator.maxTouchPoints > 0 || window.navigator.msMaxTouchPoints > 0
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
    a: "Ä|ä|À|à|Á|á|Â|â|Ã|ã|Å|å|Ǎ|ǎ|Ą|ą|Ă|ă|Æ|æ|Ā|ā",
    c: "Ç|ç|Ć|ć|Ĉ|ĉ|Č|č",
    d: "Ď|đ|Đ|ď|ð",
    e: "È|è|É|é|Ê|ê|Ë|ë|Ě|ě|Ę|ę|Ė|ė|Ē|ē",
    g: "Ĝ|ĝ|Ģ|ģ|Ğ|ğ",
    h: "Ĥ|ĥ",
    i: "Ì|ì|Í|í|Î|î|Ï|ï|ı|Ī|ī|Į|į",
    j: "Ĵ|ĵ",
    k: "Ķ|ķ",
    l: "Ĺ|ĺ|Ļ|ļ|Ł|ł|Ľ|ľ|Ŀ|ŀ",
    n: "Ñ|ñ|Ń|ń|Ň|ň|Ņ|ņ",
    o: "Ö|ö|Ò|ò|Ó|ó|Ô|ô|Õ|õ|Ő|ő",
    r: "Ŕ|ŕ|Ř|ř",
    s: "Ś|ś|Ŝ|ŝ|Ş|ş|Š|š|Ș|ș",
    t: "Ť|ť|Ţ|ţ|Þ|þ|Ț|ț",
    u: "Ü|ü|Ù|ù|Ú|ú|Û|û|Ű|ű|Ũ|ũ|Ų|ų|Ů|ů|Ū|ū",
    w: "Ŵ|ŵ",
    y: "Ý|ý|Ÿ|ÿ|Ŷ|ŷ",
    z: "Ź|ź|Ž|ž|Ż|ż",
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

export const onClassChange = (node, callback) => {
  const classObserver = new window.MutationObserver(() => {
    callback(node)
  })
  classObserver.observe(node, {
    attributes: true,
    attributeFilter: ["class"],
  })
}

export const copyToClipboard = (textToCopy, type) => {
  const input = document.createElement("textarea")
  input.className = "visuallyhidden"
  input.value = textToCopy

  document.body.appendChild(input)

  input.select()

  const res = document.execCommand("copy")
  if (res) {
    trigger("snackbar:show", {
      message: type === "link" ? lang("copy_link_clipboard") : lang("copy_text_clipboard"),
      autoHide: true,
      status: "success",
    })
  } else {
    trigger("snackbar:show", {
      message: type === "link" ? lang("copy_link_clipboard_failed") : lang("copy_text_clipboard_failed"),
      autoHide: true,
      status: "error",
    })
  }

  document.body.removeChild(input)
  return res
}

export const isElementInViewport = el => {
  if (el) {
    const top = document.querySelector(".header") ? document.querySelector(".header").offsetHeight : 0
    const bounds = el.getBoundingClientRect()
    return bounds.top >= top && bounds.bottom <= window.innerHeight
  }
  return false
}

export const setCookie = (name, value, days) => {
  let expires = ""
  if (days) {
    const date = new Date()
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
    expires = `; expires=${date.toUTCString()}`
  }
  document.cookie = `${name}=${value || ""}${expires}; path=/`
}

export const getCookie = name => {
  const nameEQ = `${name}=`
  const ca = document.cookie.split(";")
  for (let i = 0; i < ca.length; i += 1) {
    let c = ca[i]
    while (c.charAt(0) === " ") c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

export const eraseCookie = name => {
  document.cookie = `${name}=; Max-Age=-99999999;`
}

export const validateEmail = email => {
  const reg = /^([A-Za-z0-9_\-.])+@([A-Za-z0-9_\-.])+.([A-Za-z]{2,4})$/
  return reg.test(email)
}

const globalSettingsStorage = {}
export const globalSettings = {
  setItem: (key, value) => {
    globalSettingsStorage[key] = value
  },
  getItem: key => {
    return globalSettingsStorage[key]
  },
  removeItem: key => {
    delete globalSettingsStorage[key]
  },
}
