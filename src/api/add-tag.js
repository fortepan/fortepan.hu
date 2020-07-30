import config from "../config"
import auth from "../api/auth"

const saveTag = tag => {
  return new Promise((resolve, reject) => {
    const data = {
      data: {
        type: "taxonomy_term-cimke",
        attributes: {
          name: tag,
        },
      },
    }

    auth.getToken().then(csrfToken => {
      const xmlHttp = new XMLHttpRequest()
      xmlHttp.open("POST", `${config.DRUPAL_HOST}/jsonapi/taxonomy_term/cimke`, true)
      xmlHttp.setRequestHeader("X-CSRF-Token", csrfToken)
      xmlHttp.setRequestHeader("Content-Type", "application/vnd.api+json")
      xmlHttp.setRequestHeader("Accept", "application/vnd.api+json")
      xmlHttp.withCredentials = true
      xmlHttp.onload = () => {
        if (xmlHttp.status === 204) {
          resolve(JSON.parse(xmlHttp.responseText))
        } else {
          const respData = JSON.parse(xmlHttp.responseText)
          reject(respData.message.replace(/(?:\r\n|\r|\n)/g, "<br />"))
        }
      }
      xmlHttp.error = err => {
        reject(err)
      }
      xmlHttp.send(JSON.stringify(data))
    })
  })
}

const assignTagWithPhoto = (tagId, photoId) => {
  return new Promise((resolve, reject) => {
    const data = {
      data: {
        type: "tag2image--tag2image",
        attributes: {},
        relationships: {
          tag: {
            data: {
              type: "taxonomy_term--cimke",
              id: tagId,
            },
          },
          image: {
            data: {
              type: "media--image",
              id: photoId,
            },
          },
        },
      },
    }

    const authData = JSON.parse(localStorage.getItem("auth"))

    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("POST", `${config.DRUPAL_HOST}/jsonapi/tag2image/tag2image`, true)
    // xmlHttp.setRequestHeader("X-CSRF-Token", authData.csrf_token)
    xmlHttp.setRequestHeader("Content-Type", "application/vnd.api+json")
    xmlHttp.setRequestHeader("Accept", "application/vnd.api+json")
    xmlHttp.withCredentials = true
    xmlHttp.onload = () => {
      const respData = JSON.parse(xmlHttp.responseText)
      if (xmlHttp.status === 200) {
        console.log(respData)
        resolve(respData.data.id)
      } else {
        reject(respData.message.replace(/(?:\r\n|\r|\n)/g, "<br />"))
      }
    }
    xmlHttp.error = err => {
      reject(err)
    }
    xmlHttp.send(JSON.stringify(data))
  })
}

const addTag = (tag, photoId) => {
  return new Promise((resolve, reject) => {
    const authData = JSON.parse(localStorage.getItem("auth"))

    if (authData) {
      saveTag(tag)
        .then(tagId => {
          assignTagWithPhoto(tagId, photoId).then(() => {
            resolve()
          })
        })
        .catch(err => {
          reject(err)
        })
    } else {
      // eslint-disable-next-line prefer-promise-reject-errors
      reject("Új kulcsszó hozzáadásához kérjük lépjen be.")
    }
  })
}

export default {
  addTag,
}
