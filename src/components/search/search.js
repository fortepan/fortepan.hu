import throttle from "lodash/throttle"
import { ready, trigger } from "../../utils"
import config from "../../config"
import api from "../api/api"

let searchDialog = null

const QUERY_PARAMS = {
  orszag_name: "country",
  varos_name: "city",
  helyszin_name: "location",
  adomanyozo_name: "donor",
  szerzo_name: "author",
  cimke_name: "tag",
}

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

const searchSubmit = searchInput => {
  const searchNode = searchInput.parentNode
  let q = `?q=${encodeURIComponent(searchInput.value)}`

  const selectedItem = searchNode.querySelector(".search__autosuggest__item--selected")
  if (selectedItem) q = `?${selectedItem.dataset.type}=${encodeURIComponent(selectedItem.textContent)}`

  if (window.location.pathname.indexOf("/photos") === -1) {
    window.location = `/${document.querySelector("body").dataset.lang}/photos/${q}`
  } else {
    trigger("photos:historyPushState", {
      url: q,
      resetPhotosWrapper: true,
    })

    trigger("searchdialog:hide")
  }
}

const initSearch = searchInput => {
  // bind events
  const searchNode = searchInput.parentNode

  searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      searchSubmit(searchInput)
    }
  })

  searchInput.addEventListener("keyup", e => {
    const autoSuggestNode = searchNode.querySelector(".search__autosuggest")
    if (searchInput.value.length > 1) {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") {
        api.autoSuggest(
          searchInput.value,
          res => {
            if (res.length > 0) {
              autoSuggestNode.classList.add("search__autosuggest--show")
              autoSuggestNode.innerHTML = ""
              for (let i = 0; i < Math.min(5, res.length); i += 1) {
                const itemNode = document.createElement("div")
                itemNode.dataset.type = QUERY_PARAMS[res[i].type]
                itemNode.className = "search__autosuggest__item"
                itemNode.textContent = res[i].keyword
                autoSuggestNode.appendChild(itemNode)
                itemNode.addEventListener("click", () => {
                  searchSubmit(searchInput)
                })
              }
            } else {
              if (searchNode.querySelector(".search__autosuggest__item--selected"))
                searchNode
                  .querySelector(".search__autosuggest__item--selected")
                  .classList.remove("search__autosuggest__item--selected")
              autoSuggestNode.classList.remove("search__autosuggest--show")
            }
          },
          error => {
            console.log(error)
            autoSuggestNode.classList.remove("search__autosuggest--show")
          }
        )
      }

      const selectedItem = autoSuggestNode.querySelector(".search__autosuggest__item--selected")
      if (e.key === "ArrowDown") {
        if (selectedItem && selectedItem.nextElementSibling) {
          selectedItem.classList.remove("search__autosuggest__item--selected")
          selectedItem.nextElementSibling.classList.add("search__autosuggest__item--selected")
        } else if (!selectedItem) {
          autoSuggestNode
            .querySelector(".search__autosuggest__item")
            .classList.add("search__autosuggest__item--selected")
        }
      }

      if (e.key === "ArrowUp") {
        if (selectedItem && selectedItem.previousElementSibling) {
          selectedItem.classList.remove("search__autosuggest__item--selected")
          selectedItem.previousElementSibling.classList.add("search__autosuggest__item--selected")
        } else if (selectedItem) {
          selectedItem.classList.remove("search__autosuggest__item--selected")
        }
      }
    } else {
      autoSuggestNode.classList.remove("search__autosuggest--show")
    }
  })

  searchInput.addEventListener("blur", () => {
    const autoSuggestNode = searchNode.querySelector(".search__autosuggest")
    autoSuggestNode.classList.remove("search__autosuggest--show")
    trigger("search:hide")
  })
}

ready(() => {
  searchDialog = document.querySelector(".dialog--search")
  const searchInputs = document.querySelectorAll(".search__input")
  if (searchInputs.length > 0) {
    // init search inputs
    Array.from(searchInputs).forEach(searchInput => {
      initSearch(searchInput)
    })
  }
})
