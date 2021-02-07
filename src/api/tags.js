import config from "../data/siteConfig"

const addTags = async (tags, photoId) => {
  const data = {
    cimke: tags,
    image: photoId,
  }

  const url = `${config.DRUPAL_HOST}/fortepan/cimke`
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
  const url = `${config.DRUPAL_HOST}/fortepan/cimke/list/?${photoId}`
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
