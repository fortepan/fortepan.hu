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

const queryUser = () => {
  return new Promise((resolve, reject) => {
    // if some of the user details are missing
    const authData = JSON.parse(localStorage.getItem("auth"))
    if (authData) {
      // if auth data is present, we presume that the user is already logged in
      setLoginStatus(true)
    }
    // check if user data exists
    if (authData && authData.current_user.uid) {
      const xmlHttp = new XMLHttpRequest()
      xmlHttp.open("GET", `${config.DRUPAL_HOST}/jsonapi/user/user?filter[uid]=${authData.current_user.uid}`, true)
      xmlHttp.setRequestHeader("Content-Type", "application/vnd.api+json")
      xmlHttp.setRequestHeader("Accept", "application/vnd.api+json")
      xmlHttp.withCredentials = true
      xmlHttp.onload = () => {
        if (xmlHttp.status === 200) {
          const respData = JSON.parse(xmlHttp.responseText).data[0]
          if (respData && respData.id) {
            // if user id is present in the response
            authData.current_user.id = respData.id
            authData.current_user.mail = respData.attributes.mail
            authData.current_user.created = respData.attributes.created
            authData.current_user.lang = respData.attributes.langcode
            localStorage.setItem("auth", JSON.stringify(authData))

            // store the user details
            setLoginStatus(true)
            resolve(authData)
          } else {
            // if user id is not present in the response then UI should switch to logged out state
            // the cookie session might be expired in this case
            setLoginStatus(false)
            // eslint-disable-next-line prefer-promise-reject-errors
            reject("The user has not been activated or is blocked.")
          }
        } else {
          const respData = JSON.parse(xmlHttp.responseText)
          setLoginStatus(false)
          reject(respData.message)
        }
      }
      xmlHttp.send()
    } else {
      reject()
    }
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
        resolve(xmlHttp.responseText)
      } else {
        const respData = JSON.parse(xmlHttp.responseText)
        reject(respData.message)
      }
    }
    xmlHttp.send()
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
        }, 1000)
      } else {
        const respData = JSON.parse(xmlHttp.responseText)
        reject(respData.message)
      }
    }
    xmlHttp.send(JSON.stringify(body))
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
