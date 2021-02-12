import { Controller } from "stimulus"
import listsAPI from "../../api/lists"
import searchAPI from "../../api/search"

export default class extends Controller {
  connect() {
    /*listAPI.createList("test").then(resp => {
      console.log(resp)
    })*/

    listsAPI.getLists().then(res => {
      console.log(res)
    })
  }
}
