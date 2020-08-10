import { trigger } from "../utils"
import config from "../config"

const addTag = (tag, photoId) => {
  return new Promise((resolve, reject) => {
    const authData = JSON.parse(localStorage.getItem("auth"))
    const tagData = {
      data: {
        type: "taxonomy_term-cimke",
        attributes: {
          name: tag,
        },
      },
    }
    const tag2ImageData = {
      data: {
        type: "tag2image--tag2image",
        attributes: {},
        relationships: {
          tag: {
            data: {
              type: "taxonomy_term--cimke",
              id: "",
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

    if (authData) {
      trigger("loadingIndicator:show", { id: "LoadingIndicatorBase" })
      fetch(`${config.DRUPAL_HOST}/jsonapi/taxonomy_term/cimke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/vnd.api+json",
          Accept: "application/vnd.api+json",
          "X-CSRF-Token": authData.csrf_token,
        },
        credentials: "include",
        body: JSON.stringify(tagData),
      })
        .then(tagResp => {
          tagResp.json().then(tagRespData => {
            tag2ImageData.data.relationships.tag.data.id = tagRespData.data.id

            fetch(`${config.DRUPAL_HOST}/jsonapi/tag2image/tag2image`, {
              method: "POST",
              headers: {
                "Content-Type": "application/vnd.api+json",
                Accept: "application/vnd.api+json",
                "X-CSRF-Token": authData.csrf_token,
              },
              credentials: "include",
              body: JSON.stringify(tag2ImageData),
            }).then(tag2ImageResp => {
              tag2ImageResp.json().then(tag2ImageRespData => {
                trigger("loadingIndicator:hide", { id: "LoadingIndicatorBase" })
                resolve(tag2ImageRespData)
              })
            })
          })
        })
        .catch(err => {
          trigger("loadingIndicator:hide", { id: "LoadingIndicatorBase" })
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
