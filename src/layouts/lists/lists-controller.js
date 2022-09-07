import { Controller } from "stimulus"
import { throttle } from "lodash"
import {
  lang,
  escapeHTML,
  trigger,
  getLocale,
  isElementInViewport,
  getPrettyURLValues,
  setPageMeta,
} from "../../js/utils"
import { appState } from "../../js/app"
import config from "../../data/siteConfig"
import listManager from "../../js/list-manager"

export default class extends Controller {
  static get targets() {
    return [
      "title",
      "titleLabel",
      "titleButton",
      "subtitle",
      "count",
      "countLabel",
      "grid",
      "listItem",
      "listPhotos",
      "placeholder",
    ]
  }

  connect() {
    this.loadListItemThumbnails = throttle(this.loadListItemThumbnails, 200)
  }

  async show() {
    // hide the both the lists and list-photos first
    this.hide()

    // check for a list id in the url
    const listId = getPrettyURLValues(window.location.pathname.split(`/${getLocale()}/lists/`).join("/"))[0] || null

    if (appState("auth-signed-in")) {
      // the user is logged in

      if (listId) {
        // load lists if it hasn't been loaded
        if (!listManager.hasData()) {
          trigger("loader:show", { id: "loaderBase" })
          await listManager.loadListData()
          trigger("loader:hide", { id: "loaderBase" })
        }

        // check for an existing list given the id (first of the url path values)
        let listData = listManager.getUserListById(listId)

        if (listData) {
          // if the selected list exists trigger the event to show the list photos
          trigger("lists:showListPhotos", { listId: listData.id })
        } else {
          // the list might not one of the current user's, check if it's public
          trigger("loader:show", { id: "loaderBase" })
          listData = await listManager.loadPublicListDataById(listId)
          trigger("loader:hide", { id: "loaderBase" })

          if (listData) {
            // the list exist in the public domain
            trigger("lists:showListPhotos", { listId: listData.id, isPublic: true })
          } else {
            // the list doesn't exist in the public domain either, fallback to the lists page
            trigger("snackbar:show", { message: lang("list_404"), status: "error", autoHide: true })
            await this.open()
          }
        }
      } else {
        // no id is given, show the lists page by default
        await this.open()
      }
    } else {
      // the user is logged out

      // cleanup for the case of sign outs
      this.listRendered = false
      listManager.clearAllData()

      if (listId) {
        // we have a list id, check if the list is public
        trigger("loader:show", { id: "loaderBase" })
        const listData = await listManager.loadPublicListDataById(listId)
        trigger("loader:hide", { id: "loaderBase" })

        if (listData) {
          // the list exist in the public domain
          trigger("lists:showListPhotos", { listId: listData.id, isPublic: true })
        } else {
          // the list doesn't exist in the public domain, show the login screen instead
          trigger("snackbar:show", {
            message: `${lang("list_404")}<br>${lang("list_signin_alert")}`,
            status: "error",
            autoHide: true,
          })
          trigger("dialogSignin:show")
        }
      } else {
        // just show the login screen
        trigger("snackbar:show", { message: lang("list_signin_alert"), status: "error", autoHide: true })
        trigger("dialogSignin:show")
      }
    }
  }

  async open() {
    this.element.classList.add("is-visible")

    const lists = await this.renderLists()

    const target = lists.length > 0 ? this.gridTarget : this.placeholderTarget

    target.classList.remove("is-hidden")
    if (lists.length > 0) this.titleButtonTarget.classList.remove("is-hidden")

    setTimeout(() => {
      this.subtitleTarget.classList.add("is-visible")
      target.classList.add("is-visible")

      if (lists.length > 0) this.titleButtonTarget.classList.add("is-visible")

      this.loadListItemThumbnails()
    }, 100)
  }

  hide() {
    this.element.scrollTop = 0
    this.element.classList.remove("is-visible")

    this.subtitleTarget.classList.remove("is-visible")

    this.titleButtonTarget.classList.add("is-hidden")
    this.titleButtonTarget.classList.remove("is-visible")

    this.gridTarget.classList.add("is-hidden")
    this.gridTarget.classList.remove("is-visible")

    this.placeholderTarget.classList.add("is-hidden")
    this.placeholderTarget.classList.remove("is-visible")

    trigger("lists:hideListPhotos")
  }

