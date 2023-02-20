const collectionData = {}

const loadCollectionData = async () => {
  const url = `/photo_collections.json`

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
  if (!collectionData.data || (collectionData.data && !collectionData.data.collections)) {
    await loadCollectionData()
  }

  return collectionData.data.collections
}

const getCollection = async date => {
  if (date) {
    if (!collectionData.data || (collectionData.data && !collectionData.data.collections)) {
      await loadCollectionData()
    }

    return collectionData.data.collections.find(collection => collection.date === date)
  }

  return undefined
}

export default {
  getCollections,
  getCollection,
}
