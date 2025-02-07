import config from "../data/siteConfig"
import { lang, trigger, setPageMeta } from "./utils"
import searchAPI from "../api/search"

// Temp location data - TODO: refactor and remove later ↓
const locationData = {}

const loadLocationData = async () => {
  const url = `/temp_locations.json`

  const resp = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })

  locationData.data = await resp.json()
}
// Temp location data - TODO: refactor and remove later ↑

// creating a context object to store the latest request parameters and results
const photoData = {}

const loadPhotoData = async (params, silent, lockContext) => {
  // saving the last search context
  if (!lockContext) {
    photoData.context = {}

    // copy the params instead of just referencing the params object with direct assignment
    Object.assign(photoData.context, params)

    // remove the reverse order flag to not to mistakenly save in to the cached context
    // (can cause trubles with requests with lockContext)
    delete photoData.context.reverseOrder

    // delete the id flag as it also messes up loading more pics of the context
    delete photoData.context.id
  }

  const resp = await searchAPI.search(params)

  // storing the items so it can be accessed later
  if (!photoData.result) {
    photoData.result = {}
    // Temp location data - TODO: refactor and remove later
    await loadLocationData()
  }

  if (photoData.result.items) {
    if (params && params.reverseOrder) {
      // prepend the results one by one as they are in reverse order
      resp.items.forEach(item => {
        photoData.result.items.unshift(item)
      })
      // then reverse the order back to store later as a normal set
      resp.items.reverse()
    } else {
      // add the new results to the end
      photoData.result.items = photoData.result.items.concat(resp.items)
    }
  } else if (resp.items) {
    photoData.result.items = [].concat(resp.items)
  } else {
    photoData.result.items = []
  }

  // storing the latest loaded set as well
  photoData.result.latestItems = resp.items

  // storing the total number
  if (!lockContext && resp.total) {
    photoData.result.total = resp.total
  }

  // storing the aggregated years (photo count per all year in search range) in the results
  // -- only once per search context
  if (!photoData.result.years || !photoData.result.total || (!lockContext && resp.years)) {
    // load the total aggregated years if id or year is present (in wich case there's only one year loaded)
    if (!resp.years || resp.years.length <= 1) {
      const contextParams = {}
      Object.assign(contextParams, params)
      delete contextParams.id
      delete contextParams.year

      const contextResp = await searchAPI.search(contextParams)

      photoData.result.years = contextResp.years
      if (!photoData.result.total || !params.year) {
        photoData.result.total = contextResp.total
      }
    } else {
      photoData.result.years = resp.years
    }
  }

  // Temp location data - TODO: refactor and remove later ↓
  photoData.result.items.forEach(imgData => {
    if (!imgData.locations) {
      imgData.locations = locationData.data.find(obj => obj.mid.toString() === imgData.mid.toString())?.locations
    }
  })
  // Temp location data - TODO: refactor and remove later ↑

  const result = {
    items: photoData.result.latestItems,
    total: photoData.result.total,
    years: photoData.result.years,
    reverseOrder: params && params.reverseOrder,
  }

  if (!silent) {
    // dispatch an event that new photos have been loaded in the search context
    trigger("photoManager:load", result)
  }

  return result
}

const hasData = () => {
  return photoData.result && photoData.result.items && photoData.result.items.length
}

const getData = () => {
  return photoData
}

const getPhotoDataByID = id => {
  let data = null
  if (photoData.result && photoData.result.items && photoData.result.items.length) {
    data = photoData.result.items.find(item => parseInt(item.mid, 10) === parseInt(id, 10))
  }
  return data
}

