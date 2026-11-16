import { slugify, getLocale, getURLParams, getOrg } from "../js/utils"
import config from "../data/siteConfig"
import { appState } from "../js/app"

// simplify and localize the Elastic server response
const transformResults = (resp, offset = 0) => {
  const l = getLocale()
  const r = {
    total: resp.hits.total.value,
    items: [],
  }

  // adding the aggregated years (photo count per all year in search range) to the results
  if (resp.aggregations && resp.aggregations.years && resp.aggregations.years.buckets) {
    r.years = []
    resp.aggregations.years.buckets.forEach(year => {
      if (year.key > 0) {
        r.years.push({ year: year.key, count: year.doc_count })
      }
    })
  }

  if (resp.aggregations && resp.aggregations.clusters && resp.aggregations.clusters.buckets) {
    r.clusters = resp.aggregations.clusters.buckets
  }

  if (resp.hits.hits.length > 0) {
    resp.hits.hits.forEach((hit, index) => {
      // eslint-disable-next-line no-underscore-dangle
      const h = hit.source
      const item = {}

      item.id = hit.id
      item.year = h.year
      item.mid = h.mid
      item.photo = h.photo
      item.uuid = h.uuid
      item.created = h.created
      item.description = h.description
      item.order = hit.order !== undefined ? Number(hit.order) : offset + index
      item.donor = h.adomanyozo_name
      item.author = hit.author
      item.tags = h.tags
      item.country = h.country
      item.city = h.city
      item.place = h.place
      item.approximate = h.approximate

      if (h.locations && h.locations.length) {
        const location = h.locations.find(item => item.shooting_location) || h.locations[0]
        item.location = { lat: Number(location.lat), lon: Number(location.lon) }
      }

      r.items.push(item)
    })
  }

  return r
}

const getMenu = async () => {
  let url = `${config.BACKEND}/api/menus`
  const org = { org: getOrg() }
  const lang = { lang: getLocale()} 
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      Accept: "application/json",
    },
    body: JSON.stringify({ ...org, ...lang }),
  })
  return resp.json()
}

const totalRequest = async data => {
  let url = `${config.BACKEND}/api/media/get-total`
  const org = { org: getOrg() }
  const lang = { lang: getLocale()} 
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      Accept: "application/json",
    },
    body: JSON.stringify({ data, ...org, ...lang }),
  })

  return resp.json()

}

