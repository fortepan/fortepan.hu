import { trigger } from "./utils"
import searchAPI from "../api/search"

// creating a context object to store the latest request parameters and results
const photoData = {}

const loadPhotoData = async (params, silent, lockContext) => {
  // saving the last search context
  if (!lockContext) {
    photoData.context = params
  }

  const resp = await searchAPI.search(params)

  // storing the items so it can be accessed later
  if (!photoData.result) {
    photoData.result = {}
  }

  if (photoData.result.items) {
    if (params && params.reverseOrder) {
      // prepend the results one by one as they are in reverse order
      resp.items.forEach(item => {
        photoData.result.items.unshift(item)
      })
      // then everse the order back to store later as a normal set
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
  if (!lockContext && resp.years) {
    // load the total aggregated years if id is present
    if (params.id && resp.years.length === 1) {
      const yearsResp = await searchAPI.getAggregatedYears()
      photoData.result.years = yearsResp.years
    } else {
      photoData.result.years = resp.years
    }
  }

  const result = { items: photoData.result.latestItems, total: photoData.result.total, years: photoData.result.years }

  if (!silent) {
    // dispatch an event that new photos have been loaded in the search context
    trigger("photoManager:load", result)
  }

  return result
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

const setSelectedPhoto = id => {
  photoData.selectedId = id
  photoData.selectedItem = getPhotoDataByID(id)
  photoData.selectedIndex = getPhotoIndexByID(id)

  const result = { id: photoData.selectedId, data: photoData.selectedItem, index: photoData.selectedIndex }

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

const selectNextPhoto = async () => {
  if (photoData.selectedIndex !== -1) {
    // check first if we reached the absolute last picture of the current search context
    // look for the photo data of the last year
    const end = photoData.result.items.filter(
      item => parseInt(item.year, 10) === parseInt(photoData.result.years[photoData.result.years.length - 1].year, 10)
    )
    // then check if we have the photo data stored and the very first one is actually the selected one
    // if so, return the whole function, no need to go further
    if (
      end &&
      end.length === photoData.result.years[photoData.result.years.length - 1].count &&
      parseInt(end[end.length - 1].mid, 10) === parseInt(photoData.selectedId, 10)
    ) {
      return
    }

    // if no match continue on
    const nextIndex = photoData.selectedIndex + 1

    if (nextIndex < photoData.result.items.length) {
      const data = photoData.result.items[nextIndex]
      setSelectedPhoto(data.mid)

      // dispatching a new event when the next photo is selected
      trigger("photoManager:nextSelected", {
        id: getSelectedPhotoId(),
        data: getSelectedPhotoData(),
        index: getSelectedPhotoIndex(),
      })
    } else {
      // if there's more photos in the search context that haven't been loaded yet
      // load a new set of max 40 photos, and try selecting the next photo again
      const params = {
        search_after: getLastPhotoData().search_after,
      }
      Object.assign(params, photoData.context)

      // remove the id if it was present
      if (params.id > 0) delete params.id

      const lockContext = true

      const result = await loadPhotoData(params, false, lockContext)

      if (result.items && result.items.length) {
        // select the first photo in the newly loaded and appended set
        setSelectedPhoto(result.items[0].mid)

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

const selectPrevPhoto = async () => {
  if (photoData.selectedIndex !== -1) {
    // check first if we reached the absolute first picture of the current search context
    // look for the photo data of the first year
    const start = photoData.result.items.filter(
      item => parseInt(item.year, 10) === parseInt(photoData.result.years[0].year, 10)
    )
    // then check if we have the photo data stored and the very first one is actually the selected one
    // if so, return the whole function, no need to go further
    if (
      start &&
      start.length === photoData.result.years[0].count &&
      parseInt(start[0].mid, 10) === parseInt(photoData.selectedId, 10)
    ) {
      return
    }

    // if no match continue on
    const prevIndex = photoData.selectedIndex - 1

    if (prevIndex >= 0) {
      const data = photoData.result.items[prevIndex]
      // select the proper photo
      setSelectedPhoto(data.mid)

      // dispatching a new event when the prev photo is selected
      trigger("photoManager:prevSelected", {
        id: getSelectedPhotoId(),
        data: getSelectedPhotoData(),
        index: getSelectedPhotoIndex(),
      })
    } else {
      // if there's more photos in the search context that haven't been loaded yet
      // load a new set of previous max 40 photos, and try selecting the prev photo again

      const params = {
        search_after: getFirstPhotoData().search_after,
        reverseOrder: true,
      }
      Object.assign(params, photoData.context)

      // remove the id if it was present
      if (params.id > 0) delete params.id

      const lockContext = true

      const result = await loadPhotoData(params, false, lockContext)

      if (result.items && result.items.length) {
        // select the last photo in the newly loaded and prepended set
        setSelectedPhoto(result.items[result.items.length - 1].mid)

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
  // if the year of the search has changed flush the cached search results
  delete photoData.result.items

  const params = {}
  Object.assign(params, photoData.context)

  trigger("photoManager:cacheCleared", { context: params })
}

const selectFirstPhotoInYear = async y => {
  const data = photoData.result.items.find(item => parseInt(item.year, 10) === parseInt(y, 10))

  // check if we have the photo data loaded for the given year
  if (data) {
    // if we have the photo data
    setSelectedPhoto(data.mid)

    // dispatching a new event when the next photo is selected
    trigger("photoManager:firstInYearSelected", {
      id: getSelectedPhotoId(),
      data: getSelectedPhotoData(),
      index: getSelectedPhotoIndex(),
    })
  } else {
    // load the photo data for the year
    // first, clear the loaded photo data cahce fors (with keeping the current search context)
    clearPhotoCache()

    // then prepeare the search parameters in the given context
    // get default and search query params
    const params = {
      from: 0,
      year: y,
    }
    Object.assign(params, photoData.context)

    // remove the id if it was present
    if (params.id > 0) delete params.id

    // delete the search after param if it was copied over from the default context
    if (params.search_after) delete params.search_after

    // lock the previous context, so this search won't overwrite it
    // (we just need the first picture of a given year in the same search context)
    const lockContext = true

    await loadPhotoData(params, false, lockContext)

    selectFirstPhotoInYear(y)
  }
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
  getSelectedPhotoId,
  getSelectedPhotoData,
  getSelectedPhotoIndex,
  setSelectedPhoto,
  getPhotoDataByID,
  selectNextPhoto,
  selectPrevPhoto,
  getFirstPhotoData,
  getLastPhotoData,
  getYearsInContext,
  getFirstYearInContext,
  getLastYearInContext,
  selectFirstPhotoInYear,
  clearPhotoCache,
  clearAllData,
}
