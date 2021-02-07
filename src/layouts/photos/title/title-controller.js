import { Controller } from "stimulus"
import { lang, getURLParams, numberWithCommas } from "../../../js/utils"

export default class extends Controller {
  static get targets() {
    return ["title", "searchExpression", "count", "subtitle"]
  }

  setTitle(e) {
    const photosCount = e.detail.count
    const q = getURLParams()

    // set main title
    if (typeof q.latest !== "undefined") {
      this.titleTarget.textContent = lang("latest")
    } else if (Object.keys(q).length === 0 || !q.q || (q.q === "" && !q.latest === "")) {
      this.titleTarget.textContent = lang("photos")
    } else {
      this.titleTarget.textContent = lang("search")
    }

    // set search expression tag content
    if (Object.keys(q).length === 0 || q.q === "" || Object.keys(q).indexOf("latest") > -1) {
      this.searchExpressionTarget.classList.remove("is-visible")
    } else if (Object.keys(q).indexOf("advancedSearch") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${lang("advanced_search")}`
    } else if (Object.keys(q).indexOf("donor") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${lang("donor")}: <em>${q.donor}</em>`
    } else if (Object.keys(q).indexOf("photographer") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${lang("photographer")}: <em>${q.photographer}</em>`
    } else if (Object.keys(q).indexOf("year") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${lang("year")}: <em>${q.year}</em>`
    } else if (Object.keys(q).indexOf("country") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${lang("country")}: <em>${q.country}</em>`
    } else if (Object.keys(q).indexOf("city") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${lang("city")}: <em>${q.city}</em>`
    } else if (Object.keys(q).indexOf("place") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${lang("place")}: <em>${q.place}</em>`
    } else if (Object.keys(q).indexOf("tag") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${lang("tag")}: <em>${q.tag}</em>`
    } else if (Object.keys(q).indexOf("q") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${lang("search_phrase")}: <em>${q.q}</em>`
    }

    // set photo counter
    this.countTarget.textContent = numberWithCommas(photosCount)

    // fade in subtitle
    this.subtitleTarget.classList.add("is-visible")
  }
}
