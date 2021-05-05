import { getLocale, trigger, slugify } from "./utils"
import listsAPI from "../api/lists"

const listData = {}

const loadListData = async () => {
  const rawResponse = await listsAPI.getLists()

  listData.lists = []

  Object.keys(rawResponse).forEach(key => {
    const data = { id: key, name: rawResponse[key] }
    data.url = `/${getLocale()}/lists/${slugify(data.name, true)}`

    listData.lists.push(data)
  })

  trigger("listManager:load", listData.lists)

  return listData.lists
}

const getLists = async () => {
  if (!listData.lists) {
    await loadListData()
  }
  return listData.lists
}

const getListById = listId => {
  return listData.lists.find(item => Number(item.id) === Number(listId))
}

const loadListPhotosData = async listId => {
  const list = getListById(listId)
  const rawPhotosResp = await listsAPI.getListPhotos(listId)

  list.photos = []

  Object.keys(rawPhotosResp.flags).forEach(key => {
    list.photos.push({ id: rawPhotosResp.flags[key] })
  })

  trigger("listManager:onPhotosDataLoaded", { listID: listId, photos: list.photos })

  return list.photos
}

const getListPhotos = async listId => {
  const list = getListById(listId)
  if (list) {
    if (!list.photos) {
      await loadListPhotosData(listId)
    }

    return list.photos
  }

  return []
}

const clearAllData = () => {
  // if the context of the search has changed destroy all photo data
  delete listData.lists

  trigger("listManager:allDataCleared")
}

// admin functions (creating and deleting lists, adding and removing photos to/from lists)

const createList = async (listName, description) => {
  const listId = await listsAPI.createList(listName, description)

  // force to reload the list data in the listManager as a new list has been created
  clearAllData()
  await loadListData()

  return listId
}

const editList = async (listId, name, description) => {
  if (listId && name) {
    const resp = await listsAPI.editList(listId, name, description)
    return resp
  }
  return { errors: `Missing parameters: ${!listId ? "listId, " : ""}${!name ? "name" : ""}` }
}

const deleteList = async listId => {
  const resp = await listsAPI.deleteList(listId)

  // force to reload the list data in the listManager as a new list has been created
  clearAllData()
  await loadListData()

  return resp
}

const addPhotoToList = async (photoId, listId) => {
  const resp = await listsAPI.addToList(photoId, listId)

  // update photo data of the list item
  await loadListPhotosData(listId)

  return resp
}

const deletePhotoFromList = async (photoId, listId) => {
  const resp = await listsAPI.deleteFromList(photoId, listId)

  // update photo data of the list item
  await loadListPhotosData(listId)

  return resp
}

// return all the lists of the current logged in user that contains a given image
const getContainingLists = async photoId => {
  // TODO
  await listsAPI.getContainingLists(photoId)
  return photoId
}

export default {
  loadListData,
  getLists,
  getListById,
  loadListPhotosData,
  getListPhotos,
  /* hasData,
    getSelectedPhotoId,
    getSelectedPhotoData,
    getSelectedPhotoIndex,
    selectPhotoById,
    getPhotoDataByID,
    loadMorePhotoDataInContext,
    getLastPhotoDataInContext,
    selectNextPhoto,
    getFirstPhotoDataInContext,
    selectPrevPhoto,
    getFirstPhotoData,
    getLastPhotoData,
    getYearsInContext,
    getFirstYearInContext,
    getLastYearInContext,
    hasPhotoDataOfYear,
    getFirstPhotoOfYear,
    getTotalPhotoCountInContext,
    getLatestSearchContext,
    clearPhotoCache, */
  clearAllData,
  createList,
  editList,
  deleteList,
  addPhotoToList,
  deletePhotoFromList,
  getContainingLists,
}
