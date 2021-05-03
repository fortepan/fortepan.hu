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

export default {
  loadListData,
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
}
