require("dotenv").config()

const { Client } = require("@elastic/elasticsearch")
const fs = require("fs")

const KEYS = {
  HU: ["orszag_name", "varos_name", "helyszin_name", "adomanyozo_name", "szerzo_name", "cimke_name"],
  EN: ["orszag_en", "varos_en", "helyszin_en", "adomanyozo_name", "szerzo_en", "cimke_en"],
}

const host = process.env.ELASTIC_HOST
const auth = process.env.ELASTIC_AUTH
if (!host || !auth) {
  console.error("Missing ELASTIC_HOST or ELASTIC_AUTH (see .env.example)")
  process.exit(1)
}
const node = new URL(host)
const i = auth.indexOf(":")
if (i === -1) {
  console.error("ELASTIC_AUTH must be user:password")
  process.exit(1)
}
node.username = auth.slice(0, i)
node.password = auth.slice(i + 1)

const client = new Client({ nodes: [node.toString()] })

const getKeywords = (key, callback, error) => {
  client.search(
    {
      index: "elasticsearch_index_fortepandrupalmain_hd64t_media",
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

const getSynonyms = (lang, callback, error) => {
  client.search(
    {
      index: "elasticsearch_index_fortepandrupalmain_hd64t_cimke",
      body: {
        size: 9999,
        query: {
          bool: {
            must: [
              {
                exists: {
                  field: "synonym",
                },
              },
              {
                term: {
                  _language: `${lang.toLowerCase()}`,
                },
              },
            ],
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

const saveAutocompleteLangFile = lang => {
  const keywords = {}
  const promises = []
  KEYS[lang].forEach(key => {
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

  promises.push(
    new Promise((resolve, reject) => {
      getSynonyms(
        lang,
        res => {
          const data = JSON.parse(res.body)

          if (data.hits.hits.length > 0) {
            keywords.synonyms = []
            data.hits.hits.forEach(hit => {
              // eslint-disable-next-line no-underscore-dangle
              const h = hit._source
              keywords.synonyms.push([h.name.toString(), ...h.synonym])
            })
          }
          resolve()
        },
        error => {
          reject(error)
        }
      )
    })
  )

  Promise.all(promises)
    .then(() => {
      fs.writeFile(`src/static/autocomplete-${lang.toLowerCase()}.json`, JSON.stringify(keywords), err => {
        if (err) console.log("error", err)
        else console.log(`Successfully wrote src/static/autocomplete-${lang.toLowerCase()}.json`)
      })
    })
    .catch(err => {
      console.log(err)
    })
}

Object.keys(KEYS).forEach(k => {
  saveAutocompleteLangFile(k)
})
