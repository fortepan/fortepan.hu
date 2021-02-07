module.exports = {
  get selectedThumbnail() {
    return document.querySelector(".photos-thumbnail.is-selected")
  },

  appState: state => {
    return document.querySelector("body").classList.contains(state)
  },

  setAppState: state => {
    document.querySelector("body").classList.add(state)
  },

  removeAppState: state => {
    document.querySelector("body").classList.remove(state)
  },

  toggleAppState: state => {
    document.querySelector("body").classList.toggle(state)
  },
}
