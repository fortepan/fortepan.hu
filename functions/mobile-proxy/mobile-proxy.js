// for a full working demo of Netlify Identity + Functions, see https://netlify-gotrue-in-react.netlify.com/

const fetch = require("node-fetch")
exports.handler = async function(event, context) {
  if (!context.clientContext && !context.clientContext.identity) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        msg: "No identity instance detected. Did you enable it?",
      }), // Could be a custom message or object i.e. JSON.stringify(err)
    }
  }
  const { identity, user } = context.clientContext
  const params = Object.keys(event.queryStringParameters)
    .map(key => {
      return `${key}=${encodeURIComponent(event.queryStringParameters[key])}`
    })
    .join("&")

  try {
    const response = await fetch(`http://app.fortepan.hu/${event.path}?${params}`)
    if (!response.ok) {
      // NOT res.status >= 200 && res.status < 300
      return { statusCode: response.status, body: response.statusText }
    }
    const data = await response.text()

    return {
      statusCode: 200,
      body: data,
    }
  } catch (err) {
    console.log(err) // output to netlify function log
    return {
      statusCode: 500,
      body: JSON.stringify({ msg: err.message }), // Could be a custom message or object i.e. JSON.stringify(err)
    }
  }
}
