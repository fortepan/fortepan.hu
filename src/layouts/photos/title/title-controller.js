import { Controller } from "@hotwired/stimulus"
import { lang, getURLParams, numberWithCommas, getLocale, escapeHTML } from "../../../js/utils"
import uploadsManager from "../../../js/photo-uploads-manager"

export default class extends Controller {
  static get targets() {
    return ["titleLink", "title", "searchExpression", "count", "subtitle"]
  }

  async setTitle(e) {
    const photosCount = e.detail.count
    const q = getURLParams()

    this.titleLinkTarget.classList.remove("is-visible")

    // set main title
    if (Object.keys(q).indexOf("upload") > -1) {
      this.titleLinkTarget.classList.add("is-visible")
      this.titleLinkTarget.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="10" viewBox="0 0 14 10"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2,6 L6,10 L10,6 M6,-2 L6,9" transform="rotate(90 7 6)"/></svg> ${lang(
        "photo_uploads"
      )}`
      this.titleLinkTarget.href = `/${getLocale()}/photo-uploads/`

      const collectionData = await uploadsManager.getCollection(q.upload)
      if (collectionData) this.titleTarget.textContent = collectionData[getLocale()].title
    } else if (typeof q.latest !== "undefined") {
      this.titleTarget.textContent = lang("latest")
    } else if (Object.keys(q).length === 0 || !q.q || (q.q === "" && !q.latest === "")) {
      this.titleTarget.textContent = lang("photos")
    } else {
      this.titleTarget.textContent = lang("search")
    }

    // set search expression tag content
    if (
      Object.keys(q).length === 0 ||
      q.q === "" ||
      Object.keys(q).indexOf("latest") > -1 ||
      Object.keys(q).indexOf("upload") > -1
    ) {
      this.searchExpressionTarget.classList.remove("is-visible")

      if (Object.keys(q).indexOf("upload") > -1 && Object.keys(q).indexOf("tag") > -1 && q.tag === "best of") {
        const collectionData = await uploadsManager.getCollection(q.upload)
        if (collectionData) {
          this.searchExpressionTarget.classList.add("is-visible")
          this.searchExpressionTarget.innerHTML = escapeHTML(collectionData[getLocale()]?.actions.best_of)
        }
      }
    } else if (Object.keys(q).indexOf("advancedSearch") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${lang("advanced_search").label}`
    } else if (Object.keys(q).indexOf("donor") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${lang("donor")}: <em>${escapeHTML(q.donor)}</em>`
    } else if (Object.keys(q).indexOf("photographer") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${lang("photographer")}: <em>${escapeHTML(q.photographer)}</em>`
    } else if (Object.keys(q).indexOf("year") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${lang("year")}: <em>${escapeHTML(q.year)}</em>`
    } else if (Object.keys(q).indexOf("country") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${lang("country")}: <em>${escapeHTML(q.country)}</em>`
    } else if (Object.keys(q).indexOf("city") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${lang("city")}: <em>${escapeHTML(q.city)}</em>`
    } else if (Object.keys(q).indexOf("place") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${lang("place")}: <em>${escapeHTML(q.place)}</em>`
    } else if (Object.keys(q).indexOf("tag") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${lang("tag")}: <em>${escapeHTML(q.tag)}</em>`
    } else if (Object.keys(q).indexOf("q") > -1) {
      this.searchExpressionTarget.classList.add("is-visible")
      this.searchExpressionTarget.innerHTML = `${lang("search_phrase")}: <em>${escapeHTML(q.q)}</em>`
    }

    // set photo counter
    this.countTarget.textContent = numberWithCommas(photosCount)

    // fade in the whole element
    this.element.classList.add("is-visible")
  }
}
