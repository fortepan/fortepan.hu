const { Client } = require("@elastic/elasticsearch")

const client = new Client({
  node: "http://fortepan:fortepan@v39241.php-friends.de:9200",
})

exports.handler = (event, context, callback) => {
  const params = event.queryStringParameters

  const query = {
    bool: {
      must: {
        match_all: {},
      },
    },
  }

  if (params.q) {
    if (!query.bool.should) {
      query.bool.should = []
      query.bool.minimum_should_match = 1
    }
    query.bool.should.push({ term: { description: `${params.q}*` } })
    query.bool.should.push({ term: { name: `${params.q}*` } })
    query.bool.should.push({ term: { varos_name: `${params.q}*` } })
    query.bool.should.push({ term: { orszag_name: `${params.q}*` } })
    query.bool.should.push({ term: { cimke_name: `${params.q}*` } })
  }

  if (params.tag) {
    if (!query.bool.should) {
      query.bool.should = []
      query.bool.minimum_should_match = 1
    }
    query.bool.should.push({ term: { cimke_name: `${params.tag}` } })
  }

  if (params.year) {
    if (!query.bool.should) {
      query.bool.should = []
      query.bool.minimum_should_match = 1
    }
    query.bool.should.push({ term: { year: `${params.year}` } })
  }

  if (params.city) {
    if (!query.bool.should) {
      query.bool.should = []
      query.bool.minimum_should_match = 1
    }
    query.bool.should.push({ term: { varos_name: `${params.city}` } })
  }

  if (params.country) {
    if (!query.bool.should) {
      query.bool.should = []
      query.bool.minimum_should_match = 1
    }
    query.bool.should.push({ term: { orszag_name: `${params.country}` } })
  }

  if (params.donor) {
    if (!query.bool.should) {
      query.bool.should = []
      query.bool.minimum_should_match = 1
    }
    query.bool.should.push({ term: { donor: `${params.name}` } })
  }

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
    sort: "year",
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
