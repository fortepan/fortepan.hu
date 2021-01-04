import { lang, getURLParams, numberWithCommas } from "../../js/utils"

class PhotosTitle extends HTMLElement {
  constuctor() {
    this.set = this.set.bind(this)
  }

  set(photosCount) {
    const q = getURLParams()
    const titleNode = this.querySelector(".photos-title__title")

    // set title
    if (typeof q.latest !== "undefined") {
      titleNode.textContent = lang("latest")
    } else if (Object.keys(q).length === 0 || !q.q || (q.q === "" && !q.latest === "")) {
      titleNode.textContent = lang("photos")
    } else {
      titleNode.textContent = lang("search")
    }

    // set search expression tag content
    const searchExpressionNode = this.querySelector("#PhotosSearchExpression")
    if (Object.keys(q).length === 0 || q.q === "" || Object.keys(q).indexOf("latest") > -1) {
      searchExpressionNode.classList.remove("is-visible")
    } else if (Object.keys(q).indexOf("advancedSearch") > -1) {
      searchExpressionNode.classList.add("is-visible")
      searchExpressionNode.innerHTML = `${lang("advanced_search")}`
    } else if (Object.keys(q).indexOf("donor") > -1) {
      searchExpressionNode.classList.add("is-visible")
      searchExpressionNode.innerHTML = `${lang("donor")}: <em>${q.donor}</em>`
    } else if (Object.keys(q).indexOf("photographer") > -1) {
      searchExpressionNode.classList.add("is-visible")
      searchExpressionNode.innerHTML = `${lang("photographer")}: <em>${q.photographer}</em>`
    } else if (Object.keys(q).indexOf("year") > -1) {
      searchExpressionNode.classList.add("is-visible")
      searchExpressionNode.innerHTML = `${lang("year")}: <em>${q.year}</em>`
    } else if (Object.keys(q).indexOf("country") > -1) {
      searchExpressionNode.classList.add("is-visible")
      searchExpressionNode.innerHTML = `${lang("country")}: <em>${q.country}</em>`
    } else if (Object.keys(q).indexOf("city") > -1) {
      searchExpressionNode.classList.add("is-visible")
      searchExpressionNode.innerHTML = `${lang("city")}: <em>${q.city}</em>`
    } else if (Object.keys(q).indexOf("place") > -1) {
      searchExpressionNode.classList.add("is-visible")
      searchExpressionNode.innerHTML = `${lang("place")}: <em>${q.place}</em>`
    } else if (Object.keys(q).indexOf("tag") > -1) {
      searchExpressionNode.classList.add("is-visible")
      searchExpressionNode.innerHTML = `${lang("tag")}: <em>${q.tag}</em>`
    } else if (Object.keys(q).indexOf("q") > -1) {
      searchExpressionNode.classList.add("is-visible")
      searchExpressionNode.innerHTML = `${lang("search_phrase")}: <em>${q.q}</em>`
    }

    // set counter
    this.querySelector("#PhotosCount").textContent = numberWithCommas(photosCount)
    this.querySelector(".photos-title__subtitle").classList.add("is-visible")
  }
}
window.customElements.define("photos-title", PhotosTitle)
