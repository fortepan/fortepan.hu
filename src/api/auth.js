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

const signout = () => {
  return new Promise((resolve, reject) => {
    const authData = JSON.parse(localStorage.getItem("auth"))

    if (authData && authData.logout_token) {
      const xmlHttp = new XMLHttpRequest()
      xmlHttp.open("POST", `${config.DRUPAL_HOST}/user/logout?_format=json&token=${authData.logout_token}`, true)
      xmlHttp.setRequestHeader("Content-Type", "application/json")
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
    } else {
      setLoginStatus(false)
      // eslint-disable-next-line prefer-promise-reject-errors
      reject("The user has not been activated or is blocked.")
    }
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

const queryUser = () => {
  return new Promise((resolve, reject) => {
    // check localstorage auth data
    const authData = JSON.parse(localStorage.getItem("auth")) || {}

    // if some params are missing from the stored object
    if (authData && authData.csrf_token) {
      // request user data
      const xmlHttp = new XMLHttpRequest()
      xmlHttp.open("GET", `${config.DRUPAL_HOST}/jsonapi/user/user?filter[uid]=${authData.current_user.uid}`, true)
      xmlHttp.setRequestHeader("Content-Type", "application/vnd.api+json")
      xmlHttp.setRequestHeader("Accept", "application/vnd.api+json")
      xmlHttp.withCredentials = true
      xmlHttp.onload = () => {
        if (xmlHttp.status === 200) {
          const respData = JSON.parse(xmlHttp.responseText).data[0]
          // if user id is present in the response
          if (respData && respData.id) {
            if (!authData.current_user) authData.current_user = {}
            authData.current_user.id = respData.id
            authData.current_user.name = respData.attributes.name
            authData.current_user.display_name = respData.attributes.display_name
            authData.current_user.mail = respData.attributes.mail
            authData.current_user.created = respData.attributes.created
            authData.current_user.lang = respData.attributes.langcode
            localStorage.setItem("auth", JSON.stringify(authData))

            // store the user details
            setLoginStatus(true)
            resolve(authData)
          } else {
            // if user id is not present in the response then UI should switch to logged out state
            setLoginStatus(false)
            reject()
          }
        } else {
          const respData = JSON.parse(xmlHttp.responseText)
          setLoginStatus(false)
          reject(respData.message)
        }
      }
      xmlHttp.send()
    } else {
      // there's no csrf_token
      setLoginStatus(false)
      reject()
    }
  })
}

const getToken = () => {
  return new Promise((resolve, reject) => {
    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("GET", `${config.DRUPAL_HOST}/session/token`, true)
    xmlHttp.setRequestHeader("Content-Type", "application/json")
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
            .then(resp => {
              resolve(resp)
            })
            .catch(error => {
              reject(error)
            })
        }, 200)
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
  getToken,
  forgot,
  queryUser,
}
