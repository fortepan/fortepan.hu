const { Client } = require("@elastic/elasticsearch")

const client = new Client({
  node: "http://fortepan:fortepan@v39241.php-friends.de:9200",
})

exports.handler = (event, context, callback) => {
  const requestBody = {
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

  client.search(
    {
      index: "elasticsearch_index_fortepan_media",
      body: requestBody,
    },
    (err, result) => {
      callback(null, {
        statusCode: err ? err.statusCode : result.statusCode,
        body: JSON.stringify(err ? err.body : result.body.aggregations.donors),
      })
    }
  )
}
