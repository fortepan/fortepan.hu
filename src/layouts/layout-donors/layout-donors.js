import searchAPI from "../../api/search"

const ALPHABET = {
  hu: [
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
  ],
}

class LayoutDonors extends HTMLElement {
  // generate all groups
  constructor() {
    super()
    this.lang = document.querySelector("body").dataset.lang
    this.renderContent()
  }

  renderContent() {
    searchAPI.getDonors(
      function(data) {
        // render alphabet groups
        ALPHABET[this.lang].forEach(
          function(letter) {
            const group = document.createElement("div")
            group.dataset.group = letter
            group.className = "layout-donors__group"
            this.appendChild(group)

            const groupHeading = document.createElement("h3")
            groupHeading.textContent = letter
            group.appendChild(groupHeading)
          }.bind(this)
        )

        const dataSorted = data.aggregations.donors.buckets.sort((a, b) => {
          return a.key.localeCompare(b.key, "hu", { ignorePunctuation: false })
        })

        dataSorted.forEach(
          function(itemData) {
            // create link node
            const itemNode = document.createElement("a")
            itemNode.innerHTML = `<span class="layout-donors__donor__name">${itemData.key}</span><span class="layout-donors__donor__doc-count">(${itemData.doc_count})</span>`
            itemNode.href = `/${document.querySelector("body").dataset.lang}/photos/?donor=${encodeURIComponent(
              itemData.key
            )}`
            itemNode.className = "layout-donors__donor"

            // find group id
            let groupId
            ALPHABET[this.lang].forEach(letter => {
              if (itemData.key.toLowerCase().indexOf(letter.toLowerCase()) === 0) groupId = letter
            })

            // inject item into the corresponding group
            const actGroup = document.querySelector(`.layout-donors__group[data-group=${groupId}]`)
            if (actGroup) {
              actGroup.appendChild(itemNode)
            } else {
              this.appendChild(itemNode)
            }
          }.bind(this)
        )

        // remove empty groups
        document.querySelectorAll(".layout-donors__group").forEach(group => {
          if (group.children.length === 1) group.parentNode.removeChild(group)
        })
      }.bind(this)
    )
  }
}
window.customElements.define("layout-donors", LayoutDonors)
