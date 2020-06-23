import { trigger } from "../utils"

const AUTH_HOST = "/auth-api"

const signin = body => {
  return new Promise((resolve, reject) => {
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("POST", `${AUTH_HOST}/user/login?_format=json`, true)
    xmlHttp.setRequestHeader("Content-Type", "application/json")
    xmlHttp.onload = () => {
      if (xmlHttp.status === 200) {
        const respData = JSON.parse(xmlHttp.responseText)
        localStorage.setItem("auth", xmlHttp.responseText)
        console.log(xmlHttp.getResponseHeader("Set-Cookie"))
        trigger("auth:loggedIn")
        resolve(respData)
      } else {
        reject(xmlHttp.statusText)
      }
    }
    xmlHttp.send(JSON.stringify(body))
  })
}

const signout = () => {
  return new Promise((resolve, reject) => {
    const authTokens = JSON.parse(localStorage.getItem("auth"))
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("POST", `${AUTH_HOST}/user/logout?_format=json&token=${authTokens.logout_token}`, true)
    xmlHttp.setRequestHeader("Content-Type", "application/json")
    xmlHttp.setRequestHeader("X-CSRF-Token", authTokens.csrf_token)
    xmlHttp.withCredentials = true
    xmlHttp.onload = () => {
      if (xmlHttp.status === 200) {
        const respData = JSON.parse(xmlHttp.responseText)
        trigger("auth:loggedOut")
        resolve(respData)
      } else {
        reject(xmlHttp.statusText)
      }
    }
    xmlHttp.send()
  })
}

const signup = body => {
  return new Promise((resolve, reject) => {
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("POST", `${AUTH_HOST}/user/register?_format=json`, true)
    xmlHttp.setRequestHeader("Content-Type", "application/json")
    xmlHttp.onload = () => {
      if (xmlHttp.status === 200) {
        resolve(JSON.parse(xmlHttp.responseText))
      } else {
        reject(xmlHttp.statusText)
      }
    }
    xmlHttp.send(JSON.stringify(body))
  })
}

const forgot = body => {
  return new Promise((resolve, reject) => {
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("POST", `${AUTH_HOST}/user/password?_format=json`, true)
    xmlHttp.setRequestHeader("Content-Type", "application/json")
    xmlHttp.withCredentials = true
    xmlHttp.onload = () => {
      if (xmlHttp.status === 200) {
        resolve(JSON.parse(xmlHttp.responseText))
      } else {
        reject(xmlHttp.statusText)
      }
    }
    xmlHttp.send(JSON.stringify(body))
  })
}

const queryUser = () => {
  return new Promise((resolve, reject) => {
    const authTokens = JSON.parse(localStorage.getItem("auth"))

    // http://example.com/user/1?_format=json

    if (authTokens && authTokens.current_user.uid) {
      const xmlHttp = new XMLHttpRequest()
      xmlHttp.open("GET", `${AUTH_HOST}/user/${authTokens.current_user.uid}?_format=json`, true)
      xmlHttp.onload = () => {
        if (xmlHttp.status === 200) {
          resolve(JSON.parse(xmlHttp.responseText))
        } else {
          reject(xmlHttp.statusText)
        }
      }
      xmlHttp.send()
    } else {
      reject("User is not logged in")
    }
  })
}

const getNewToken = () => {
  return new Promise((resolve, reject) => {
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("GET", `${AUTH_HOST}/session/token`, true)
    xmlHttp.setRequestHeader("Content-Type", "application/vnd.api+json")
    xmlHttp.withCredentials = true
    xmlHttp.onload = () => {
      if (xmlHttp.status === 200) {
        resolve(xmlHttp.responseText)
      } else {
        reject(xmlHttp.statusText)
      }
    }
    xmlHttp.send()
  })
}

const queryLists = () => {
  return new Promise((resolve, reject) => {
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("GET", `${AUTH_HOST}/jsonapi/taxonomy_term/private`, true)
    xmlHttp.setRequestHeader("Content-Type", "application/vnd.api+json")
    xmlHttp.withCredentials = true
    xmlHttp.onload = () => {
      if (xmlHttp.status === 200) {
        resolve(xmlHttp.responseText)
      } else {
        reject(xmlHttp.statusText)
      }
    }
    xmlHttp.send()
  })
}

export default {
  signin,
  signup,
  signout,
  forgot,
  queryUser,
  getNewToken,
  queryLists,
}
