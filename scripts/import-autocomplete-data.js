const { Client } = require("@elastic/elasticsearch")
const fs = require("fs")

const keywords = {}
const KEYS = ["orszag_name", "varos_name", "helyszin_name", "adomanyozo_name", "szerzo_name", "cimke_name"]

const client = new Client({
  nodes: [
    "http://fortepan:fortepan@v39241.php-friends.de:9200",
    "http://fortepan:fortepan@v39242.php-friends.de:9200",
    "http://fortepan:fortepan@v39243.php-friends.de:9200",
  ],
})

const getKeywords = (key, callback, error) => {
  client.search(
    {
      index: "elasticsearch_index_fortepan_media",
      body: {
        size: 0,
        aggs: {
          keywords: {
            terms: {
              field: key,
              size: 500000,
            },
          },
        },
      },
    },
    (err, result) => {
      if (err) {
        error({
          statusCode: err.statusCode,
          body: JSON.stringify(err.body),
        })
      } else {
        callback({
          statusCode: err ? err.statusCode : result.statusCode,
          body: JSON.stringify(err ? err.body : result.body),
        })
      }
    }
  )
}

const promises = []
KEYS.forEach(key => {
  keywords[key] = []
  promises.push(
    new Promise((resolve, reject) => {
      getKeywords(
        key,
        res => {
          const data = JSON.parse(res.body)
          data.aggregations.keywords.buckets.forEach(bucket => {
            keywords[key].push(bucket.key)
          })
          resolve()
        },
        error => {
          reject(error)
        }
      )
    })
  )
})

Promise.all(promises)
  .then(() => {
    fs.writeFile("src/static/autocomplete.json", JSON.stringify(keywords))
  })
  .catch(err => {
    console.log(err)
  })
