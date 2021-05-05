import config from "../data/siteConfig"

const createList = async (name, description) => {
  // TODO: include the description on creating as well once the backend is ready

  const authData = JSON.parse(localStorage.getItem("auth")) || {}
  const data = {
    data: {
      type: "taxonomy_term--private",
      attributes: {
        name,
        description,
      },
    },
  }
  const url = `${config.DRUPAL_HOST}/jsonapi/taxonomy_term/private`
  const resp = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
      "X-CSRF-Token": authData.csrf_token,
    },
    body: JSON.stringify(data),
  })

  const respData = await resp.json()
  if (respData && respData.data && respData.data.attributes && respData.data.attributes.drupal_internal__tid) {
    return respData.data.attributes.drupal_internal__tid
  }

  return 0
}

const editList = async (listId, name, description) => {
  // TODO: implement the backend solution if ready
  return { errors: "Feature is not implemented yet", params: [listId, name, description] }
}

const deleteList = async listId => {
  const authData = JSON.parse(localStorage.getItem("auth")) || {}
  const url = `${config.DRUPAL_HOST}/jsonapi/taxonomy_term/${listId}`
  const resp = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
      "X-CSRF-Token": authData.csrf_token,
    },
  })

  const respData = await resp.json()
  return respData
}

const addToList = async (photoId, listId) => {
  const url = `${config.DRUPAL_HOST}/fortepan/flag/${photoId}/${listId}`
  const resp = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })

  const respData = await resp.json()
  return respData
}

const deleteFromList = async (photoId, listId) => {
  const url = `${config.DRUPAL_HOST}/fortepan/unflag/${photoId}/${listId}`
  const resp = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })

  const respData = await resp.json()
  return respData
}

const getLists = async () => {
  const url = `${config.DRUPAL_HOST}/fortepan/lists`
  const resp = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })

  const respData = await resp.json()
  return respData.listak
}

const getListPhotos = async id => {
  const url = `${config.DRUPAL_HOST}/fortepan/flags/${id}/created/asc`
  const resp = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })

  const respData = await resp.json()
  return respData
}

// return all the lists of the current logged in user that contains a given image
const getContainingLists = async photoId => {
  // TODO
  return photoId
}

export default {
  createList,
  editList,
  deleteList,
  addToList,
  deleteFromList,
  getLists,
  getListPhotos,
  getContainingLists,
}
