const { Client } = require("@elastic/elasticsearch")

const client = new Client({
  node: "http://fortepan:fortepan@v39241.php-friends.de:9200",
})

exports.handler = (event, context, callback) => {
  const requestBody = {
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

  client.search(
    {
      index: "elasticsearch_index_fortepan_media",
      body: requestBody,
    },
    (err, result) => {
      callback(null, {
        statusCode: err ? err.statusCode : result.statusCode,
        body: JSON.stringify(err ? err.body : result.body.hits.total),
      })
    }
  )
}
