import config from "../data/siteConfig"

const createList = async name => {
  const authData = JSON.parse(localStorage.getItem("auth")) || {}
  const data = {
    data: {
      type: "taxonomy_term--private",
      attributes: {
        name,
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
  return respData.data.attributes.drupal_internal__tid
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

const getList = async id => {
  const url = `${config.DRUPAL_HOST}/fortepan/flags/${id}/created/desc`
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
  deleteList,
  addToList,
  deleteFromList,
  getLists,
  getList,
}
