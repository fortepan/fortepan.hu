import { trigger } from "./utils"
import searchAPI from "../api/search"

// creating a context object to store the latest request parameters and results
const photoData = {}

const loadPhotoData = async params => {
  // saving the last search context
  photoData.context = params

  const resp = await searchAPI.search(params)

  // storing the items so it can be accessed later
  if (!photoData.result) {
    photoData.result = resp
  } else if (photoData.result.items) {
    photoData.result.items = photoData.result.items.concat(resp.items)
  } else {
    photoData.result.items = resp.items
  }

  // storing the latest loaded set as well
  photoData.result.latestItems = resp.items

  // storing the total number
  if (resp.total) {
    photoData.result.total = resp.total
  }

  const result = { items: photoData.result.latestItems, total: photoData.result.total }

  // dispatch an event that new photos have been loaded in the search context
  trigger("photoManager:load", result)

  return result
}

const getPhotoDataByID = id => {
  let data = null
  if (photoData.result && photoData.result.items && photoData.result.items.length) {
    data = photoData.result.items.find(element => element.mid === id)
    if (!data) {
      // TODO: load the picture if context allows
    }
  }
  return data
}

const getPhotoIndexByID = id => {
  if (photoData.result && photoData.result.items && photoData.result.items.length) {
    return photoData.result.items.findIndex(element => element.mid === id)
  }
  return -1
}

const getSelectedPhotoId = () => {
  return photoData.selectedId
}

const getSelectedPhotoData = () => {
  return photoData.selectedItem
}

const getSelectedPhotoIndex = () => {
  return photoData.selectedIndex
}

const setSelectedPhoto = id => {
  photoData.selectedId = id
  photoData.selectedItem = getPhotoDataByID(id)
  photoData.selectedIndex = getPhotoIndexByID(id)
  return { id: photoData.selectedId, data: photoData.selectedItem }
}

const getFirstPhotoData = () => {
  if (photoData.result && photoData.result.items && photoData.result.items.length) {
    return this.photoData.result.items[0]
  }
  return null
}

const getLastPhotoData = () => {
  if (photoData.result && photoData.result.items && photoData.result.items.length) {
    return photoData.result.items[photoData.result.items.length - 1]
  }
  return null
}

const selectNextPhoto = async () => {
  if (photoData.selectedIndex !== -1) {
    const nextIndex = photoData.selectedIndex + 1

    if (nextIndex <= photoData.result.items.length - 1) {
      const data = photoData.result.items[photoData.selectedIndex + 1]
      setSelectedPhoto(data.mid)

      // dispatching a new event when the next photo is selected
      trigger("photoManager:nextSelected", {
        id: getSelectedPhotoId(),
        data: getSelectedPhotoData(),
        index: getSelectedPhotoIndex(),
      })
    } else if (
      nextIndex > photoData.result.items.length - 1 &&
      photoData.result.items.length < photoData.result.total
    ) {
      // if there's more photos in the search context that haven't been loaded yet
      // load a new set of max 40 photos, and try selecting the next photo again
      const params = photoData.context
      params.search_after = getLastPhotoData().search_after

      await loadPhotoData(params)

      selectNextPhoto()
    }
  }
}

const selectPrevPhoto = async () => {
  if (photoData.selectedIndex !== -1) {
    const data = photoData.result.items[Math.max(0, photoData.selectedIndex - 1)]
    setSelectedPhoto(data.mid)

    // dispatching a new event when the prev photo is selected
    trigger("photoManager:prevSelected", {
      id: getSelectedPhotoId(),
      data: getSelectedPhotoData(),
      index: getSelectedPhotoIndex(),
    })
  }
}

const clearPhotoData = () => {
  // if the context of the search has changed flush the cached searsh results
  delete photoData.context
  delete photoData.result
  delete photoData.selectedId
  delete photoData.selectedItem
  delete photoData.selectedIndex
}
document.addEventListener("photos:contextChanged", clearPhotoData)

export default {
  loadPhotoData,
  getSelectedPhotoId,
  getSelectedPhotoData,
  getSelectedPhotoIndex,
  setSelectedPhoto,
  getPhotoDataByID,
  selectNextPhoto,
  selectPrevPhoto,
  getFirstPhotoData,
  getLastPhotoData,
  clearPhotoData,
}
