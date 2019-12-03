const isTouchDevice = () => {
  return "ontouchstart" in window || window.navigator.maxTouchPoints > 0 || window.navigator.msMaxTouchPoints > 0
}

const ready = fn => {
  if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
    fn()
  } else {
    document.addEventListener("DOMContentLoaded", fn)
  }
}

const trigger = (eventId, obj = {}, scope = document) => {
  const event = new CustomEvent(eventId, {
    detail: obj,
  })
  scope.dispatchEvent(event)
}

module.exports = {
  ready,
  isTouchDevice,
  trigger,
}
