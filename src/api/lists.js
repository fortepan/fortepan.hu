import config from "../data/siteConfig"
import { appState } from "../js/app"

const createList = async (name, description, isPrivate) => {
  const data = {
    name,
    description,
    isPrivate,
  }
  const url = `${appState("is-dev") ? config.DRUPAL_HOST_DEV : config.DRUPAL_HOST}/api/albums/add`
  const resp = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-type": "application/json;charset=UTF-8",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  })

  const respData = await resp.json()
  if (respData && respData.id) {
    return respData.id
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

  const url = `${appState("is-dev") ? config.DRUPAL_HOST_DEV : config.DRUPAL_HOST}/api/albums/delete/${uuid}`

  const resp = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
    },
  })

  return resp
}

const addToList = async (photoId, listId) => {
  const url = `${
    appState("is-dev") ? config.DRUPAL_HOST_DEV : config.DRUPAL_HOST
  }/api/albums/add-to-album/${photoId}/${listId}`

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
  const url = `${appState("is-dev") ? config.DRUPAL_HOST_DEV : config.DRUPAL_HOST}/api/albums/remove-from-album/${photoId}/${listId}`
  // const url = `${appState("is-dev") ? config.DRUPAL_HOST_DEV : config.DRUPAL_HOST}/api/fortepan/unflag/${photoId}/${listId}`

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
  const url = `${appState("is-dev") ? config.DRUPAL_HOST_DEV : config.DRUPAL_HOST}/api/albums`

  const resp = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  })

  const respData = await resp.json()
  return respData
}

const getListPhotos = async id => {
  const url = `${appState("is-dev") ? config.DRUPAL_HOST_DEV : config.DRUPAL_HOST}/api/albums/media-by-album/${id}`
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
  const url = `${appState("is-dev") ? config.DRUPAL_HOST_DEV : config.DRUPAL_HOST}/api/albums/by-user/${photoId}`

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

// ElasticSearch related api calls

const listsElasticRequest = async data => {
  const url = appState("is-dev")
    ? `${config.ELASTIC_HOST_DEV}/elasticsearch_index_fortepandrupaldevelop_cwoou_lists/_search?pretty`
    : `${config.ELASTIC_HOST}/elasticsearch_index_fortepandrupalmain_hd64t_lists/_search?pretty`

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa("reader:r3adm31024read")}`,
      "Content-Type": "application/json;charset=UTF-8",
    },
    body: JSON.stringify(data),
  })

  return resp.json()
}

const listsContentElasticRequest = async data => {
  const url = appState("is-dev")
    ? `${config.ELASTIC_HOST_DEV}/elasticsearch_index_fortepandrupaldevelop_cwoou_list_content/_search?pretty`
    : `${config.ELASTIC_HOST}/api/media/search?pretty`

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa("reader:r3adm31024read")}`,
      "Content-Type": "application/json;charset=UTF-8",
    },
    body: JSON.stringify(data),
  })

  return resp.json()
}

const loadPublicListDataById = async id => {
  return new Promise((resolve, reject) => {
    const body = {
      size: 1,
      query: {
        term: {
          tid: {
            value: id,
          },
        },
      },
    }

    listsElasticRequest(body)
      .then(resp => {
        resolve(resp)
      })
      .catch(err => {
        reject(err)
      })
  })
}

const loadPublicListContentById = async id => {
  return new Promise((resolve, reject) => {
    const body = {
      size: 10000,
      query: {
        term: {
          lista: {
            value: id,
          },
        },
      },
      sort: {
        created: {
          order: "desc",
        },
      },
    }

    listsContentElasticRequest(body)
      .then(resp => {
        resolve(resp)
      })
      .catch(err => {
        reject(err)
      })
  })
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
  loadPublicListDataById,
  loadPublicListContentById,
}
