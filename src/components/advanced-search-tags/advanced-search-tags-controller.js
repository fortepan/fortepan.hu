import { Controller } from "@hotwired/stimulus"

import { trigger, parseAdvancedSearchTerm } from "../../js/utils"

// makes the advanced search term tags (e.g. "location:Budapest") of a nested selectize control
// open the advanced search dialog when clicked
export default class extends Controller {
  onTagAdded(e) {
    const { tag } = e.detail
    if (parseAdvancedSearchTerm(tag.textContent)) tag.classList.add("selectize-control__tag--link")
  }

  onTagClick(e) {
    // clicking the tag's close icon only removes the tag
    if (!e.target.closest(".selectize-control__tag--link") || e.target.closest(".selectize-control__tag__close")) return

    e.preventDefault()
    trigger("dialogAdvancedSearch:show")
  }
}