const elasticRequest = async data => {
  let url = appState("is-dev")
    ? `${config.BACKEND_DEV}/elasticsearch_index_fortepandrupaldevelop_cwoou_media/_search?pretty`
    : `${config.BACKEND}/api/media/search`

  const q = getURLParams()
  if (q.esurl && q.esauth) {
    url = q.esurl
  }
  const org = { org: getOrg() }
  const lang = { lang: getLocale()} 
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(q.esurl && q.esauth ? q.esauth : "reader:r3adm31024read")}`,
      "Content-Type": "application/json;charset=UTF-8",
      Accept: "application/json",
    },
    body: JSON.stringify({ data, ...org, ...lang }),
  })

  return resp.json()
}

const staticRequest = async data => {
  let url = appState("is-dev")
    ? `${config.BACKEND_DEV}/elasticsearch_index_fortepandrupaldevelop_cwoou_media/_search?pretty`
    : `${config.BACKEND}/api/contents/view`

  const q = getURLParams()
  if (q.esurl && q.esauth) {
    url = q.esurl
  }
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      // Authorization: `Basic ${btoa(q.esurl && q.esauth ? q.esauth : "reader:r3adm31024read")}`,
      "Content-Type": "application/json;charset=UTF-8",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  })

  return resp.json()
}


const landingRequest = async data => {
  let url = appState("is-dev")
    ? `${config.BACKEND_DEV}/api/homepages/view`
    : `${config.BACKEND}/api/homepages/view`

    const q = getURLParams()
    if (q.esurl && q.esauth) {
      url = q.esurl
    }
    
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  })

  return resp.json()
}

const search = params => {
  return new Promise((resolve, reject) => {
    // init the default query params
    const query = {
      where: [],
      matching: [],
      sort: [],
      multi: []
    }
    
    const sort = [
      { field: "Media.year", order: "asc" },
      { field: "Media.id", order: "asc" },
    ]

    // returns all records when query field is empty
    if (!params || (params && params.q === "")) {
      query.match_all = true;
      // Why need a filter if we are not filtering?
      // query.bool.must.push({ match_all: {} })
    }

    // set a query for getting the recently added items
    if (params.latest === "") {
      query.where.push({ "latest IS": true })
      // Why need?
      // query.bool.must.push({
      //   range: {
      //     created: {
      //       gt: Date.parse(window.latestDate) / 1000,
      //     },
      //   },
      // })
    }

    // if query (search term) exists
    // then it'll search matches in adomanyozo, cimke, description, orszag, varos fields
    if (params.q && params.q !== "") {
      const words = params.q.split(", ")
      const fieldsToSearch = ["mid^5", "year^2", "description_search", "adomanyozo_search", "szerzo_search"]
      const availableFields = ["cimke", "orszag", "varos", "helyszin"]

      availableFields.forEach(s => fieldsToSearch.push(getLocale() === "hu" ? `${s}_search` : `${s}_en_search`))

      words.forEach(word => {
        query.multi.push(word)
        // query.bool.must.push({
        //   multi_match: {
        //     query: ,
        //     fields: fieldsToSearch,
        //     type: "bool_prefix",
        //     lenient: true,
        //     operator: "and",
        //     tie_breaker: 0.8,
        //   },
        // })
      })
    }

    // if there's a tag search attribute defined (advanced search)
    if (params.tag) {
      const tag = params.tag
      query.matching.push({ model: "Tags", field: "name", value: `${tag}` })
    }

    // if there's a year search attribute defined (advanced search)
    if (params.year) {
      query.where.push({ year: `${params.year}` })
    }

    // if there's a city search attribute defined (advanced search)
    if (params.place) {
      const place = params.place
      query.matching.push({ model: "Places", field: "name", value: `${place}` })
    }

    // if there's a city search attribute defined (advanced search)
    if (params.city) {
      const city = params.city
      query.matching.push({ model: "Localities", field: "name", value: `${city}` })
    }

    // if there's a country search attribute defined (advanced search)
    if (params.country) {
      const country = params.country
      query.matching.push({ model: "Countries", field: "name", value: `${country}` })
    }

    // if there's a donor search attribute defined (advanced search)
    if (params.donor) {
      const donor = params.donor
      query.matching.push({ model: "Donors", field: "name", value: `${donor}` })
    }

    // if there's a photographer search attribute defined (advanced search)
    if (params.photographer) {
      const photographer = params.photographer
      query.where.push({ "author": photographer })
    }

    // if there's an id search attribute defined (advanced search)
    if (params.id) {
      const id = params.id
      query.where.push({ "Media.id": `${id}` })
    }

    // if there's a year range defined (advanced search / range filter)
    if (params.year_from || params.year_to) {
      if (params.year_from) query.where.push({ "Media.year >=": `${params.year_from}` })
      if (params.year_to) query.where.push({ "Media.year <=": `${params.year_to}` })
    }

    if (params.gb) {
      const [north, west, south, east] = params.gb.split(",").map(Number)
      if ([north, west, south, east].every(Number.isFinite)) {
        query.map = {
          bounds: { north, south, east, west },
          clustered: params.clustered === true || params.clustered === "true",
          precision: Number(params.gz) || 10,
        }
      }
    }
    // if there's a range set

    const body = {
      size: params.size || 30,
      offset: Number(params.offset) || 0,
      sort,
      track_total_hits: true,
      query,
    }

    if (body.offset === 0 && !params.disableAggregatedYears) {
      body.aggs = {
        years: {
          terms: {
            field: "year",
            size: 100000,
            order: { _key: "asc" },
          },
        },
      }
    }

    elasticRequest(body)
      .then(resp => {
        resolve(transformResults(resp, body.offset))
      })
      .catch(err => {
        reject(err)
      })
  })
}

// get the total number of published photos
const getTotal = () => {
  return new Promise((resolve, reject) => {
    const body = {
      size: 0,
      track_total_hits: true,
      query: {
        bool: {
          must: [
            {
              match_all: {},
            },
            {
              range: {
                year: {
                  gt: 0,
                },
              },
            },
          ],
        },
      },
    }

    totalRequest(body)
      .then(resp => {
        resolve(transformResults(resp))
      })
      .catch(err => {
        reject(err)
      })
  })
}

// get an aggregated list of all donators
const getDonators = () => {
  return new Promise((resolve, reject) => {
    const body = {
      size: 0,
      aggs: {
        donors: {
          terms: {
            field: "adomanyozo_name",
            size: 10000,
            order: { _key: "asc" },
          },
        },
      },
    }

    elasticRequest(body)
      .then(resp => {
        resolve(resp)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// get a static page from the backend
const getStatic = slug => {
  return new Promise((resolve, reject) => {
    const body = {
      content: slug,
      org: getOrg(),
      lang: getLocale()
    }

    staticRequest(body)
      .then(resp => {
        resolve(resp)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// get a static landing page for the organization
const getLanding = slug => {
  return new Promise((resolve, reject) => {
    const body = {
      org: getOrg(),
      lang: getLocale()
    }

    landingRequest(body)
      .then(resp => {
        resolve(resp)
      })
      .catch(err => {
        reject(err)
      })
  })
}

// get a random records from Elastic
const getRandom = (size = 1) => {
  return new Promise((resolve, reject) => {
    const body = {
      size,
      query: {
        function_score: {
          query: {
            bool: {
              must: [
                {
                  match_all: {},
                },
                {
                  range: {
                    year: {
                      gt: 0,
                    },
                  },
                },
              ],
            },
          },
          functions: [
            {
              random_score: {
                seed: Math.round(Math.random() * 100000000).toString(),
              },
            },
          ],
        },
      },
    }

    elasticRequest(body)
      .then(resp => {
        resolve(transformResults(resp))
      })
      .catch(err => {
        reject(err)
      })
  })
}

const getDataById = array => {
  return new Promise((resolve, reject) => {
    const body = {
      size: array.length,
      query: {
        id: {
          values: array.map(item => item),
        },
      },
    }

    elasticRequest(body)
      .then(resp => {
        resolve(transformResults(resp))
      })
      .catch(err => {
        reject(err)
      })
  })
}

const getAggregatedYears = () => {
  return new Promise((resolve, reject) => {
    const body = {
      aggs: {
        years: {
          terms: {
            field: "year",
            size: 100000,
            order: { _key: "asc" },
          },
        },
      },
    }

    elasticRequest(body)
      .then(resp => {
        resolve(transformResults(resp))
      })
      .catch(err => {
        reject(err)
      })
  })
}

export default {
  search,
  getMenu,
  getTotal,
  getDonators,
  getStatic,
  getLanding,
  getRandom,
  getDataById,
  getAggregatedYears,
}
