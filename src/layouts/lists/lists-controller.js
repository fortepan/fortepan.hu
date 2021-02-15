import { Controller } from "stimulus"
import listsAPI from "../../api/lists"
import searchAPI from "../../api/search"

export default class extends Controller {
  connect() {
    /* listAPI.createList("test").then(resp => {
      console.log(resp)
    }) */

    searchAPI.getRandom(3).then(res => {
      console.log(res)
    })

    listsAPI.getLists().then(res => {
      console.log(res)
    })
  }
}
