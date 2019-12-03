const axios = require("axios")

exports.handler = (event, context, callback) => {
  axios
    .get("http://fortepan.hu/m/m.php?action=search_view&limit=5&lang=hu&q=")
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
