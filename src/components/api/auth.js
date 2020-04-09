const AUTH_HOST = "http://admin.fortepan.hu:8080"

const login = (body, callback, error) => {
  const xmlHttp = new XMLHttpRequest()
  xmlHttp.open("POST", `${AUTH_HOST}/user/login?_format=json`, true)
  xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
  xmlHttp.onload = () => {
    if (xmlHttp.status === 200) {
      callback(JSON.parse(xmlHttp.responseText))
    } else {
      error(xmlHttp.statusText)
    }
  }
  xmlHttp.send(JSON.stringify(body))
}

const signup = (body, callback, error) => {
  const xmlHttp = new XMLHttpRequest()
  xmlHttp.open("POST", `${AUTH_HOST}/user/register?_format=json`, true)
  xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
  xmlHttp.onload = () => {
    if (xmlHttp.status === 200) {
      callback(JSON.parse(xmlHttp.responseText))
    } else {
      error(xmlHttp.statusText)
    }
  }
  xmlHttp.send(JSON.stringify(body))
}

const getToken = () => {}

export default {
  login,
  signup,
  getToken,
}
