import { Controller } from "stimulus"
import { trigger, getURLParams } from "../../js/utils"
import { setAppState, removeAppState } from "../../js/app"

const YEAR_MIN = 1900
const YEAR_MAX = 1990

export default class extends Controller {
  static get targets() {
    return ["title", "range", "slider", "selectedRange", "sliderKnob", "sliderLeft", "sliderRight"]
  }

  connect() {
    this.range = 0 // distance between the two knobs

    // slider status
    this.sliderDragged = null
    this.sliderDragStartX = 0

    // init component
    this.resetSlider()
  }

  enable() {
    this.element.classList.remove("is-disabled")
    this.element.classList.add("is-visible")
  }

  disable() {
    this.element.classList.remove("is-visible")
    this.element.classList.add("is-disabled")
  }

  /**
   * Change the address bar url params based on the timeline's range
   */
  setURLParams() {
    const urlParams = getURLParams()
    urlParams.year_from = this.yearStart
    urlParams.year_to = this.yearEnd
    const url = `?${Object.entries(urlParams)
      .map(([key, val]) => `${key}=${val}`)
      .join("&")}`
    trigger("photos:historyPushState", { url })
  }

  setRange() {
    this.range = this.sliderTarget.offsetWidth - this.sliderLeftTarget.offsetWidth - this.sliderRightTarget.offsetWidth
  }

  getRange() {
    return { from: this.yearStart, to: this.yearEnd }
  }

  setTimelineRange() {
    this.rangeTarget.textContent = `${this.yearStart} — ${this.yearEnd}`
    this.sliderLeftTarget.textContent = this.yearStart
    this.sliderRightTarget.textContent = this.yearEnd
  }

  fixSlider() {
    const start = ((this.yearStart - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * this.range
    const end = ((this.yearEnd - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * this.range
    this.sliderLeftTarget.style.left = `${start}px`
    this.sliderRightTarget.style.left = `${end + this.sliderLeftTarget.offsetWidth}px`
    this.selectedRangeTarget.style.left = `${start + this.sliderLeftTarget.offsetWidth}px`
    this.selectedRangeTarget.style.width = `${end - start}px`
  }

  resetSlider() {
    const urlParams = getURLParams()

    this.yearStart = urlParams.year_from || YEAR_MIN
    this.yearEnd = urlParams.year_to || YEAR_MAX

    this.setRange()
    this.setTimelineRange()
    this.fixSlider()

    this.enable()
  }

  calcYearRange() {
    this.yearStart = YEAR_MIN + Math.round((this.sliderLeftTarget.offsetLeft / this.range) * (YEAR_MAX - YEAR_MIN))
    this.yearEnd =
      YEAR_MIN +
      Math.round(
        ((this.sliderRightTarget.offsetLeft - this.sliderLeftTarget.offsetWidth) / this.range) * (YEAR_MAX - YEAR_MIN)
      )
  }

  sliderStartDrag(e) {
    e.currentTarget.classList.add("is-active")
    const px = e.touches ? e.touches[0].pageX : e.pageX
    this.sliderDragStartX = px - e.currentTarget.offsetLeft

    this.element.classList.add("is-used")
    setAppState("disable--selection")
    this.sliderDragged = e.currentTarget
  }

  sliderStopDrag() {
    this.sliderKnobTargets.forEach(knob => {
      knob.classList.remove("is-active")
    })

    this.element.classList.remove("is-used")
    removeAppState("disable--selection")

    this.fixSlider()

    if (this.sliderDragged) {
      this.sliderDragged = null
      this.setURLParams()
    }
  }

  sliderLeftMoved(e) {
    if (
      this.sliderDragged === this.sliderLeftTarget &&
      this.sliderLeftTarget.offsetLeft >= 0 &&
      this.sliderLeftTarget.offsetLeft <= this.sliderRightTarget.offsetLeft - this.sliderLeftTarget.offsetWidth
    ) {
      const px = e.touches ? e.touches[0].pageX : e.pageX
      const x = Math.min(
        Math.max(px - this.sliderDragStartX, 0),
        this.sliderRightTarget.offsetLeft - this.sliderLeftTarget.offsetWidth
      )
      this.sliderLeftTarget.style.left = `${x}px`
      this.selectedRangeTarget.style.left = `${x + this.sliderLeftTarget.offsetWidth}px`
      this.selectedRangeTarget.style.width = `${this.sliderRightTarget.offsetLeft - x}px`

      this.calcYearRange()
      this.setTimelineRange()
    }
  }

  sliderRightMoved(e) {
    const px = e.touches ? e.touches[0].pageX : e.pageX

    if (
      this.sliderDragged === this.sliderRightTarget &&
      this.sliderRightTarget.offsetLeft >= this.sliderLeftTarget.offsetLeft + this.sliderLeftTarget.offsetWidth &&
      this.sliderRightTarget.offsetLeft <= this.sliderTarget.offsetWidth - this.sliderRightTarget.offsetWidth
    ) {
      const x = Math.max(
        Math.min(px - this.sliderDragStartX, this.sliderTarget.offsetWidth - this.sliderRightTarget.offsetWidth),
        this.sliderLeftTarget.offsetLeft + this.sliderLeftTarget.offsetWidth
      )
      this.sliderRightTarget.style.left = `${x}px`
      this.selectedRangeTarget.style.width = `${this.sliderRightTarget.offsetLeft - this.sliderLeftTarget.offsetLeft}px`

      this.calcYearRange()
      this.setTimelineRange()
    }
  }
}
