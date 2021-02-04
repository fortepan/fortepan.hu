import { slugify, getLocale } from "../js/utils"
import config from "../data/siteConfig"

// transform and localize the Elastic server response
const transformResults = resp => {
  const l = getLocale()
  const r = {
    total: resp.hits.total.value,
    items: [],
  }

  if (resp.hits.hits.length > 0) {
    resp.hits.hits.forEach(hit => {
      // eslint-disable-next-line no-underscore-dangle
      const h = hit._source
      const item = {}
      item.year = h.year
      item.mid = h.mid
      item.uuid = h.uuid
      item.created = h.created
      item.description = h.description
      item.donor = l === "hu" ? h.adomanyozo_name : h.adomanyozo_en
      item.author = l === "hu" ? h.szerzo_name : h.szerzo_en
      item.tags = l === "hu" ? h.cimke_name : h.cimke_en
      item.country = l === "hu" ? h.orszag_name : h.orszag_en
      item.city = l === "hu" ? h.varos_name : h.varos_en
      item.place = l === "hu" ? h.helyszin_name : h.helyszin_en
      r.items.push(item)
    })
  }

  return r
}

const elasticRequest = async data => {
  const url = `${config.ELASTIC_HOST}/elasticsearch_index_fortepan_media/_search`
  const resp = await fetch(url, {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: {
      Authorization: `Basic ${btoa("fortepan:fortepan")}`,
      "Content-Type": "application/json;charset=UTF-8",
    },
    body: JSON.stringify(data),
  })

  return resp.json()
}

const search = params => {
  return new Promise((resolve, reject) => {
    // init the default query params
    const query = {
      bool: {
        must: [],
        should: [],
      },
    }

    const sort = [
      { year: { order: "asc" } },
      {
        _script: {
          type: "string",
          script: {
            lang: "painless",
            source:
              "DateTimeFormatter df = DateTimeFormatter.ofPattern('yyyy-MM-dd'); return doc['created'].size()==0 ? '1970-01-01' : df.format(doc['created'].value);",
          },
          order: "desc",
        },
      },
      { mid: { order: "asc" } },
    ]

    const range = {
      range: {
        year: {
          gt: 0,
        },
      },
    }

    // returns all records when query field is empty
    if (!params || (params && params.q === "")) {
      query.bool.must.push({ match_all: {} })
    }

    // set a query for getting the recently added items
    if (params.latest === "") {
      query.bool.must.push({
        range: {
          created: {
            gt: Date.parse(window.latestDate) / 1000,
          },
        },
      })
    }

    // if query (search term) exists
    // then it'll search matches in name, description, orszag_name, cimke_name, and varos_name fields
    // SHOULD means "OR" in elastic
    if (params.q && params.q !== "") {
      // const q = slugify(params.q)
      // query.bool.must.push({ match_phrase: { description_search: `${q}` } })
      const words = params.q.split(", ")
      words.forEach(word => {
        query.bool.must.push({
          multi_match: {
            query: `${slugify(word)}`,
            fields: ["mid^5", "year^2", "*_search"],
            type: "bool_prefix",
            lenient: true,
            operator: "and",
            tie_breaker: 0.8,
          },
        })
      })
    }

    // if there's a tag search attribute defined (advanced search)
    if (params.tag) {
      const tag = slugify(params.tag)
      query.bool.must.push(
        getLocale() === "hu" ? { term: { cimke_search: `${tag}` } } : { term: { cimke_en_search: `${tag}` } }
      )
    }

    // if there's a year search attribute defined (advanced search)
    if (params.year) {
      query.bool.must.push({ term: { year: `${params.year}` } })
    }

    // if there's a city search attribute defined (advanced search)
    if (params.place) {
      const place = slugify(params.place)
      query.bool.must.push(
        getLocale() === "hu" ? { term: { helyszin_search: `${place}` } } : { term: { helyszin_en_search: `${place}` } }
      )
    }

    // if there's a city search attribute defined (advanced search)
    if (params.city) {
      const city = slugify(params.city)
      query.bool.must.push(
        getLocale() === "hu" ? { term: { varos_search: `${city}` } } : { term: { varos_en_search: `${city}` } }
      )
    }

    // if there's a country search attribute defined (advanced search)
    if (params.country) {
      const country = slugify(params.country)
      query.bool.must.push(
        getLocale() === "hu" ? { term: { orszag_search: `${country}` } } : { term: { orszag_en_search: `${country}` } }
      )
    }

    // if there's a donor search attribute defined (advanced search)
    if (params.donor) {
      const donor = slugify(params.donor)
      query.bool.must.push({ term: { adomanyozo_search: `${donor}` } })
    }

    // if there's a photographer search attribute defined (advanced search)
    if (params.photographer) {
      const photographer = slugify(params.photographer)
      query.bool.must.push({ term: { szerzo_search: `${photographer}` } })
    }

    // if there's an id search attribute defined (advanced search)
    if (params.id) {
      const id = slugify(params.id)
      query.bool.must.push({ term: { mid: `${id}` } })
    }

    // if there's a year range defined (advanced search / range filter)
    if (params.year_from || params.year_to) {
      const y = {}
      if (params.year_from) y.gte = params.year_from
      if (params.year_to) y.lte = params.year_to
      range.range.year = y
    }

    // if there's a range set
    query.bool.must.push(range)

    // request 30 items from the Elastic server
    const body = {
      from: params.from || 0,
      size: params.size || 30,
      sort,
      track_total_hits: true,
      query,
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

    elasticRequest(body)
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

export default {
  search,
  getTotal,
  getDonators,
}
