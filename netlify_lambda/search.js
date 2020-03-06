const { Client } = require("@elastic/elasticsearch")

const client = new Client({
  node: "http://fortepan:fortepan@v39241.php-friends.de:9200",
})

const slugify = str => {
  let s = str.toString()

  const map = {
    a: "á|à|ã|â|À|Á|Ã|Â",
    e: "é|è|ê|É|È|Ê",
    i: "í|ì|î|Í|Ì|Î",
    o: "ó|ò|ö|ô|õ|ő|Ó|Ò|Ö|Ô|Õ|Ő",
    u: "ú|ù|û|ü|ű|Ú|Ù|Û|Ü|Ű",
    c: "ç|Ç",
    n: "ñ|Ñ",
  }

  s = s.toLowerCase()

  Object.keys(map).forEach(pattern => {
    s = s.replace(new RegExp(map[pattern], "g"), pattern)
  })

  return s
}

exports.handler = (event, context, callback) => {
  const params = event.queryStringParameters

  const query = {
    bool: {
      must: [],
      should: [],
    },
  }

  // returns all records when query field is empty
  if (!params || (params && params.q === "")) {
    query.bool.must.push({ match_all: {} })
  }

  // if query (search term) exists
  // then it'll search matches in name, description, orszag_name, cimke_name, and varos_name fields
  // SHOULD means "OR" in elastic
  if (params.q && params.q !== "") {
    const q = slugify(params.q)
    // query.bool.must.push({ match_phrase: { description_search: `${q}` } })
    query.bool.must.push({
      multi_match: {
        query: `${q}`,
        fields: ["mid^5", "year^2", "*_search"],
        type: "most_fields",
        lenient: true,
        operator: "and",
      },
    })
  }

  // if there's a tag search attribute defined (advanced search)
  if (params.tag) {
    const tag = slugify(params.tag)
    query.bool.must.push({ term: { cimke_search: `${tag}` } })
  }

  // if there's a year search attribute defined (advanced search)
  if (params.year) {
    query.bool.must.push({ term: { year: `${params.year}` } })
  }

  // if there's a city search attribute defined (advanced search)
  if (params.place) {
    const place = slugify(params.place)
    query.bool.must.push({ term: { helyszin_search: `${place}` } })
  }

  // if there's a city search attribute defined (advanced search)
  if (params.city) {
    const city = slugify(params.city)
    query.bool.must.push({ term: { varos_search: `${city}` } })
  }

  // if there's a country search attribute defined (advanced search)
  if (params.country) {
    const country = slugify(params.country)
    query.bool.must.push({ term: { orszag_search: `${country}` } })
  }

  // if there's a donor search attribute defined (advanced search)
  if (params.donor) {
    const donor = slugify(params.donor)
    query.bool.must.push({ term: { adomanyozo_search: `${donor}` } })
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

    const range = {
      range: {
        year: y,
      },
    }

    query.bool.must.push(range)
  }

  const requestBody = {
    from: params.from || 0,
    size: params.size || 30,
    sort: [{ year: { order: "asc" } }, { mid: { order: "asc" } }],
    track_total_hits: true,
    query,
  }

  console.log(JSON.stringify(requestBody))

  client.search(
    {
      index: "elasticsearch_index_fortepan_media",
      body: requestBody,
    },
    (err, result) => {
      callback(null, {
        statusCode: err ? err.statusCode : result.statusCode,
        body: JSON.stringify(err ? err.body : result.body),
      })
    }
  )
}

/*
Adomanyozok request
{
  "aggs" : {
    "adomanyozok" : {
      "terms" : {
        "field" : "adomanyozo_name",
        "size":10000,
        "order": {"_key":"asc"}
       }
    }
  },
  "size": 0
} */
