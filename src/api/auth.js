import { trigger, validateEmail } from "../js/utils"
import config from "../data/siteConfig"
import { appState, setAppState, removeAppState } from "../js/app"

let initialAuthCheck = false

const setLoginStatus = isUserSignedIn => {
  const authState = appState("auth-signed-in")

  if (isUserSignedIn) {
    setAppState("auth-signed-in")
  } else {
    removeAppState("auth-signed-in")
    localStorage.removeItem("auth")
  }

  // trigger a custom event:
  // - on the very first check regardless of the status
  // - or when the status has changed
  if (!initialAuthCheck || appState("auth-signed-in") !== authState) {
    trigger("auth:loginStatus")
    initialAuthCheck = true
  }
}

const signin = async body => {
  const url = `${appState("is-dev") ? config().DRUPAL_HOST_DEV : config().DRUPAL_HOST}/user/login?_format=json`

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: body ? JSON.stringify(body) : null,
  })

  const respData = await resp.json()
  if (resp.status === 200) {
    localStorage.setItem("auth", JSON.stringify(respData))
    trigger("auth:signedIn")
  } else {
    throw respData.message
  }
}

const signout = async () => {
  const authData = JSON.parse(localStorage.getItem("auth")) || {}

  const url = `${appState("is-dev") ? config().DRUPAL_HOST_DEV : config().DRUPAL_HOST}/user/logout?_format=json&token=${
    authData.logout_token
  }`

  const resp = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": authData.csrf_token,
    },
  })

  if (resp.status === 204) {
    trigger("auth:signedOut")
    setLoginStatus(false)
  }
}

const signup = async body => {
  const url = `${appState("is-dev") ? config().DRUPAL_HOST_DEV : config().DRUPAL_HOST}/user/register?_format=json`

  const resp = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  const respData = await resp.json()
  if (resp.status === 200) {
    return respData
  }

  throw respData.message.replace(/(?:\r\n|\r|\n)/g, "<br />")
}

const forgot = async val => {
  const body = {
    data: {
      type: "user--password-reset",
      attributes: {},
    },
  }

  if (validateEmail(val)) body.data.attributes.mail = val
  else body.data.attributes.name = val

  const url = `${appState("is-dev") ? config().DRUPAL_HOST_DEV : config().DRUPAL_HOST}/jsonapi/user/password/reset`
  const resp = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
    },
    body: JSON.stringify(body),
  })

  const respData = resp.json()
  if (resp.status !== 202) {
    throw Error(respData.errors[0].detail)
  }

  return respData
}

const resetPassword = async pass => {
  if (window.location.pathname.indexOf("/user/reset/") === -1) throw Error()

  const credentialKeys = ["user", "timestamp", "hash"]
  const pathArray = window.location.pathname.split("/user/reset/")[1].split("/")
  const credentials = credentialKeys.reduce((acc, value, i) => {
    acc[value] = pathArray[i]
    return acc
  }, {})
  credentials.pass = pass
  const url = `${appState("is-dev") ? config().DRUPAL_HOST_DEV : config().DRUPAL_HOST}/jsonapi/user/${
    credentials.user
  }/password/update`
  delete credentials.user

  const body = {
    data: {
      type: "user--user",
      attributes: credentials,
    },
  }

  const resp = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
    },
    body: JSON.stringify(body),
  })

  const respData = resp.json()
  if (resp.status === 200) {
    return respData
  }

  throw Error(respData.message)
}

const getUserStatus = async () => {
  const url = `${appState("is-dev") ? config().DRUPAL_HOST_DEV : config().DRUPAL_HOST}/user/login_status?_format=json`
  const resp = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  })

  const respBody = await resp.text()
  const signedIn = resp.status === 200 && respBody === "1"
  setLoginStatus(signedIn)
  return signedIn
}

const requestUserData = async id => {
  // check localstorage auth data
  const url = `${
    appState("is-dev") ? config().DRUPAL_HOST_DEV : config().DRUPAL_HOST
  }/jsonapi/user/user?filter[uid]=${id}`
  const resp = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/vnd.api+json",
      Accept: "application/vnd.api+json",
    },
  })

  return resp
}

const querySignedInUser = async () => {
  const authData = JSON.parse(localStorage.getItem("auth")) || {}

  const userLoggedIn = await getUserStatus()

  setLoginStatus(userLoggedIn)

  // return the user data if we have the user id
  if (userLoggedIn && authData?.current_user?.uid) {
    if (!authData?.current_user?.mail) {
      const resp = await requestUserData(authData.current_user.uid)
      const respData = await resp.json()

      authData.current_user.mail = respData.data[0].attributes.mail
      authData.current_user.id = respData.data[0].id
      authData.current_user.links = respData.data[0].links

      localStorage.setItem("auth", JSON.stringify(authData))
    }

    return { name: authData.current_user.name, mail: authData.current_user.mail }
  }

  return null
}

export default {
  signin,
  signout,
  signup,
  getUserStatus,
  forgot,
  resetPassword,
  querySignedInUser,
}
