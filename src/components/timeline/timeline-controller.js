import { Controller } from "stimulus"
import { trigger } from "../../js/utils"
import { setAppState, removeAppState } from "../../js/app"
import photoManager from "../../js/photo-manager"

export default class extends Controller {
  static get targets() {
    return [
      "title",
      "range",
      "rangeBackground",
      "slider",
      "selectedRange",
      "sliderKnob",
      "sliderYear",
      "sliderYearLabel",
      "sliderYearCount",
    ]
  }

  connect() {
    this.range = 0 // distance between the two knobs

    // slider status
    this.sliderDragged = null
    this.sliderDragStartX = 0
    this.sliderDragStartYear = 0
    this.yearStart = 0
    this.yearEnd = 0

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

  // event listener for photoManager:photoSelected
  setSlider() {
    if (photoManager.getSelectedPhotoId()) {
      this.yearStart = photoManager.getFirstYearInContext().year
      this.yearEnd = photoManager.getLastYearInContext().year
      this.year = parseInt(photoManager.getSelectedPhotoData().year, 10)

      this.setRange()
      this.setTimelineLabels()
      this.fixSlider()
    }
  }

  setRange() {
    this.range = this.sliderTarget.offsetWidth - this.sliderYearTarget.offsetWidth
  }

  getRange() {
    return { from: this.yearStart, to: this.yearEnd }
  }

  setTimelineLabels() {
    this.rangeTarget.textContent = this.year
    this.sliderYearLabelTarget.textContent = this.year

    // check if selected year (this.year) has photos at all (not already loaded)
    // and if not, grey out the slider
    if (photoManager.getYearsInContext().find(item => item.year === this.year)) {
      this.sliderYearTarget.classList.remove("is-empty")
      this.sliderYearCountTarget.textContent = photoManager
        .getYearsInContext()
        .find(item => item.year === this.year).count
    } else {
      this.sliderYearTarget.classList.add("is-empty")
      this.sliderYearCountTarget.textContent = 0
    }
  }

  fixSlider() {
    const start = ((this.year - this.yearStart) / (this.yearEnd - this.yearStart)) * this.range

    this.sliderYearTarget.style.left = `${start}px`
    this.selectedRangeTarget.style.left = `0px`
    this.selectedRangeTarget.style.width = `${start}px`
    this.rangeBackgroundTarget.style.left = `${start + this.sliderYearTarget.offsetWidth}px`
    this.rangeBackgroundTarget.style.width = `${this.sliderTarget.offsetWidth -
      (start + this.sliderYearTarget.offsetWidth)}px`
  }

  resetSlider() {
    this.setSlider()
    this.enable()
  }

  calcYear() {
    this.year =
      this.yearStart + Math.round((this.sliderYearTarget.offsetLeft / this.range) * (this.yearEnd - this.yearStart))
  }

  sliderStartDrag(e) {
    e.currentTarget.classList.add("is-active")
    const px = e.touches ? e.touches[0].pageX : e.pageX
    this.sliderDragStartX = px - e.currentTarget.offsetLeft

    this.sliderDragStartYear = this.year

    this.element.classList.add("is-used")
    setAppState("disable--selection")
    this.sliderDragged = e.currentTarget
  }

  sliderStopDrag() {
    this.sliderKnobTargets.forEach(knob => {
      knob.classList.remove("is-active", "is-empty")
    })

    this.element.classList.remove("is-used")
    removeAppState("disable--selection")

    // check if selected year (this.year) has photos at all (not already loaded)
    // and if not, jump back to the last selected year
    if (!photoManager.getYearsInContext().find(item => item.year === this.year)) {
      this.year = this.sliderDragStartYear
      this.setTimelineLabels()
    }

    this.fixSlider()

    if (this.sliderDragged) {
      this.sliderDragged = null
      if (this.year !== this.sliderDragStartYear) {
        trigger("timeline:yearSelected", { year: this.year })
      }
    }
  }

  sliderYearMoved(e) {
    if (this.sliderDragged === this.sliderYearTarget && this.sliderYearTarget.offsetLeft >= 0) {
      const px = e.touches ? e.touches[0].pageX : e.pageX
      const x = Math.min(
        Math.max(px - this.sliderDragStartX, 0),
        this.sliderTarget.offsetWidth - this.sliderYearTarget.offsetWidth
      )

      this.sliderYearTarget.style.left = `${x}px`
      this.selectedRangeTarget.style.left = `0px`
      this.selectedRangeTarget.style.width = `${x}px`
      this.rangeBackgroundTarget.style.left = `${x + this.sliderYearTarget.offsetWidth}px`
      this.rangeBackgroundTarget.style.width = `${this.sliderTarget.offsetWidth -
        (x + this.sliderYearTarget.offsetWidth)}px`

      this.calcYear()
      this.setTimelineLabels()
    }
  }
}