  async renderLists() {
    // run the render only once
    if (this.listRendered) {
      // needs to return with lists in any case
      const lists = await listManager.getLists()
      return lists
    }

    this.listRendered = true

    trigger("loader:show", { id: "loaderBase" })

    setPageMeta(lang("lists"), null, null)

    // remove all previously existing listItems
    this.listItemTargets.forEach(listItem => listItem.remove())

    this.subtitleTarget.classList.remove("is-visible")

    const lists = await listManager.getLists()

    const listPhotosPromises = []
    const listItemsCreated = []

    lists.forEach(listData => {
      const template = document.getElementById("lists-item").content.firstElementChild

      const newListItem = template.cloneNode(true)
      newListItem.listId = listData.id
      listItemsCreated.push(newListItem)

      newListItem.querySelector(".lists-private-icon").classList.toggle("is-visible", listData.private)

      const title = newListItem.querySelector(".lists__item__title")
      if (title) {
        title.innerHTML = escapeHTML(listData.name)
        title.setAttribute("href", listData.url)
      }

      const description = newListItem.querySelector(".lists__item__description")
      if (description) {
        description.classList.remove("is-visible")

        if (listData.description) {
          description.innerHTML = escapeHTML(listData.description)
          description.classList.add("is-visible")
        }
      }

      // images
      const listPhotosPromise = listManager.getListPhotos(listData.id).then(photosData => {
        // after photos data loaded
        const cover = newListItem.querySelector(".lists__item__cover")
        if (cover && photosData.length > 0) {
          cover.classList.add(photosData.length > 3 ? "has-image--more" : `has-image--${photosData.length}`)

          if (photosData.length > 3) {
            const count = newListItem.querySelector(".lists__item__counter")
            count.innerText = `+${photosData.length - 3}`
          }
        } else {
          cover.classList.add("no-image")
        }

        photosData.forEach((photoItem, index) => {
          if (index < 3) {
            const photoId = photoItem.id
            const photoElement = newListItem.querySelectorAll(".lists__item__photo")[index]
            const imageTarget = photoElement.querySelector(".lists__item__photo__img")
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
            imageTarget.src = `${config.PHOTO_SOURCE}480/fortepan_${photoId}.jpg`
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
    this.subtitleTarget.classList.add("is-visible")

    trigger("loader:hide", { id: "loaderBase" })

    return lists
  }

  loadListItemThumbnails() {
    const imageTargets = this.element.querySelectorAll(
      ".lists__item__photo.has-photo .lists__item__photo__img:not(.is-loaded)"
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
      e.preventDefault()

      // if the user clicks on the add photos icon do nothing
      if (e.target && e.target.classList.contains("lists__item__add-icon")) {
        return
      }

      const listItem = this.listItemTargets.find(item => item.contains(e.currentTarget))
      const listData = listManager.getListById(listItem.listId || 0)

      if (listData && listData.url && window.location.pathname !== listData.url) {
        // window.location = listData.url

        window.history.pushState(null, escapeHTML(listData.name), listData.url)

        // this.show() will open the list photos (= carousel component) given the url conditions
        this.show()
      }
    }
  }

  onPopState() {
    this.show()
  }

  // context menu functions

  showContextMenu(e) {
    if (e) {
      e.preventDefault()

      const listItemMenu = e.currentTarget.parentNode
      const dropdown = listItemMenu.querySelector(".header-nav__popup")

      this.hideAllContextMenu(dropdown)

      listItemMenu.classList.toggle("is-open")
      dropdown.classList.toggle("is-visible")

      dropdown.removeAttribute("style")
      const bounds = dropdown.getBoundingClientRect()

      if (bounds.left < 16) {
        dropdown.style.right = "auto"
        dropdown.style.left = 0
      }

      if (bounds.right > window.innerWidth - 16) {
        dropdown.style.right = "auto"
        dropdown.style.left = `${window.innerWidth -
          16 -
          e.currentTarget.getBoundingClientRect().left -
          bounds.width}px`
      }

      if (bounds.bottom > window.innerHeight - 16) {
        dropdown.style.top = `-${bounds.height}px`
      }
    }
  }

  hideAllContextMenu(elementToExclude) {
    this.element.querySelectorAll(".header-nav__popup").forEach(dropdown => {
      if (!elementToExclude || elementToExclude !== dropdown) {
        dropdown.classList.remove("is-visible")
        dropdown.parentNode.classList.remove("is-open")
      }
    })
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
    this.reloadLists()

    if (e && e.detail && e.detail.action) {
      switch (e.detail.action) {
        /* case "edit":
            // TODO: modify the listItem
            break
          case "delete":
            // TODO: remove the listItem
            break */
        case "create":
          if (this.element.classList.contains("is-visible") && e.detail.listId) {
            const listData = listManager.getListById(e.detail.listId)

            if (listData && listData.url && window.location.pathname !== listData.url) {
              window.history.pushState(null, escapeHTML(listData.name), listData.url)
              this.show()
            }
          }
          break

        default:
          break
      }
    }
  }

  reloadLists() {
    // reload the whole list
    this.listRendered = false
    this.show()
  }

  jumpToPhotos(e) {
    if (e) e.preventDefault()
    window.location = `/${getLocale()}/photos/`
  }
}
