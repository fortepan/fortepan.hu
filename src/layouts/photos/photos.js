import { ready } from "../../app/app"

const Photo = function(data) {
  const thumbnail = document.importNode(document.getElementById("Thumbnail").content, true)
  const [, filename, year, country, city, place, title, , , ,] = data
  thumbnail.querySelector(".photos__thumbnail__meta--description").textContent = title
  const locationArray = []
  if (year) locationArray.push(year)
  if (country) locationArray.push(country)
  if (city) locationArray.push(city)
  if (place) locationArray.push(place)
  thumbnail.querySelector(".photos__thumbnail__meta--location").textContent = locationArray.join(" · ")
  thumbnail.querySelector(
    ".photos__thumbnail__image"
  ).style.backgroundImage = `url("http://fortepan.hu/_photo/display/${filename}.jpg")`

  thumbnail.querySelector(".photos__thumbnail").addEventListener("click", () => {
    console.log(data)
  })

  return thumbnail
}

const Photos = function(el) {
  const wrapper = el.querySelector(".photos__wrapper")

  this.init = async function() {
    const resp = await fetch("/.netlify/functions/search", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ query: "Busz", limit: 20, lang: "hu" }),
    })
    const data = await resp.json()

    data.data.forEach(itemData => {
      const thumbnail = new Photo(itemData)
      wrapper.append(thumbnail)
    })
  }
}

ready(() => {
  const photosNode = document.querySelector(".photos")
  if (photosNode) new Photos(photosNode).init()
})