const getPhotoIndexByID = id => {
  if (photoData.result && photoData.result.items && photoData.result.items.length) {
    return photoData.result.items.findIndex(item => parseInt(item.mid, 10) === parseInt(id, 10))
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

const selectPhotoById = id => {
  photoData.selectedId = id
  photoData.selectedItem = getPhotoDataByID(id)
  photoData.selectedIndex = getPhotoIndexByID(id)

  const result = { id: photoData.selectedId, data: photoData.selectedItem, index: photoData.selectedIndex }

  // set html page meta for social sharing
  setPageMeta(
    `#${result.data.mid}`,
    `${result.data.description ? `${result.data.description} — ` : ""}${lang("donor")}: ${result.data.donor} (${
      result.data.year
    })`,
    `${config().PHOTO_SOURCE}${result.data.mid}.jpg`
  )

  trigger("photoManager:photoSelected", result)

  return result
}

const getFirstPhotoData = () => {
  if (photoData.result && photoData.result.items && photoData.result.items.length) {
    return photoData.result.items[0]
  }
  return null
}

const getLastPhotoData = () => {
  if (photoData.result && photoData.result.items && photoData.result.items.length) {
    return photoData.result.items[photoData.result.items.length - 1]
  }
  return null
}

// load more photos without changing the current search context
const loadMorePhotoDataInContext = async (insertBefore = false) => {
  const params = {}
  Object.assign(params, photoData.context)

  if (insertBefore) {
    params.search_after = getFirstPhotoData().search_after
    params.reverseOrder = true
  } else {
    params.search_after = getLastPhotoData().search_after
  }

  // remove the id if it was present
  if (params.id > 0) delete params.id

  const lockContext = true

  const result = await loadPhotoData(params, false, lockContext)

  return result
}

const getLastPhotoDataInContext = () => {
  if (hasData()) {
    const lastYear =
      photoData.context && photoData.context.year > 0
        ? photoData.result.years.find(item => parseInt(item.year, 10) === parseInt(photoData.context.year, 10))
        : photoData.result.years[photoData.result.years.length - 1]

    // check if we have the data of the absolute last picture of the current search context
    // look for the photo data of the last year
    const end = photoData.result.items.filter(item => parseInt(item.year, 10) === parseInt(lastYear.year, 10))

    if (end && end.length === lastYear.count) {
      return { id: end[end.length - 1].mid, data: end[end.length - 1] }
    }
  }

  return null
}

const selectNextPhoto = async () => {
  if (photoData.selectedIndex !== -1) {
    // check first if we reached the absolute last picture of the current search context
    // and if it is actually the selected photo
    if (
      getLastPhotoDataInContext() &&
      parseInt(getLastPhotoDataInContext().id, 10) === parseInt(photoData.selectedId, 10)
    ) {
      // if so, return the whole function, no need to go further
      return
    }

    // if no match continue on
    const nextIndex = photoData.selectedIndex + 1

    if (nextIndex < photoData.result.items.length) {
      const data = photoData.result.items[nextIndex]
      selectPhotoById(data.mid)

      // dispatching a new event when the next photo is selected
      trigger("photoManager:nextSelected", {
        id: getSelectedPhotoId(),
        data: getSelectedPhotoData(),
        index: getSelectedPhotoIndex(),
      })
    } else {
      // if there's more photos in the search context that haven't been loaded yet
      // load a new set of max 40 photos, and try selecting the next photo again
      const result = await loadMorePhotoDataInContext()

      if (result.items && result.items.length) {
        // select the first photo in the newly loaded and appended set
        selectPhotoById(result.items[0].mid)

        // dispatching a new event when the next photo is selected
        trigger("photoManager:nextSelected", {
          id: getSelectedPhotoId(),
          data: getSelectedPhotoData(),
          index: getSelectedPhotoIndex(),
        })
      }
    }
  }
}

const getFirstPhotoDataInContext = () => {
  if (hasData()) {
    const firstYear =
      photoData.context && photoData.context.year > 0
        ? photoData.result.years.find(item => parseInt(item.year, 10) === parseInt(photoData.context.year, 10))
        : photoData.result.years[0]

    // check if we have the data of the absolute first picture of the current search context
    // look for the photo data of the first year
    const start = photoData.result.items.filter(item => parseInt(item.year, 10) === parseInt(firstYear.year, 10))

    if (
      (photoData.context && photoData.context.year && start && start.length) ||
      (start && start.length === firstYear.count)
    ) {
      return { id: start[0].mid, data: start[0] }
    }

    return null
  }

  return null
}

const selectPrevPhoto = async () => {
  if (photoData.selectedIndex !== -1) {
    // check first if we reached the absolute last picture of the current search context
    // and if it is actually the selected photo
    if (
      getFirstPhotoDataInContext() &&
      parseInt(getFirstPhotoDataInContext().id, 10) === parseInt(photoData.selectedId, 10)
    ) {
      // if so, return the whole function, no need to go further
      return
    }

    // if no match continue on
    const prevIndex = photoData.selectedIndex - 1

    if (prevIndex >= 0) {
      const data = photoData.result.items[prevIndex]
      // select the proper photo
      selectPhotoById(data.mid)

      // dispatching a new event when the prev photo is selected
      trigger("photoManager:prevSelected", {
        id: getSelectedPhotoId(),
        data: getSelectedPhotoData(),
        index: getSelectedPhotoIndex(),
      })
    } else {
      // if there's more photos in the search context that haven't been loaded yet
      // load a new set of previous max 40 photos, and try selecting the prev photo again
      const insertBefore = true
      const result = await loadMorePhotoDataInContext(insertBefore)

      if (result.items && result.items.length) {
        // select the last photo in the newly loaded and prepended set
        selectPhotoById(result.items[result.items.length - 1].mid)

        // dispatching a new event when the prev photo is selected
        trigger("photoManager:prevSelected", {
          id: getSelectedPhotoId(),
          data: getSelectedPhotoData(),
          index: getSelectedPhotoIndex(),
        })
      }
    }
  }
}

const getNextPhotoId = async () => {
  if (photoData.selectedIndex !== -1) {
    // check first if we reached the absolute last picture of the current search context
    // and if it is actually the selected photo
    if (getLastPhotoDataInContext() && getLastPhotoDataInContext().id.toString() === photoData.selectedId.toString()) {
      // this is the last photo in the context, no next one
      return null
    }

    // if no match continue on
    const nextIndex = photoData.selectedIndex + 1

    if (nextIndex < photoData.result.items.length) {
      return parseInt(photoData.result.items[nextIndex].mid, 10)
    }

    // if there's more photos in the search context that haven't been loaded yet
    // load a new set of max 40 photos, and try selecting the next photo again
    const result = await loadMorePhotoDataInContext()

    // this is changing the current index positition, so we need to fix this
    photoData.selectedIndex = getPhotoIndexByID(photoData.selectedId)

    if (result.items && result.items.length) {
      return parseInt(result.items[0].mid, 10)
    }

    return null
  }

  return null
}

const getPrevPhotoId = async () => {
  if (photoData.selectedIndex !== -1) {
    // check first if we reached the absolute last picture of the current search context
    // and if it is actually the selected photo
    if (
      getFirstPhotoDataInContext() &&
      getFirstPhotoDataInContext().id.toString() === photoData.selectedId.toString()
    ) {
      // this is the first in the context, no previous one
      return null
    }

    // if no match continue on
    const prevIndex = photoData.selectedIndex - 1

    if (prevIndex >= 0) {
      return parseInt(photoData.result.items[prevIndex].mid, 10)
    }

    // if there's more photos in the search context that haven't been loaded yet
    // load a new set of previous max 40 photos, and try selecting the prev photo again
    const insertBefore = true
    const result = await loadMorePhotoDataInContext(insertBefore)

    // this is changing the current index positition, so we need to fix this
    photoData.selectedIndex = getPhotoIndexByID(photoData.selectedId)

    if (result.items && result.items.length) {
      return parseInt(result.items[result.items.length - 1].mid, 10)
    }

    return null
  }

  return null
}

const getYearsInContext = () => {
  if (photoData.result && photoData.result.years) {
    return photoData.result.years
  }
  return []
}

const getFirstYearInContext = () => {
  if (photoData.result && photoData.result.years && photoData.result.years.length > 0) {
    return {
      year: photoData.result.years[0].year,
      count: photoData.result.years[0].count,
    }
  }
  return { year: 0, count: 0 }
}

const getLastYearInContext = () => {
  if (photoData.result && photoData.result.years && photoData.result.years.length > 0) {
    return {
      year: photoData.result.years[photoData.result.years.length - 1].year,
      count: photoData.result.years[photoData.result.years.length - 1].count,
    }
  }
  return { year: 0, count: 0 }
}

const clearPhotoCache = () => {
  if (photoData && photoData.result) {
    // if the year of the search has changed flush the cached search results
    delete photoData.result.items

    const params = {}
    Object.assign(params, photoData.context)

    trigger("photoManager:cacheCleared", { context: params })
  }
}

const hasPhotoDataOfYear = (y, matchAll = false) => {
  if (
    photoData.result &&
    photoData.result.items &&
    photoData.result.items.length &&
    photoData.result.items.find(item => parseInt(item.year, 10) === parseInt(y, 10)) &&
    // strict check: should we have all of the year's data?
    (!matchAll ||
      (matchAll &&
        photoData.result.items.filter(item => parseInt(item.year, 10) === parseInt(y, 10)).length ===
          photoData.result.years.find(item => parseInt(item.year, 10) === parseInt(y, 10)).count))
  ) {
    return true
  }
  return false
}

const getFirstPhotoOfYear = async (y, selectAfterLoad = true) => {
  if (hasPhotoDataOfYear(y)) {
    // check if we have the photo data loaded for the given year
    const data = photoData.result.items.find(item => parseInt(item.year, 10) === parseInt(y, 10))

    // if we have the photo data
    selectPhotoById(data.mid)

    // dispatching a new event when the next photo is selected
    trigger("photoManager:firstInYearSelected", {
      id: getSelectedPhotoId(),
      data: getSelectedPhotoData(),
      index: getSelectedPhotoIndex(),
    })

    return true
  }

  // if no photo data loaded for the given year
  // load the photo data for the year
  // first, clear the loaded photo data cache (with keeping the current search context)
  clearPhotoCache()

  /*
    1. load the first image of the given year...
  */
  const params = {
    from: 0,
    year: y,
  }
  Object.assign(params, photoData.context)

  // remove the id if it was present
  if (params.id > 0) delete params.id
  // delete the search after param if it was copied over from the default context
  if (params.search_after) delete params.search_after

  params.size = config().THUMBNAILS_QUERY_LIMIT

  // lock the previous context, so this search won't overwrite it
  // (we just need the first picture of a given year in the same search context)
  const silent = true
  const lockContext = true

  // load the photos in silent mode (no event dispatched)
  let resp = await loadPhotoData(params, silent, lockContext)
  let latestItems = [].concat(resp.items)

  /*
    2. then, based on the first image data load the rest of the set according to the default query limit
  */
  if (latestItems.length !== -1 && latestItems.length < config().THUMBNAILS_QUERY_LIMIT) {
    delete params.from
    delete params.year
    params.size = config().THUMBNAILS_QUERY_LIMIT - latestItems.length
    params.search_after = latestItems[latestItems.length - 1].search_after

    // load the remaining photos in silent mode (no event dispatched)
    resp = await loadPhotoData(params, silent, lockContext)
    latestItems = [].concat(latestItems, resp.items)
  }

  // dispatch an event that new photos have been loaded in the search context
  trigger("photoManager:load", {
    items: latestItems,
    total: photoData.result.total,
    years: photoData.result.years,
    reverseOrder: params && params.reverseOrder,
  })

  if (selectAfterLoad) {
    await getFirstPhotoOfYear(y, selectAfterLoad)
  }

  return true
}

const getTotalPhotoCountInContext = () => {
  return photoData.result.total
}

const getLatestSearchContext = () => {
  // create a copy of the objext to avoid modification elsewhere
  const context = {}
  Object.assign(context, photoData.context)

  return context
}

const clearAllData = () => {
  // if the context of the search has changed destroy all photo data
  delete photoData.context
  delete photoData.result
  delete photoData.selectedId
  delete photoData.selectedItem
  delete photoData.selectedIndex

  trigger("photoManager:allDataCleared")
}

export default {
  loadPhotoData,
  hasData,
  getData,
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
  clearPhotoCache,
  clearAllData,
  getNextPhotoId,
  getPrevPhotoId,
}
