import throttle from "lodash/throttle"
import { trigger, getURLParams } from "../../utils"

const YEAR_MIN = 1900
const YEAR_MAX = 1990

class Timeline extends HTMLElement {
  constructor() {
    super()
    this.timelineRange = this.querySelector("#TimelineRange")
    this.timelineSlider = this.querySelector("#TimelineSlider")
    this.sliderSelectedRange = this.querySelector("#TimelineSliderSelectedRange")
    this.sliderLeft = this.querySelector("#TimelineSliderLeft")
    this.sliderRight = this.querySelector("#TimelineSliderRight")
    this.drag = false
    this.timelineTimer = null

    this.range = 0

    this.classList.remove("is-disabled")
    this.classList.add("is-visible")
    this.resetSlider()

    this.initSliderLeft()
    this.initSliderRight()

    // show/hide timeline
    this.onMouseMove = this.onMouseMove.bind(this)
    document.addEventListener("mousemove", throttle(this.onMouseMove, 400))
  }

  onMouseMove(e) {
    if (!this.classList.contains("is-visible") && !this.classList.contains("is-disabled")) {
      this.classList.add("is-visible")
    }

    if (this.timelineTimer) clearTimeout(this.timelineTimer)
    this.timelineTimer = setTimeout(
      function() {
        const bounds = this.getBoundingClientRect()
        if (
          !(
            e.clientX >= bounds.left &&
            e.clientX <= bounds.right &&
            e.clientY >= bounds.top &&
            e.clientY <= bounds.bottom
          )
        ) {
          this.classList.remove("is-visible")
        }
      }.bind(this),
      1000
    )
  }

  disable() {
    this.classList.remove("is-visible")
    this.classList.add("is-disabled")
  }

  setURLParams() {
    const urlParams = getURLParams()
    urlParams.year_from = this.yearStart
    urlParams.year_to = this.yearEnd
    const url = `?${Object.entries(urlParams)
      .map(([key, val]) => `${key}=${val}`)
      .join("&")}`
    trigger("layoutPhotos:historyPushState", { url })
  }

  setRange() {
    this.range = this.timelineSlider.offsetWidth - this.sliderLeft.offsetWidth - this.sliderRight.offsetWidth
  }

  getRange() {
    return { from: this.yearStart, to: this.yearEnd }
  }

  setTimelineRange() {
    this.timelineRange.textContent = `${this.yearStart} — ${this.yearEnd}`
    this.sliderLeft.textContent = this.yearStart
    this.sliderRight.textContent = this.yearEnd
  }

  fixSlider() {
    const start = ((this.yearStart - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * this.range
    const end = ((this.yearEnd - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * this.range
    this.sliderLeft.style.left = `${start}px`
    this.sliderRight.style.left = `${end + this.sliderLeft.offsetWidth}px`
    this.sliderSelectedRange.style.left = `${start + this.sliderLeft.offsetWidth}px`
    this.sliderSelectedRange.style.width = `${end - start}px`
  }

  resetSlider(start = YEAR_MIN, end = YEAR_MAX) {
    this.yearStart = start
    this.yearEnd = end

    this.setRange()
    this.setTimelineRange()
    this.fixSlider()
  }

  set reset({ start = YEAR_MIN, end = YEAR_MAX }) {
    this.resetSlider(start, end)
  }

  sliderStartDrag() {
    this.classList.add("is-used")
    document.querySelector("body").classList.add("disable--selection")
    this.drag = true
  }

  sliderStopDrag() {
    this.classList.remove("is-used")
    document.querySelector("body").classList.remove("disable--selection")
    this.fixSlider()
    if (this.drag) {
      this.drag = false
      this.setURLParams()
    }
  }

  calcYearInterval() {
    this.yearStart = YEAR_MIN + Math.round((this.sliderLeft.offsetLeft / this.range) * (YEAR_MAX - YEAR_MIN))
    this.yearEnd =
      YEAR_MIN +
      Math.round(((this.sliderRight.offsetLeft - this.sliderLeft.offsetWidth) / this.range) * (YEAR_MAX - YEAR_MIN))
  }

  initSliderLeft() {
    let down = false
    let ox = 0

    this.sliderLeft.addEventListener(
      "mousedown",
      function(e) {
        down = true
        ox = e.pageX - this.sliderLeft.offsetLeft
        this.sliderLeft.classList.add("is-active")
        this.sliderStartDrag()
      }.bind(this)
    )

    document.addEventListener(
      "mousemove",
      function(e) {
        if (
          down &&
          this.sliderLeft.offsetLeft >= 0 &&
          this.sliderLeft.offsetLeft <= this.sliderRight.offsetLeft - this.sliderLeft.offsetWidth
        ) {
          const x = Math.min(Math.max(e.pageX - ox, 0), this.sliderRight.offsetLeft - this.sliderLeft.offsetWidth)
          this.sliderLeft.style.left = `${x}px`
          this.sliderSelectedRange.style.left = `${x + this.sliderLeft.offsetWidth}px`
          this.sliderSelectedRange.style.width = `${this.sliderRight.offsetLeft - x}px`
          this.calcYearInterval()
          this.setTimelineRange()
        }
      }.bind(this)
    )

    document.addEventListener(
      "mouseup",
      function() {
        down = false
        this.sliderLeft.classList.remove("is-active")
        this.sliderStopDrag()
      }.bind(this)
    )
  }

  initSliderRight() {
    let down = false
    let ox

    this.sliderRight.addEventListener(
      "mousedown",
      function(e) {
        down = true
        ox = e.pageX - this.sliderRight.offsetLeft
        this.sliderRight.classList.add("is-active")
        this.sliderStartDrag()
      }.bind(this)
    )

    this.sliderRight.addEventListener(
      "mouseup",
      function() {
        down = false
        this.sliderRight.classList.remove("is-active")
        this.sliderStopDrag()
      }.bind(this)
    )

    document.addEventListener(
      "mousemove",
      function(e) {
        if (
          down &&
          this.sliderRight.offsetLeft >= this.sliderLeft.offsetLeft + this.sliderLeft.offsetWidth &&
          this.sliderRight.offsetLeft <= this.timelineSlider.offsetWidth - this.sliderRight.offsetWidth
        ) {
          const x = Math.max(
            Math.min(e.pageX - ox, this.timelineSlider.offsetWidth - this.sliderRight.offsetWidth),
            this.sliderLeft.offsetLeft + this.sliderLeft.offsetWidth
          )
          this.sliderRight.style.left = `${x}px`
          this.sliderSelectedRange.style.width = `${this.sliderRight.offsetLeft - this.sliderLeft.offsetLeft}px`
          this.calcYearInterval()
          this.setTimelineRange()
        }
      }.bind(this)
    )
  }
}
window.customElements.define("photos-timeline", Timeline)
