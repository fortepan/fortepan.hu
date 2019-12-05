const querystring = require("querystring")
const axios = require("axios")

exports.handler = (event, context, callback) => {
  const params = JSON.parse(event.body)

  axios
    .get(`http://fortepan.hu/m/m.php?${querystring.stringify(params)}`)
    .then(res => {
      callback(null, {
        statusCode: 200,
        body: JSON.stringify(res.data),
      })
    })
    .catch(err => {
      callback(err)
    })
}
