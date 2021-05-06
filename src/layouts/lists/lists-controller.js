import { Controller } from "stimulus"
import { throttle } from "lodash"
import { lang, escapeHTML, trigger, getLocale, isElementInViewport } from "../../js/utils"
import { appState } from "../../js/app"
import config from "../../data/siteConfig"
import listManager from "../../js/list-manager"

export default class extends Controller {
  static get targets() {
    return ["count", "countLabel", "grid", "listItem"]
  }

  connect() {
    this.loadListItemThumbnails = throttle(this.loadListItemThumbnails, 200)
  }

  async show() {
    if (appState("auth-signed-in")) {
      this.element.classList.add("is-visible")
      await this.renderLists()
    } else {
      this.element.classList.remove("is-visible")
      trigger("snackbar:show", { message: lang("list_signin_alert"), status: "error", autoHide: true })
      trigger("dialogSignin:show")
    }
  }

  async renderLists() {
    if (this.listRendered) return
    this.listRendered = true

    trigger("loader:show", { id: "loaderBase" })

    // remove all previously existing listItems
    this.listItemTargets.forEach(listItem => listItem.remove())

    const lists = await listManager.getLists()

    const listPhotosPromises = []
    const listItemsCreated = []

    lists.forEach(listData => {
      const template = document.getElementById("lists-item").content.firstElementChild

      const newListItem = template.cloneNode(true)
      newListItem.listId = listData.id
      listItemsCreated.push(newListItem)

      const title = newListItem.getElementsByClassName("lists__item__title")[0]
      if (title) {
        title.innerHTML = escapeHTML(listData.name)
        title.setAttribute("href", listData.url)
      }

      if (listData.description) {
        const description = newListItem.getElementsByClassName("lists__item__description")[0]
        if (description) {
          description.innerHTML = escapeHTML(listData.description)
          /* description.innerHTML = escapeHTML(
            "Random lista leírás, maximum 140 karakter hosszú, és minden listához egyenként hozzáadható. Megjelenik a listákat listázó oldalon és máshol."
            ) */
          description.classList.add("is-visible")
        }
      }

      // images
      const listPhotosPromise = listManager.getListPhotos(listData.id).then(photosData => {
        // after photos data loaded
        const cover = newListItem.getElementsByClassName("lists__item__cover")[0]
        if (cover && photosData.length > 0) {
          cover.classList.add(photosData.length > 3 ? "has-image--more" : `has-image--${photosData.length}`)

          if (photosData.length > 3) {
            const count = newListItem.getElementsByClassName("lists__item__counter")[0]
            count.innerText = `+${photosData.length - 3}`
          }
        } else {
          cover.classList.add("no-image")
        }

        photosData.forEach((photoItem, index) => {
          if (index < 3) {
            const photoId = photoItem.id
            const photoElement = newListItem.getElementsByClassName("lists__item__photo")[index]
            const imageTarget = photoElement.getElementsByClassName("lists__item__photo__img")[0]
            const img = new Image()

            photoElement.classList.add("has-photo")

            img.addEventListener("load", () => {
              imageTarget.style.backgroundImage = `url("${img.src}")`
              imageTarget.classList.add("is-loaded")
            })

            img.addEventListener("error", () => {
              imageTarget.classList.add("is-failed-loading")
            })

            imageTarget.img = img
            imageTarget.src = `${config.PHOTO_SOURCE}240/fortepan_${photoId}.jpg`
          }
        })

        this.loadListItemThumbnails()
      })

      listPhotosPromises.push(listPhotosPromise)
    })

    await Promise.all(listPhotosPromises)

    // when all data is loaded add the list items to the dom
    listItemsCreated.forEach(listItem => this.gridTarget.appendChild(listItem))

    this.countTarget.innerText = lists.length

    trigger("loader:hide", { id: "loaderBase" })
  }

  loadListItemThumbnails() {
    const imageTargets = Array.from(
      this.element.querySelectorAll(".lists__item__photo.has-photo .lists__item__photo__img:not(.is-loaded)")
    )

    imageTargets.forEach(imgTarget => {
      if (!imgTarget.imageLoadInit && imgTarget.img && isElementInViewport(imgTarget, false)) {
        imgTarget.img.src = imgTarget.src
        imgTarget.imageLoadInit = true
      }
    })
  }

  openList(e) {
    if (e && e.currentTarget) {
      // if the user clicks on the add photos icon do nothing
      if (e.target && e.target.classList.contains("lists__item__add-icon")) {
        return
      }

      const listItem = this.listItemTargets.find(item => item.contains(e.currentTarget))
      const id = listItem ? listItem.listId : 0
      const listData = listManager.getListById(id)

      if (listData && listData.url) {
        window.location = listData.url

        /* window.history.pushState(
        null,
        escapeHTML(listData.name),
        listData.url
      ) */
      }
    }
  }

  showEditListDropdown(e) {
    if (e) {
      e.preventDefault()

      const listItemMenu = e.currentTarget.parentNode
      const dropdown = listItemMenu.getElementsByClassName("header-nav__popup")[0]

      this.hideEditListDropdowns(dropdown)
      dropdown.classList.toggle("is-visible")
    }
  }

  hideEditListDropdowns(elementToExclude) {
    if (this.element.classList.contains("is-visible")) {
      const dropdowns = Array.from(this.element.getElementsByClassName("header-nav__popup"))

      dropdowns.forEach(dropdown => {
        if (!elementToExclude || elementToExclude !== dropdown) {
          dropdown.classList.remove("is-visible")
        }
      })
    }
  }

  createList(e) {
    if (e) e.preventDefault()
    trigger("dialogLists:show", { action: "create" })
  }

  editList(e) {
    if (e) {
      e.preventDefault()

      const listItem = this.listItemTargets.find(item => item.contains(e.currentTarget))
      const id = listItem ? listItem.listId : 0

      trigger("dialogLists:show", { action: "edit", listId: id })
    }
  }

  deleteList(e) {
    if (e) {
      e.preventDefault()

      const listItem = this.listItemTargets.find(item => item.contains(e.currentTarget))
      const id = listItem ? listItem.listId : 0

      trigger("dialogLists:show", { action: "delete", listId: id })
    }
  }

  onListsChanged(e) {
    if (e && e.action) {
      switch (e.action) {
        /* case "create":
          // TODO: add the new listItem
          break
        case "edit":
          // TODO: modify the listItem
          break
        case "delete":
          // TODO: remove the listItem
          break */
        default:
          this.reloadLists()
          break
      }
    } else {
      this.reloadLists()
    }
  }

  reloadLists() {
    // reload the whole list
    this.listRendered = false
    this.element.classList.remove("is-visible")
    this.show()
  }

  jumpToPhotos(e) {
    if (e) e.preventDefault()
    window.location = `/${getLocale()}/photos/`
  }
}
