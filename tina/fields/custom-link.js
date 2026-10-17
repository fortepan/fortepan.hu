import React from "react"
import { TextField } from "tinacms"

// Text field that is only rendered while a sibling boolean field (the switch) is on.
// The stored value is kept when hidden, so switching back on restores it.
const conditionalTextField = (toggleName) => {
  const ConditionalTextField = (props) => {
    const { input, form } = props
    const togglePath = input.name.replace(/[^.]+$/, toggleName)

    const [isEnabled, setIsEnabled] = React.useState(() => Boolean(form.getFieldState(togglePath)?.value))

    // Listen to the switch field only, not to every change in the form
    React.useEffect(
      () =>
        form.registerField(togglePath, ({ value }) => setIsEnabled(Boolean(value)), { value: true }, { silent: true }),
      [form, togglePath]
    )

    if (!isEnabled) return null
    return React.createElement(TextField, props)
  }

  return ConditionalTextField
}

// Switch + link field pair for one upload action button
export const customLinkFields = (key, switchLabel) => [
  {
    name: `${key}_custom_link_enabled`,
    label: switchLabel,
    type: "boolean",
  },
  {
    name: `${key}_custom_link`,
    label: "Egyedi link URL",
    description: "Ha ki van töltve, a gomb erre a linkre mutat az automatikusan generált helyett",
    type: "string",
    ui: {
      component: conditionalTextField(`${key}_custom_link_enabled`),
    },
  },
]
