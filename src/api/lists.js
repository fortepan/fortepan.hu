import config from "../data/siteConfig"
import { appState } from "../js/app"

const createList = async (name, description) => {
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
  const url = `${appState("is-dev") ? config.DRUPAL_HOST_DEV : config.DRUPAL_HOST}/jsonapi/taxonomy_term/private`
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

  return null
}

const editList = async (uuid, name, description) => {
  const authData = JSON.parse(localStorage.getItem("auth")) || {}
  const data = {
    data: {
      type: "taxonomy_term--private",
      id: uuid,
      attributes: {
        name,
        description,
      },
    },
  }

  const url = `${
    appState("is-dev") ? config.DRUPAL_HOST_DEV : config.DRUPAL_HOST
  }/jsonapi/taxonomy_term/private/${uuid}`

  const resp = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
      "X-CSRF-Token": authData.csrf_token,
    },
    body: JSON.stringify(data),
  })

  const respData = await resp.json()

  return respData
}

const deleteList = async uuid => {
  const authData = JSON.parse(localStorage.getItem("auth")) || {}

  const url = `${
    appState("is-dev") ? config.DRUPAL_HOST_DEV : config.DRUPAL_HOST
  }/jsonapi/taxonomy_term/private/${uuid}`

  const resp = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
      "X-CSRF-Token": authData.csrf_token,
    },
  })

  return resp
}

const addToList = async (photoId, listId) => {
  const url = `${appState("is-dev") ? config.DRUPAL_HOST_DEV : config.DRUPAL_HOST}/fortepan/flag/${photoId}/${listId}`

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
  const url = `${appState("is-dev") ? config.DRUPAL_HOST_DEV : config.DRUPAL_HOST}/fortepan/unflag/${photoId}/${listId}`

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
  const url = `${appState("is-dev") ? config.DRUPAL_HOST_DEV : config.DRUPAL_HOST}/fortepan/lists/created/desc`

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

const getListPhotos = async id => {
  const url = `${appState("is-dev") ? config.DRUPAL_HOST_DEV : config.DRUPAL_HOST}/fortepan/flags/${id}/created/asc`
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
  const url = `${
    appState("is-dev") ? config.DRUPAL_HOST_DEV : config.DRUPAL_HOST
  }/fortepan/lists/created/desc/${photoId}`

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
