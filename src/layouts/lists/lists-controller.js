import { Controller } from "stimulus"
import listAPI from "../../api/lists"

export default class extends Controller {
  connect() {
    /*listAPI.createList("test").then(resp => {
      console.log(resp)
    })*/
    listAPI.getLists().then(res => {
      console.log(res)
    })
  }
}
