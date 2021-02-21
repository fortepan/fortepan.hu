import { trigger, getURLParams } from "./utils"
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

  return { items: photoData.result.latestItems, total: photoData.result.total }
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

const getSelectedPhotoId = () => {
  return photoData.selectedId
}

const getSelectedPhotoData = () => {
  return photoData.selectedItem
}

const setSelectedPhoto = id => {
  photoData.selectedId = id
  photoData.selectedItem = getPhotoDataByID(id)
  return { id: photoData.selectedId, data: photoData.selectedItem }
}

const clearPhotoData = () => {
  // if the context of the search has changed flush the cached searsh results
  delete photoData.context
  delete photoData.result
  delete photoData.selectedId
  delete photoData.selectedItem
}
document.addEventListener("photos:contextChanged", clearPhotoData)

export default {
  loadPhotoData,
  getPhotoDataByID,
  getFirstPhotoData,
  getLastPhotoData,
  getSelectedPhotoId,
  getSelectedPhotoData,
  setSelectedPhoto,
  clearPhotoData,
}
