import { ready, trigger } from "../../utils"

let searchNode = null
let searchInput = null

document.addEventListener("search:show", () => {
  searchNode.classList.add("search--show")
  searchInput.focus()
  searchInput.value = ""
})

document.addEventListener("search:hide", () => {
  searchNode.classList.remove("search--show")
})

document.addEventListener("search:toggle", () => {
  searchNode.classList.toggle("search--show")
  if (searchNode.classList.contains("search--show")) {
    searchInput.focus()
    searchInput.value = ""
  }
})

const initSearch = () => {
  // bind events

  document.addEventListener("keydown", e => {
    if (!searchNode.classList.contains("search--show")) return

    switch (e.key) {
      case "Escape":
        trigger("search:hide")
        break
      default:
    }
  })

  searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      trigger("photos:historyPushState", {
        url: `?q=${encodeURIComponent(searchInput.value)}`,
        resetPhotosWrapper: true,
      })
      trigger("search:hide")
    }
  })

  searchInput.addEventListener("blur", () => {
    trigger("search:hide")
  })
}

ready(() => {
  searchNode = document.querySelector(".search")
  searchInput = document.querySelector(".search__input")
  if (searchNode) initSearch()
})
