const { Client } = require("@elastic/elasticsearch")

const client = new Client({
  node: "http://fortepan:fortepan@v39241.php-friends.de:9200",
})

const slugify = str => {
  let s = str.toString()

  const map = {
    "-": " |_|—",
    a: "á|à|ã|â|À|Á|Ã|Â",
    e: "é|è|ê|É|È|Ê",
    i: "í|ì|î|Í|Ì|Î",
    o: "ó|ò|ö|ô|õ|ő|Ó|Ò|Ö|Ô|Õ|Ő",
    u: "ú|ù|û|ü|ű|Ú|Ù|Û|Ü|Ű",
    c: "ç|Ç",
    n: "ñ|Ñ",
  }

  // s = s.toLowerCase()

  Object.keys(map).forEach(pattern => {
    s = s.replace(new RegExp(map[pattern], "g"), pattern)
  })

  return s
}

exports.handler = (event, context, callback) => {
  const params = event.queryStringParameters

  // returns all records
  const query = {
    bool: {
      must: {
        match_all: {},
      },
    },
  }

  // if query (search term) exists
  // then it'll search matches in name, description, orszag_name, cimke_name, and varos_name fields
  // SHOULD means "OR" in elastic
  if (params.q) {
    if (!query.bool.should) {
      query.bool.should = []
      query.bool.minimum_should_match = 1
    }

    const queryArray = slugify(params.q).split("-")
    queryArray.forEach(q => {
      query.bool.should.push({ term: { description_transliterated: `${q}` } })
      query.bool.should.push({ term: { adomanyozo_transliterated: `${q}` } })
      query.bool.should.push({ term: { varos_transliterated: `${q}` } })
      query.bool.should.push({ term: { orszag_transliterated: `${q}` } })
      query.bool.should.push({ term: { cimke_transliterated: `${q}` } })
      query.bool.should.push({ term: { cimke_syn_transliterated: `${q}` } })
      if (Number(q) > 0) {
        query.bool.should.push({ term: { mid: `${q}` } })
      }
    })
  }

  // if there's a tag search attribute defined (advanced search)
  if (params.tag) {
    if (!query.bool.should) {
      query.bool.should = []
      query.bool.minimum_should_match = 1
    }
    const tag = slugify(params.tag)
    query.bool.should.push({ term: { cimke_transliterated: `${tag}` } })
    query.bool.should.push({ term: { cimke_syn_transliterated: `${tag}` } })
  }

  // if there's a year search attribute defined (advanced search)
  if (params.year) {
    if (!query.bool.should) {
      query.bool.should = []
      query.bool.minimum_should_match = 1
    }
    query.bool.should.push({ term: { year: `${params.year}` } })
  }

  // if there's a city search attribute defined (advanced search)
  if (params.city) {
    if (!query.bool.should) {
      query.bool.should = []
      query.bool.minimum_should_match = 1
    }
    const city = slugify(params.city)
    query.bool.should.push({ term: { varos_transliterated: `${city}` } })
  }

  // if there's a country search attribute defined (advanced search)
  if (params.country) {
    if (!query.bool.should) {
      query.bool.should = []
      query.bool.minimum_should_match = 1
    }
    const country = slugify(params.country)
    query.bool.should.push({ term: { orszag_transliterated: `${country}` } })
  }

  // if there's a donor search attribute defined (advanced search)
  if (params.donor) {
    if (!query.bool.should) {
      query.bool.should = []
      query.bool.minimum_should_match = 1
    }
    const { donor } = params
    query.bool.should.push({ term: { adomanyozo_name: `${donor}` } })
  }

  // if there's a year range defined (advanced search / range filter)
  if (params.year_from || params.year_to) {
    const y = {}
    if (params.year_from) y.gte = params.year_from
    if (params.year_from) y.lte = params.year_to

    const filter = {
      range: {
        year: y,
      },
    }

    query.bool.filter = filter
  }

  const requestBody = {
    from: params.from || 0,
    size: params.size || 30,
    sort: [{ year: { order: "asc" } }, { old_id: { order: "asc" } }],
    track_total_hits: true,
    query,
  }

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
