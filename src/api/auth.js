import { trigger, setCookie } from "../utils"

const AUTH_HOST = "https://drupal.admin.fortepan.hu"

const signin = (body) => {
  return new Promise((resolve, reject) => {
    const xmlHttp = new XMLHttpRequest()
  xmlHttp.open("POST", `${AUTH_HOST}/user/login?_format=json`, true)
  xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
  xmlHttp.withCredentials = true
  xmlHttp.onload = () => {
    if (xmlHttp.status === 200) {
      const respData = JSON.parse(xmlHttp.responseText)
      localStorage.setItem("auth", xmlHttp.responseText)
      trigger("auth:loggedIn")
      resolve(respData)
    } else {
      reject(xmlHttp.statusText)
    }
  }
  xmlHttp.send(JSON.stringify(body))
  })
}

const signout = (body) => {
  return new Promise((resolve, reject) => {
    const authTokens = JSON.parse(localStorage.getItem("auth"))
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("POST", `${AUTH_HOST}/user/logout?_format=json&token=${authTokens.logout_token}`, true)
    xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
    xmlHttp.setRequestHeader("X-CSRF-Token", authTokens.csrf_token)
    xmlHttp.onload = () => {
      if (xmlHttp.status === 200) {
        const respData = JSON.parse(xmlHttp.responseText)
        console.log(respData)
        localStorage.removeItem("auth")
        trigger("auth:loggedOut")
        resolve(respData)
      } else {
       reject(xmlHttp.statusText)
      }
    }
    xmlHttp.send()
    })
}

const signup = (body) => {
  return new Promise((resolve, reject) => {
  const xmlHttp = new XMLHttpRequest()
  xmlHttp.open("POST", `${AUTH_HOST}/user/register?_format=json`, true)
  xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
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

const forgot = (body) => {
  return new Promise((resolve, reject) => {
  const xmlHttp = new XMLHttpRequest()
  xmlHttp.open("POST", `${AUTH_HOST}/user/password?_format=json`, true)
  xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
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

const checkUserStatus = () => {
  return new Promise((resolve, reject) => {
    const xmlHttp = new XMLHttpRequest()

    xmlHttp.open("GET", `${AUTH_HOST}/user/login_status?_format=json`, true)
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
  checkUserStatus,
  getNewToken,
  queryLists
}
