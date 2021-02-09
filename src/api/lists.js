import config from "../data/siteConfig"

const createList = name => {
  return new Promise((resolve, reject) => {
    const data = {
      data: {
        type: "taxonomy_term--private",
        attributes: {
          name,
        },
      },
    }

    const xmlHttp = new XMLHttpRequest()
    const authData = JSON.parse(localStorage.getItem("auth")) || {}
    xmlHttp.open("POST", `${config.DRUPAL_HOST}/jsonapi/taxonomy_term/private`, true)
    xmlHttp.setRequestHeader("Content-Type", "application/vnd.api+json")
    xmlHttp.setRequestHeader("Accept", "application/vnd.api+json")
    xmlHttp.setRequestHeader("X-CSRF-Token", authData.csrf_token)
    xmlHttp.withCredentials = true
    xmlHttp.onload = () => {
      if (xmlHttp.status === 200) {
        resolve(JSON.parse(xmlHttp.responseText))
      } else {
        reject()
      }
    }
    xmlHttp.send(JSON.stringify(data))
  })
}

const addToList = (photoId, listId) => {
  return new Promise((resolve, reject) => {
    const data = {
      cimke: tags,
      image: photoId,
    }

    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("POST", `${config.DRUPAL_HOST}/fortepan/${listId}/${photoId}`, true)
    xmlHttp.setRequestHeader("Content-Type", "application/json")
    xmlHttp.setRequestHeader("Accept", "application/json")
    xmlHttp.withCredentials = true
    xmlHttp.onload = () => {
      if (xmlHttp.status === 200) {
        resolve()
      } else {
        reject()
      }
    }
    xmlHttp.send(JSON.stringify(data))
  })
}

const deleteFromList = (photoId, listId) => {
  return new Promise((resolve, reject) => {
    const data = {
      cimke: tags,
      image: photoId,
    }

    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("DELETE", `${config.DRUPAL_HOST}/fortepan/lists`, true)
    xmlHttp.setRequestHeader("Content-Type", "application/json")
    xmlHttp.setRequestHeader("Accept", "application/json")
    xmlHttp.withCredentials = true
    xmlHttp.onload = () => {
      if (xmlHttp.status === 200) {
        resolve()
      } else {
        reject()
      }
    }
    xmlHttp.send(JSON.stringify(data))
  })
}

const getLists = () => {
  return new Promise((resolve, reject) => {
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("GET", `${config.DRUPAL_HOST}/fortepan/lists`, true)
    xmlHttp.setRequestHeader("Content-Type", "application/json")
    xmlHttp.setRequestHeader("Accept", "application/json")
    xmlHttp.withCredentials = true
    xmlHttp.onload = () => {
      if (xmlHttp.status === 200) {
        resolve(JSON.parse(xmlHttp.responseText))
      } else {
        reject()
      }
    }
    xmlHttp.send()
  })
}

export default {
  createList,
  addToList,
  deleteFromList,
  getLists,
}
