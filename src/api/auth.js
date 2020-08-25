import { trigger } from "../utils"
import config from "../config"

const setLoginStatus = isUserSignedIn => {
  if (isUserSignedIn) {
    trigger("auth:signedIn")
    document.querySelector("body").classList.add("auth-signed-in")
  } else {
    trigger("auth:signedOut")
    document.querySelector("body").classList.remove("auth-signed-in")
    localStorage.removeItem("auth")
  }
}

const getCSRFToken = () => {
  return new Promise((resolve, reject) => {
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("GET", `${config.DRUPAL_HOST}/session/token`, true)
    xmlHttp.setRequestHeader("Content-Type", "application/vnd.api+json")
    xmlHttp.setRequestHeader("Accept", "application/vnd.api+json")
    xmlHttp.withCredentials = true
    xmlHttp.onload = () => {
      if (xmlHttp.status === 200) {
        resolve(xmlHttp.responseText)
      } else {
        const respData = JSON.parse(xmlHttp.responseText)
        reject(respData.message)
      }
    }
    xmlHttp.send()
  })
}

const signout = async () => {
  return new Promise((resolve, reject) => {
    const authData = JSON.parse(localStorage.getItem("auth")) || {}
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("POST", `${config.DRUPAL_HOST}/user/logout?_format=json&token=${authData.logout_token}`, true)
    xmlHttp.setRequestHeader("Content-Type", "application/json")
    xmlHttp.setRequestHeader("X-CSRF-Token", authData.csrf_token)
    xmlHttp.withCredentials = true
    xmlHttp.onload = () => {
      if (xmlHttp.status === 204) {
        setLoginStatus(false)
        resolve()
      } else {
        const respData = JSON.parse(xmlHttp.responseText)
        reject(respData.message.replace(/(?:\r\n|\r|\n)/g, "<br />"))
      }
    }
    xmlHttp.error = err => {
      reject(err)
    }
    xmlHttp.send()
  })
}

const signup = body => {
  return new Promise((resolve, reject) => {
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("POST", `${config.DRUPAL_HOST}/user/register?_format=json`, true)
    xmlHttp.setRequestHeader("Content-Type", "application/json")
    xmlHttp.onload = () => {
      if (xmlHttp.status === 200) {
        resolve(JSON.parse(xmlHttp.responseText))
      } else {
        const respData = JSON.parse(xmlHttp.responseText)
        reject(respData.message.replace(/(?:\r\n|\r|\n)/g, "<br />"))
      }
    }
    xmlHttp.send(JSON.stringify(body))
  })
}

const forgot = body => {
  return new Promise((resolve, reject) => {
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("POST", `${config.DRUPAL_HOST}/user/password?_format=json`, true)
    xmlHttp.setRequestHeader("Content-Type", "application/json")
    xmlHttp.withCredentials = true
    xmlHttp.onload = () => {
      if (xmlHttp.status === 200) {
        resolve()
      } else {
        const respData = JSON.parse(xmlHttp.responseText)
        reject(respData.message)
      }
    }
    xmlHttp.send(JSON.stringify(body))
  })
}

const getUserStatus = () => {
  return new Promise((resolve, reject) => {
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("GET", `${config.DRUPAL_HOST}/user/login_status?_format=json`, true)
    xmlHttp.setRequestHeader("Content-Type", "application/json")
    xmlHttp.withCredentials = true
    xmlHttp.onload = () => {
      if (xmlHttp.status === 200) {
        if (xmlHttp.responseText === "1") {
          setLoginStatus(true)
          resolve(true)
        } else {
          setLoginStatus(false)
          resolve(false)
        }
      } else {
        const respData = JSON.parse(xmlHttp.responseText)
        reject(respData.message)
      }
    }
    xmlHttp.send()
  })
}

const requestUserData = id => {
  return new Promise((resolve, reject) => {
    // check localstorage auth data
    const authData = JSON.parse(localStorage.getItem("auth")) || {}

    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("GET", `${config.DRUPAL_HOST}/jsonapi/user/user/${id}`, true)
    xmlHttp.setRequestHeader("Content-Type", "application/vnd.api+json")
    xmlHttp.setRequestHeader("Accept", "application/vnd.api+json")
    xmlHttp.withCredentials = true
    xmlHttp.onload = () => {
      if (xmlHttp.status === 200) {
        const respData = JSON.parse(xmlHttp.responseText).data

        // if user id is present in the response
        if (!authData.current_user) authData.current_user = {}
        authData.current_user.id = respData.id
        authData.current_user.name = respData.attributes.name
        authData.current_user.display_name = respData.attributes.display_name
        authData.current_user.mail = respData.attributes.mail
        authData.current_user.created = respData.attributes.created
        authData.current_user.lang = respData.attributes.langcode

        // store the user details
        localStorage.setItem("auth", JSON.stringify(authData))

        // set UI signin status
        setLoginStatus(true)

        resolve()
      } else {
        const respData = JSON.parse(xmlHttp.responseText)
        setLoginStatus(false)
        reject(respData.message)
      }
    }
    xmlHttp.send()
  })
}

const getUserId = () => {
  return new Promise((resolve, reject) => {
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("GET", `${config.DRUPAL_HOST}/jsonapi`, true)
    xmlHttp.setRequestHeader("Content-Type", "application/vnd.api+json")
    xmlHttp.setRequestHeader("Accept", "application/vnd.api+json")
    xmlHttp.withCredentials = true
    xmlHttp.onload = () => {
      if (xmlHttp.status === 200) {
        const respData = JSON.parse(xmlHttp.responseText)
        resolve(respData.meta.links.me.meta.id)
      } else {
        const respData = JSON.parse(xmlHttp.responseText)
        reject(respData.message)
      }
    }
    xmlHttp.send()
  })
}

const queryUser = async () => {
  // check localstorage auth data
  const authData = JSON.parse(localStorage.getItem("auth")) || {}
  let id
  // if some params are missing from the stored object
  if (authData && authData.current_user) {
    // request user data
    id = await getUserId()
    await requestUserData(id)
  } else {
    const userIsAlreadySignedIn = await getUserStatus()
    if (userIsAlreadySignedIn) {
      id = await getUserId()
      await requestUserData(id)
    } else {
      // user is not signed in
      setLoginStatus(false)
    }
  }
}

const signin = body => {
  return new Promise((resolve, reject) => {
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("POST", `${config.DRUPAL_HOST}/user/login?_format=json`, true)
    xmlHttp.setRequestHeader("Content-Type", "application/json")
    xmlHttp.withCredentials = true
    xmlHttp.onload = () => {
      if (xmlHttp.status === 200) {
        const respData = JSON.parse(xmlHttp.responseText)
        localStorage.setItem("auth", JSON.stringify(respData))

        // query user data after first login as the sign-in response doesn't contain all neccessary user info
        setTimeout(() => {
          queryUser()
          resolve()
        }, 100)
      } else {
        const respData = JSON.parse(xmlHttp.responseText)
        reject(respData.message)
      }
    }
    xmlHttp.send(body ? JSON.stringify(body) : null)
  })
}

export default {
  signin,
  signup,
  signout,
  getUserStatus,
  getCSRFToken,
  forgot,
  queryUser,
}
