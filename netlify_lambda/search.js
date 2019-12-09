const { Client } = require("@elastic/elasticsearch")

const client = new Client({
  node: "http://fortepan:fortepan@v39241.php-friends.de:9200",
})

exports.handler = (event, context, callback) => {
  const params = event.queryStringParameters

  const requestBody = {
    from: params.from || 0,
    size: params.size || 30,
  }

  if (params.q) {
    requestBody.query = {
      multi_match: {
        query: params.q || "",
        fields: ["description", "cimke_name", "varos_name"],
        fuzziness: "AUTO",
      },
    }
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
