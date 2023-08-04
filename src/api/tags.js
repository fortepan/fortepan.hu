import config from "../data/siteConfig"
import { appState } from "../js/app"

const addTags = async (tags, photoId) => {
  const data = {
    cimke: tags,
    image: photoId,
  }

  const url = `${appState("is-dev") ? config().DRUPAL_HOST_DEV : config().DRUPAL_HOST}/fortepan/cimke`
  const resp = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  })

  const respData = resp.json()
  return respData
}

const getPendingTags = async photoId => {
  const url = `${appState("is-dev") ? config().DRUPAL_HOST_DEV : config().DRUPAL_HOST}/fortepan/cimke/list/?${photoId}`
  const resp = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })

  const respData = resp.json()
  return respData
}

export default {
  addTags,
  getPendingTags,
}
