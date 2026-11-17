const fetch = require("node-fetch")

// Index names come from the environment (see .env.example), read per request
const INDEX_ENV_VARS = {
  prod: {
    media: "ELASTIC_INDEX_MEDIA",
    lists: "ELASTIC_INDEX_LISTS",
    list_content: "ELASTIC_INDEX_LIST_CONTENT",
  },
  dev: {
    media: "ELASTIC_INDEX_MEDIA_DEV",
    lists: "ELASTIC_INDEX_LISTS_DEV",
    list_content: "ELASTIC_INDEX_LIST_CONTENT_DEV",
  },
}

const MAX_BODY_SIZE = 512 * 1024
const JSON_HEADERS = { "Content-Type": "application/json" }

const parseRoute = path => {
  const normalized = path
    .replace(/^.*\/elastic-proxy\/?/, "")
    .replace(/^\/api\/elastic\/?/, "")
    .replace(/^\//, "")

  const parts = normalized.split("/").filter(Boolean)
  if (parts.length !== 3 || parts[2] !== "_search") {
    return null
  }

  const [env, index] = parts
  if (!INDEX_ENV_VARS[env]?.[index]) {
    return null
  }

  return { env, indexName: process.env[INDEX_ENV_VARS[env][index]] }
}

exports.handler = async event => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" }
  }

  const route = parseRoute(event.path)
  if (!route) {
    return { statusCode: 400, headers: JSON_HEADERS, body: '{"error":"Invalid path"}' }
  }

  const isDev = route.env === "dev"
  const host = isDev ? process.env.ELASTIC_HOST_DEV : process.env.ELASTIC_HOST
  const auth = isDev ? process.env.ELASTIC_AUTH_DEV : process.env.ELASTIC_AUTH

  if (!host || !auth || !route.indexName) {
    return { statusCode: 500, headers: JSON_HEADERS, body: '{"error":"Misconfigured"}' }
  }

  const contentType = event.headers["content-type"] || event.headers["Content-Type"] || ""
  if (!contentType.includes("application/json")) {
    return { statusCode: 415, headers: JSON_HEADERS, body: '{"error":"JSON required"}' }
  }

  const body = event.body || ""
  if (body.length > MAX_BODY_SIZE) {
    return { statusCode: 413, headers: JSON_HEADERS, body: '{"error":"Too large"}' }
  }

  const url = `${host.replace(/\/$/, "")}/${encodeURIComponent(route.indexName)}/_search?pretty`

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(auth).toString("base64")}`,
        "Content-Type": "application/json;charset=UTF-8",
      },
      body: body || "{}",
    })

    const text = await response.text()

    return { statusCode: response.status, headers: JSON_HEADERS, body: text }
  } catch (err) {
    return { statusCode: 502, headers: JSON_HEADERS, body: '{"error":"Upstream failed"}' }
  }
}
