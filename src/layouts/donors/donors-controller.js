import { Controller } from "stimulus"

import { getLocale } from "../../js/utils"
import searchAPI from "../../api/search"

const ALPHABET = [
  "A",
  "Á",
  "B",
  "C",
  "Cs",
  "D",
  "Dz",
  "Dzs",
  "E",
  "É",
  "F",
  "G",
  "Gy",
  "H",
  "I",
  "Í",
  "J",
  "K",
  "L",
  "Ly",
  "M",
  "N",
  "Ny",
  "O",
  "Ó",
  "Ö",
  "Ő",
  "P",
  "Q",
  "R",
  "S",
  "Sz",
  "T",
  "Ty",
  "U",
  "Ú",
  "Ü",
  "Ű",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "Zs",
]

export default class extends Controller {
  // generate all groups
  connect() {
    this.renderContent()
  }

  renderContent() {
    searchAPI.getDonators().then(data => {
      // render alphabet groups
      ALPHABET.forEach(letter => {
        const group = document.createElement("div")
        group.dataset.group = letter
        group.className = "donors__group"
        this.element.appendChild(group)

        const groupHeading = document.createElement("h3")
        groupHeading.textContent = letter
        group.appendChild(groupHeading)
      })

      const dataSorted = data.aggregations.donors.buckets.sort((a, b) => {
        return a.key.localeCompare(b.key, "hu", { ignorePunctuation: false })
      })

      dataSorted.forEach(itemData => {
        // create link node
        const itemNode = document.createElement("a")
        itemNode.innerHTML = `<span class="donors__donor__name">${itemData.key}</span><span class="donors__donor__doc-count">(${itemData.doc_count})</span>`
        itemNode.href = `/${getLocale()}/photos/?donor=${encodeURIComponent(itemData.key)}`
        itemNode.className = "donors__donor"

        // find group id
        let groupId
        ALPHABET.forEach(letter => {
          if (itemData.key.toLowerCase().indexOf(letter.toLowerCase()) === 0) groupId = letter
        })

        // inject item into the corresponding group
        const actGroup = this.element.querySelector(`.donors__group[data-group=${groupId}]`)
        if (actGroup) {
          actGroup.appendChild(itemNode)
        } else {
          this.element.appendChild(itemNode)
        }
      })

      // remove empty groups
      this.element.querySelectorAll(".donors__group").forEach(group => {
        if (group.children.length === 1) group.parentNode.removeChild(group)
      })
    })
  }
}
