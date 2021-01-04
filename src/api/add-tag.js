import config from "../data/siteConfig"

export default (tags, photoId) => {
  return new Promise((resolve, reject) => {
    const data = {
      cimke: tags,
      image: photoId,
    }

    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("POST", `${config.DRUPAL_HOST}/fortepan/cimke`, true)
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
