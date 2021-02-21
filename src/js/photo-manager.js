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
  let data = {}
  if (photoData.result && photoData.result.items && photoData.result.items.length) {
    data = photoData.result.items.find(element => element.mid === id)
    if (!data) {
      // TODO load the picture
    }
  }
  return data
}

const getFirstPhotoData = () => {
  let data = {}
  if (photoData.result && photoData.result.items && photoData.result.items.length) {
    data = photoData.result.items[0]
  }
  return data
}

const getLastPhotoData = () => {
  let data = {}
  if (photoData.result && photoData.result.items && photoData.result.items.length) {
    data = photoData.result.items[photoData.result.items.length - 1]
  }
  return data
}

const clearPhotoData = () => {
  // if the context of the search has changed flush the cached searsh results
  delete photoData.context
  delete photoData.result
}

document.addEventListener("photos:contextChanged", clearPhotoData)

export default {
  loadPhotoData,
  getPhotoDataByID,
  getFirstPhotoData,
  getLastPhotoData,
  clearPhotoData,
}
