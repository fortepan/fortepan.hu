const { Client } = require("@elastic/elasticsearch")

const client = new Client({
  node: "http://fortepan:fortepan@v39241.php-friends.de:9200",
})

exports.handler = (event, context, callback) => {
  const params = event.queryStringParameters

  let query = { match_all: {} }

  if (params.q) {
    query = {
      simple_query_string: {
        query: `${params.q}*`,
        fields: ["description^5", "*_name", "name"],
      },
    }
  }

  if (params.tag) {
    if (!params.q)
      query = {
        simple_query_string: {
          fields: ["cimke_name"],
          query: `"${params.tag}"`,
        },
      }
  }

  if (params.year) {
    if (!params.q)
      query = {
        simple_query_string: {
          fields: ["year"],
          query: params.year,
        },
      }
  }

  if (params.city) {
    if (!params.q)
      query = {
        simple_query_string: {
          fields: ["varos_name"],
          query: `"${params.city}"`,
        },
      }
  }

  if (params.country) {
    if (!params.q)
      query = {
        simple_query_string: {
          fields: ["orszag_name"],
          query: `"${params.country}"`,
        },
      }
  }

  if (params.donor) {
    if (!params.q)
      query = {
        simple_query_string: {
          fields: ["name"],
          query: `"${params.donor}"`,
        },
      }
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
