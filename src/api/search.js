import { slugify, getLocale, getURLParams } from "../js/utils"
import config from "../data/siteConfig"
import { appState } from "../js/app"

// simplify and localize the Elastic server response
const transformResults = resp => {
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
      item.search_after = hit.sort
      item.donor = h.adomanyozo_name
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
  let url = appState("is-dev")
    ? `${config().ELASTIC_HOST_DEV}/elasticsearch_index_fortepandrupaldevelop_cwoou_media/_search?pretty`
    : `${config().ELASTIC_HOST}/elasticsearch_index_fortepandrupalmain_hd64t_media/_search?pretty`

  const q = getURLParams()
  if (q.esurl && q.esauth) {
    url = q.esurl
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(q.esurl && q.esauth ? q.esauth : "reader:r3adm31024read")}`,
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
        must_not: [],
      },
    }

    const sortOrder = params && params.reverseOrder ? "desc" : "asc"
    const sortOrderIverse = params && params.reverseOrder ? "asc" : "desc"

    const sort = [
      { year: { order: sortOrder } },
      {
        _script: {
          type: "string",
          script: {
            lang: "painless",
            source:
              "DateTimeFormatter df = DateTimeFormatter.ofPattern('yyyy-MM-dd'); return doc['created'].size()==0 ? '1970-01-01' : df.format(doc['created'].value);",
          },
          order: sortOrderIverse,
        },
      },
      { mid: { order: sortOrder } },
    ]

    const range = {
      range: {
        year: {
          gt: 0,
        },
      },
    }

    const buildCustomFieldQuery = (value, field, clause = "must") => {
      if (params.advancedSearch) {
        if (value === "null") {
          query.bool.must_not.push({ exists: { field: `${field}` } })
        } else {
          query.bool[clause].push({ wildcard: { [field]: `*${value}*` } })
        }
      } else {
        query.bool[clause].push({ term: { [field]: value } })
      }
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
    // then it'll search matches in adomanyozo, cimke, description, orszag, varos fields
    if (params.q && params.q !== "") {
      const words = params.q.split(", ")
      const fieldsToSearch = ["mid^5", "year^2", "description_search", "adomanyozo_search", "szerzo_search"]
      const availableFields = ["cimke", "orszag", "varos", "helyszin"]

      availableFields.forEach(s => fieldsToSearch.push(getLocale() === "hu" ? `${s}_search` : `${s}_en_search`))

      words.forEach(word => {
        query.bool.must.push({
          multi_match: {
            query: `${slugify(word)}`,
            fields: fieldsToSearch,
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
      buildCustomFieldQuery(slugify(params.tag), getLocale() === "hu" ? "cimke_search" : "cimke_en_search")
    }

    // get results without tags (advanced search)
    if (params.notags === "1") {
      query.bool.must_not.push({ exists: { field: getLocale() === "hu" ? "cimke_search" : "cimke_en_search" } })
    }

    // if there's a tag search attribute defined (advanced search)
    if (params.description) {
      buildCustomFieldQuery(slugify(params.description), "description_search")
    }

    // get results without description (advanced search)
    if (params.nodesc === "1") {
      const fields = ["description_search"]

      const localizedFields = ["orszag", "varos", "helyszin"]
      localizedFields.forEach(s => fields.push(getLocale() === "hu" ? `${s}_search` : `${s}_en_search`))

      fields.forEach(field => query.bool.must_not.push({ exists: { field } }))
    }

    // if there's a year search attribute defined (advanced search)
    if (params.year) {
      query.bool.must.push({ term: { year: `${params.year}` } })
    }

    // if there's a city search attribute defined (advanced search)
    if (params.place) {
      buildCustomFieldQuery(slugify(params.place), getLocale() === "hu" ? "helyszin_search" : "helyszin_en_search")
    }

    // if there's a city search attribute defined (advanced search)
    if (params.city) {
      buildCustomFieldQuery(slugify(params.city), getLocale() === "hu" ? "varos_search" : "varos_en_search")
    }

    // location is combining the city and place queries (advanced search)
    if (params.location) {
      buildCustomFieldQuery(
        slugify(params.location),
        getLocale() === "hu" ? "varos_search" : "varos_en_search",
        "should"
      )
      buildCustomFieldQuery(
        slugify(params.location),
        getLocale() === "hu" ? "helyszin_search" : "helyszin_en_search",
        "should"
      )

      // add a minimum should match parameter to the query in order to match at least one of the terms in the should clause
      if (params.advancedSearch && params.location !== "null") {
        query.bool.minimum_should_match = 1
      }
    }

    // if there's a country search attribute defined (advanced search)
    if (params.country) {
      buildCustomFieldQuery(slugify(params.country), getLocale() === "hu" ? "orszag_search" : "orszag_en_search")
    }

    // if there's a donor search attribute defined (advanced search)
    if (params.donor) {
      buildCustomFieldQuery(slugify(params.donor), "adomanyozo_search")
    }

    // if there's a photographer search attribute defined (advanced search)
    if (params.photographer) {
      buildCustomFieldQuery(slugify(params.photographer), "szerzo_search")
    }

    // if there's an id search attribute defined (advanced search)
    if (params.id) {
      const id = slugify(params.id)
      query.bool.must.push({ term: { mid: `${id}` } })
      if (params.year && params.created) {
        params.search_after = [slugify(params.year), slugify(params.created), slugify(params.id)]
      }
    }

    // if there's a year range defined (advanced search / range filter)
    if (params.year_from || params.year_to) {
      const y = {}
      if (params.year_from) y.gte = params.year_from
      if (params.year_to) y.lte = params.year_to
      range.range.year = y
    }

    // filtering for created date (from is included to is excluded)
    if (params.cfrom || params.cto) {
      const created = {}
      if (params.cfrom) created.gte = params.cfrom
      if (params.cto) created.lt = params.cto
      query.bool.must.push({
        range: {
          created,
        },
      })
    }

    // if there's a range set
    query.bool.must.push(range)

    // if there's exclusions
    if (params.exclude) {
      query.bool.must_not.push(...params.exclude)
    }

    const body = {
      size: params.size || 30,
      sort,
      track_total_hits: true,
      query,
    }

    if (params.search_after) {
      body.search_after = params.search_after
    } else {
      body.from = params.from || 0
    }

    if (params.from === 0) {
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
        ids: {
          values: array.map(item => `entity:media/${item}:hu`),
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
  getTotal,
  getDonators,
  getRandom,
  getDataById,
  getAggregatedYears,
}
