const collectionData = {}

const loadCollectionData = async () => {
  const url = `/photo_uploads.json`

  const resp = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })

  collectionData.data = await resp.json()
}

const getCollections = async () => {
  if (!collectionData.data || (collectionData.data && !collectionData.data.uploads)) {
    await loadCollectionData()
  }

  return collectionData.data.uploads
}

const getCollection = async date => {
  if (date) {
    if (!collectionData.data || (collectionData.data && !collectionData.data.uploads)) {
      await loadCollectionData()
    }

    let dateInstance = new Date(date)
    if (!dateInstance.getTime()) dateInstance = new Date(parseInt(date, 10))

    return collectionData.data.uploads.find(
      collection => new Date(collection.date).getTime() === dateInstance.getTime()
    )
  }

  return undefined
}

export default {
  getCollections,
  getCollection,
}
