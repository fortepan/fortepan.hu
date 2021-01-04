import { Application } from "stimulus"
import { definitionsFromContext } from "stimulus/webpack-helpers"

/**
 * Automatically require():
 * 1. *{_-}controller.js files in components/
 * 2. *{_-}controller.js files in layouts/
 */
const application = Application.start()
const definitions = [
  ...definitionsFromContext(require.context("../components/", true, /[_-]controller\.js$/)),
  ...definitionsFromContext(require.context("../layouts/", true, /[_-]controller\.js$/)),
]

/**
 * When mapping controller files to identifiers, Stimulus replaces
 * forward slashes in the controller’s path with two dashes, such as:
 *   users/list_item_controller.js -> users--list-item
 *
 * Instead, we want this in the /components and /layouts folders:
 *   dropdown/dropdown_controller.js -> dropdown
 */
definitions.forEach(definition => {
  const parts = definition.identifier.split("--")
  if (parts.length >= 2 && parts[parts.length - 1] === parts[parts.length - 2]) {
    definition.identifier = parts.slice(0, -1).join("--")
  }
})

application.load(definitions)
