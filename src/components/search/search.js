import throttle from "lodash/throttle"
import { ready, trigger } from "../../utils"
import config from "../../config"

let searchDialog = null

document.addEventListener("searchdialog:show", () => {
  if (!searchDialog) return
  searchDialog.classList.add("dialog--show")
  const input = searchDialog.querySelector("input")
  input.focus()
  input.value = ""
})

document.addEventListener("searchdialog:hide", () => {
  if (!searchDialog) return
  searchDialog.classList.remove("dialog--show")
})

document.addEventListener("searchdialog:toggle", () => {
  if (!searchDialog) return
  searchDialog.classList.toggle("dialog--show")
  if (searchDialog.classList.contains("dialog--show")) {
    const input = searchDialog.querySelector("input")
    input.focus()
    input.value = ""
  }
})

document.addEventListener("search:clear", () => {
  Array.from(document.querySelectorAll(".search__input")).forEach(searchInput => {
    // eslint-disable-next-line no-param-reassign
    searchInput.value = ""
  })
})

document.addEventListener("search:setValue", e => {
  if (e.detail) {
    Array.from(document.querySelectorAll(".search__input")).forEach(searchInput => {
      // eslint-disable-next-line no-param-reassign
      searchInput.value = e.detail.value
    })
  }
})

window.addEventListener(
  "resize",
  throttle(() => {
    if (!searchDialog) return
    if (window.innerWidth >= config.BREAKPOINT_DESKTOP && searchDialog.classList.contains("dialog--show")) {
      searchDialog.classList.remove("dialog--show")
    }
  }, 200)
)

document.addEventListener("keydown", e => {
  if (!searchDialog) return
  if (!searchDialog.classList.contains("dialog--show")) return

  switch (e.key) {
    case "Escape":
      trigger("searchdialog:hide")
      break
    default:
  }
})

const initSearch = searchInput => {
  // bind events
  const searchNode = searchInput.parentNode
  searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const q = `?q=${encodeURIComponent(searchInput.value)}`
      if (window.location.pathname.indexOf("/photos") === -1) {
        window.location = `/${searchNode.dataset.lang}/photos/${q}`
      } else {
        trigger("photos:historyPushState", {
          url: q,
          resetPhotosWrapper: true,
        })

        trigger("searchdialog:hide")
      }
    }
  })

  searchInput.addEventListener("blur", () => {
    trigger("search:hide")
  })
}

ready(() => {
  searchDialog = document.querySelector(".dialog--search")
  const searchInputs = document.querySelectorAll(".search__input")
  if (searchInputs.length > 0)
    Array.from(searchInputs).forEach(searchInput => {
      initSearch(searchInput)
    })
})
