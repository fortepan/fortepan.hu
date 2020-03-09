import { ready, slugify } from "../../utils"

let donorsNode = null

const alphabet = [
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

const loadDonors = () => {
  return new Promise((resolve, reject) => {
    // generate all groups

    fetch(`/.netlify/functions/donors`, {
      method: "GET",
    }).then(response => {
      alphabet.forEach(letter => {
        const group = document.createElement("div")
        group.dataset.group = letter
        group.className = "donors__group"
        donorsNode.appendChild(group)

        const groupHeading = document.createElement("h3")
        groupHeading.textContent = letter
        group.appendChild(groupHeading)
      })

      response
        .json()
        .then(data => {
          const dataSorted = data.buckets.sort((a, b) => {
            return a.key.localeCompare(b.key, "hu", { ignorePunctuation: false })
          })

          dataSorted.forEach(itemData => {
            // create link node
            const itemNode = document.createElement("a")
            itemNode.innerHTML = `<span class="donors__donor__name">${itemData.key}</span><span class="donors__donor__doc-count">(${itemData.doc_count})</span>`
            itemNode.href = `/${donorsNode.dataset.lang}/photos/?donor=${encodeURIComponent(itemData.key)}`
            itemNode.className = "donors__donor"

            // find group id
            let groupId
            alphabet.forEach(letter => {
              if (itemData.key.toLowerCase().indexOf(letter.toLowerCase()) === 0) groupId = letter
            })

            const actGroup = document.querySelector(`.donors__group[data-group=${groupId}]`)
            if (actGroup) {
              actGroup.appendChild(itemNode)
            } else {
              donorsNode.appendChild(itemNode)
            }
          })

          // remove empty groups
          document.querySelectorAll(".donors__group").forEach(group => {
            if (group.children.length === 1) group.parentNode.removeChild(group)
          })

          resolve()
        })
        .catch(err => {
          reject(err)
        })
    })
  })
}

ready(() => {
  donorsNode = document.querySelector(".donors")
  if (donorsNode) {
    loadDonors().then(() => {})
  }
})
