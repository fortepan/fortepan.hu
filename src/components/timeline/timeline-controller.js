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
      "yearStart",
      "yearEnd",
      "yearIndicator",
      "yearIndicatorLabel",
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
    this.timelineOver = false

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

    this.yearStartTarget.textContent = this.yearStart
    this.yearEndTarget.textContent = this.yearEnd
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

    return this.year
  }

  setYear(year) {
    this.year = year || this.calcYear()

    // check if selected year (this.year) has photos at all (not already loaded)
    // and if not, jump to the closest year that has
    if (!photoManager.getYearsInContext().find(item => item.year === this.year)) {
      let closestMatch = -1
      photoManager.getYearsInContext().forEach(item => {
        if (Math.abs(this.year - item.year) < Math.abs(this.year - closestMatch)) {
          closestMatch = item.year
        }
      })

      if (closestMatch > -1) {
        this.year = closestMatch
      } else {
        // if for some reason the above fails fall back to the last stored year
        this.year = this.sliderDragStartYear
      }
    }

    this.fixSlider()
    this.setTimelineLabels()

    if ((this.sliderDragged && this.year !== this.sliderDragStartYear) || !this.sliderDragged) {
      trigger("timeline:yearSelected", { year: this.year })
    }
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
    if (this.sliderDragged) {
      this.sliderKnobTargets.forEach(knob => {
        knob.classList.remove("is-active", "is-empty")
      })

      this.element.classList.remove("is-used")
      removeAppState("disable--selection")

      this.setYear()
      this.sliderDragged = null
    }
  }

  sliderMoved(e) {
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

  seek(e) {
    if (e && this.timelineOver) {
      const px = e.touches ? e.touches[0].pageX : e.pageX
      const knobBounds = this.sliderYearTarget.getBoundingClientRect()

      if (px < knobBounds.left || px > knobBounds.right) {
        this.yearIndicatorTarget.classList.remove("is-hover")
        this.setYear(this.calcIndicatorYear(px))
      }
    }
  }

  jumpToStart() {
    this.setYear(this.yearStart)
  }

  jumpToEnd() {
    this.setYear(this.yearEnd)
  }

  onTimelineOver() {
    this.timelineOver = true
    this.yearIndicatorTarget.classList.add("is-hover")
  }

  onTimelineOut() {
    if (this.timelineOver) {
      this.yearIndicatorTarget.classList.remove("is-hover")
      this.timelineOver = false
    }
  }

  onTimelineMove(e) {
    if (e && this.timelineOver) {
      const px = e.touches ? e.touches[0].pageX : e.pageX
      const knobBounds = this.sliderYearTarget.getBoundingClientRect()

      if (px < knobBounds.left || px > knobBounds.right) {
        // if the cursor is not over the slider knob
        this.yearIndicatorTarget.classList.add("is-hover")

        if (px > knobBounds.right) {
          this.yearIndicatorTarget.classList.add("is-grey")
        } else {
          this.yearIndicatorTarget.classList.remove("is-grey")
        }

        const x = Math.min(
          Math.max(px - this.sliderTarget.getBoundingClientRect().left, 0),
          this.sliderTarget.offsetWidth
        )

        this.yearIndicatorTarget.style.left = `${x}px`

        const year = this.calcIndicatorYear(px)
        this.setIndicatorLabel(year)
      } else {
        // mouse is over the slider knob's area
        this.yearIndicatorTarget.classList.remove("is-hover")
      }
    }
  }

  calcIndicatorYear(mouseX) {
    const knobBounds = this.sliderYearTarget.getBoundingClientRect()
    let targetX = this.yearIndicatorTarget.offsetLeft

    if (mouseX > knobBounds.right) targetX -= knobBounds.width

    const yearPartial = (targetX / this.range) * (this.yearEnd - this.yearStart)

    if (mouseX > knobBounds.right) return this.yearStart + Math.ceil(yearPartial)
    if (mouseX < knobBounds.left) return this.yearStart + Math.floor(yearPartial)

    return -1
  }

  setIndicatorLabel(year) {
    // check if selected year has photos at all (not already loaded)
    // and if not, grey out the slider
    if (photoManager.getYearsInContext().find(item => item.year === year)) {
      this.yearIndicatorTarget.classList.remove("is-empty")
      this.yearIndicatorLabelTarget.innerHTML = `${year} <span class="count">(${
        photoManager.getYearsInContext().find(item => item.year === year).count
      })</span>`
    } else {
      this.yearIndicatorTarget.classList.add("is-empty")
      this.yearIndicatorLabelTarget.innerHTML = `${year} <span class="count">(0)</span>`
    }
  }
}
