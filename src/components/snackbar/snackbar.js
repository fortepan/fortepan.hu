let snackbarTimer

document.addEventListener("snackbar:show", e => {
  if (!e.detail) return false
  let snackbar
  if (!document.querySelector(".snackbar")) {
    snackbar = document.createElement("div")
    snackbar.className = "snackbar"
    document.querySelector("body").appendChild(snackbar)
  } else {
    snackbar = document.querySelector(".snackbar")
  }
  snackbar.innerHTML = e.detail.message

  snackbar.classList.remove("snackbar--success")
  snackbar.classList.remove("snackbar--error")
  snackbar.classList.add(`snackbar--${e.detail.status || "success"}`)

  setTimeout(() => {
    snackbar.classList.add("snackbar--show")
  }, 50)

  if (e.detail.autoHide) {
    clearTimeout(snackbarTimer)
    snackbarTimer = setTimeout(() => {
      snackbar.classList.remove("snackbar--show")
    }, 5000)
  }
  return true
})
