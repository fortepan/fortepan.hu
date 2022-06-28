import { getLocale, trigger, slugify } from "./utils"
import listsAPI from "../api/lists"
import searchAPI from "../api/search"

const listData = {}

const loadListData = async () => {
  const rawResponse = await listsAPI.getLists()

  listData.lists = []

  Object.keys(rawResponse).forEach(key => {
    const data = {
      name: rawResponse[key].list_name,
      description: rawResponse[key].description,
      uuid: rawResponse[key].uuid,
    }
    data.id = key
    data.url = `/${getLocale()}/lists/${data.id}`
    data.photos = []

    if (rawResponse[key].images) {
      rawResponse[key].images.forEach(mid => {
        data.photos.push({ id: mid, mid })
      })
    }

    listData.lists.push(data)
  })

  trigger("listManager:load", listData.lists)

  return listData.lists
}

const hasData = () => {
  return !!listData.lists
}

const getLists = async () => {
  if (!listData.lists) {
    await loadListData()
  }
  return listData.lists
}

const getListById = listId => {
  if (listData.lists) {
    return listData.lists.find(item => item.id.toString() === listId.toString())
  }
  return {}
}

const getListBySlug = slug => {
  if (listData.lists) {
    return listData.lists.find(item => slugify(item.name, true) === slug)
  }
  return {}
}

const loadListPhotosData = async listId => {
  const list = getListById(listId)
  const rawPhotosResp = await listsAPI.getListPhotos(listId)

  delete list.extendedPhotoDataLoaded
  list.photos = []

  Object.keys(rawPhotosResp.flags).forEach(key => {
    list.photos.push({ id: rawPhotosResp.flags[key], mid: [Number(rawPhotosResp.flags[key])] })
  })

  trigger("listManager:onPhotosDataLoaded", { listID: listId, photos: list.photos })

  return list.photos
}

const getListPhotos = async listId => {
  const list = getListById(listId)
  return list && list.photos ? list.photos : []
}

const getListPhotoById = (listId, photoId) => {
  const list = getListById(listId)
  if (list && list.photos && list.photos.length > 0) {
    return list.photos.find(photo => Number(photo.id) === Number(photoId))
  }

  return null
}

const loadExtendedListPhotoData = async listId => {
  const list = getListById(listId)
  if (list.photos && !list.extendedPhotoDataLoaded) {
    const resp = await searchAPI.getDataById(list.photos.map(item => item.id))

    if (resp.items && resp.items.length > 0) {
      resp.items.forEach(data => {
        // copy the properties of the loaded data over the stored object
        const photoData = getListPhotoById(listId, data.mid)

        Object.assign(photoData, data)
        photoData.isDataLoaded = true
      })
    }

    list.extendedPhotoDataLoaded = true
  }
}

const selectListById = listId => {
  listData.selectedList = getListById(listId)
  return listData.selectedList
}

const getSelectedListId = () => {
  return listData.selectedList ? listData.selectedList.id : undefined
}

const getSelectedList = () => {
  return listData.selectedList
}

const selectPhotoById = (listId, photoId) => {
  listData.selectedPhoto = getListPhotoById(listId, photoId)
  return listData.selectedPhoto
}

const getSelectedPhoto = () => {
  return listData.selectedPhoto
}

const getSelectedPhotoId = () => {
  return listData.selectedPhoto ? listData.selectedPhoto.id : null
}

const getSelectedPhotoIndex = () => {
  return listData.selectedList && listData.selectedPhoto
    ? listData.selectedList.photos.indexOf(listData.selectedPhoto)
    : -1
}

const selectNextPhoto = () => {
  const i = Math.min(getSelectedPhotoIndex() + 1, listData.selectedList.photos.length - 1)
  return selectPhotoById(listData.selectedList.id, listData.selectedList.photos[i].id)
}

const selectPrevPhoto = () => {
  const i = Math.max(getSelectedPhotoIndex() - 1, 0)
  return selectPhotoById(listData.selectedList.id, listData.selectedList.photos[i].id)
}

const clearAllData = () => {
  // if the context of the search has changed destroy all photo data
  delete listData.lists
  delete listData.selectedList

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

const editList = async (uuid, name, description) => {
  if (uuid && name) {
    const resp = await listsAPI.editList(uuid, name, description)

    // force to reload the list data in the listManager as a list has been deleted
    clearAllData()
    await loadListData()

    return resp
  }
  return { errors: `Missing parameters: ${!uuid ? "uuid, " : ""}${!name ? "name" : ""}` }
}

const deleteList = async uuid => {
  const resp = await listsAPI.deleteList(uuid)

  // force to reload the list data in the listManager as a list has been deleted
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
  const list = getListById(listId)
  const hadExtendedPhotoData = list.extendedPhotoDataLoaded

  const resp = await listsAPI.deleteFromList(photoId, listId)

  // update photo data of the list item
  await loadListPhotosData(listId)

  if (hadExtendedPhotoData) {
    await loadExtendedListPhotoData(listId)
  }

  return resp
}

// return all the lists of the current logged in user that contains a given image
const getContainingLists = async photoId => {
  if (photoId) {
    const containingLists = await listsAPI.getContainingLists(photoId)

    if (containingLists.lists) {
      // make sure we have all the list data loaded before clling getListById
      await getLists()

      const result = []

      Object.keys(containingLists.lists).forEach(key => {
        result.push(getListById(key))
      })

      return result
    }

    return []
  }

  return []
}

export default {
  loadListData,
  hasData,
  getLists,
  getListById,
  getListBySlug,
  loadListPhotosData,
  getListPhotos,
  getListPhotoById,
  loadExtendedListPhotoData,
  selectListById,
  getSelectedListId,
  getSelectedList,
  selectPhotoById,
  getSelectedPhoto,
  getSelectedPhotoId,
  getSelectedPhotoIndex,
  selectNextPhoto,
  selectPrevPhoto,
  clearAllData,
  createList,
  editList,
  deleteList,
  addPhotoToList,
  deletePhotoFromList,
  getContainingLists,
}
