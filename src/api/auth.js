import { trigger, validateEmail } from "../js/utils"
import config from "../data/siteConfig"

const setLoginStatus = isUserSignedIn => {
  if (isUserSignedIn) {
    document.querySelector("body").classList.add("auth-signed-in")
  } else {
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
        trigger("auth:signedOut")
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

const forgot = val => {
  return new Promise((resolve, reject) => {
    const body = {
      data: {
        type: "user--password-reset",
        attributes: {},
      },
    }

    if (validateEmail(val)) body.data.attributes.mail = val
    else body.data.attributes.name = val

    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("POST", `${config.DRUPAL_HOST}/jsonapi/user/password/reset`, true)
    xmlHttp.setRequestHeader("Content-Type", "application/vnd.api+json")
    xmlHttp.setRequestHeader("Accept", "application/vnd.api+json")
    xmlHttp.withCredentials = true
    xmlHttp.onload = () => {
      if (xmlHttp.status === 202) {
        resolve()
      } else {
        const respData = JSON.parse(xmlHttp.responseText)
        console.log(respData)
        reject(respData.errors[0].detail)
      }
    }
    xmlHttp.send(JSON.stringify(body))
  })
}

const resetPassword = pass => {
  return new Promise((resolve, reject) => {
    if (window.location.pathname.indexOf("/user/reset/") === -1) resolve()

    const credentialKeys = ["user", "timestamp", "hash"]
    const pathArray = window.location.pathname.split("/user/reset/")[1].split("/")
    const credentials = credentialKeys.reduce((acc, value, i) => {
      acc[value] = pathArray[i]
      return acc
    }, {})
    credentials.pass = pass
    const requestUrl = `${config.DRUPAL_HOST}/jsonapi/user/${credentials.user}/password/update`
    delete credentials.user

    const body = {
      data: {
        type: "user--user",
        attributes: credentials,
      },
    }

    const xmlHttp = new XMLHttpRequest()
    xmlHttp.open("PATCH", requestUrl, true)
    xmlHttp.setRequestHeader("Content-Type", "application/vnd.api+json")
    xmlHttp.setRequestHeader("Accept", "application/vnd.api+json")
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

        // store the user details
        localStorage.setItem("auth", JSON.stringify(authData))

        // set UI signin status
        setLoginStatus(true)

        resolve(respData.attributes)
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

const querySignedInUser = async () => {
  let respData
  const userIsAlreadySignedIn = await getUserStatus()
  if (userIsAlreadySignedIn) {
    const id = await getUserId()
    respData = await requestUserData(id)
    setLoginStatus(true)
  } else {
    // user is not signed in
    setLoginStatus(false)
  }

  return respData
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
        // store logout_token and auth specific anonym data
        localStorage.setItem("auth", JSON.stringify(respData))
        trigger("auth:signedIn")
        resolve()
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
  resetPassword,
  querySignedInUser,
}
