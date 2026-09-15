# Fortepan.hu — code conventions

Static-ish site built with Eleventy (liquid templates) + Stimulus + SCSS, bundled with Webpack.
Read this before touching `src/components/**` or `src/layouts/**`.

## Component anatomy

Each component lives in its own folder under `src/components/<name>/` (or nested, e.g.
`src/components/dialog/share/`) with up to three files sharing the folder/component name:

```
<name>/
  <name>.liquid              # markup partial, included via {% include %}
  <name>-controller.js        # Stimulus controller (only if the component has behavior)
  <name>.scss                 # styles (only if the component has its own styles)
```

Nested components use their own dash-joined name matching the folder, e.g.
`dialog/share/share-controller.js` registers as the `share` controller (see Stimulus registration
below, which strips the `--share--share`-style duplicate suffix).

SCSS files are never manually `@import`ed one by one — `src/scss/styles.scss` glob-imports
`components/**/*.scss` and `layouts/**/*.scss` automatically. Adding a `.scss` file next to a
`.liquid`/`-controller.js` file is enough for it to be picked up; nothing else needs wiring.

## Stimulus controllers

```js
import { Controller } from "@hotwired/stimulus"

import { trigger, isTouchDevice } from "../../js/utils"
import { setAppState, removeAppState, appState } from "../../js/app"

const HOVER_DELAY = 400          // UPPER_SNAKE_CASE module-level constants for magic numbers

export default class extends Controller {
  static get targets() {
    return ["overlay", "frame", "image"]
  }

  connect() {
    // reset/init all instance state here, even if just to null/false
    this.isPending = false
  }
  // ...
}
```

- `export default class extends Controller` — controllers are anonymous default exports, never
  named/exported classes.
- Declared with `static get targets() { return [...] }`, not the shorthand `static targets = []`
  class-field form.
- All mutable instance state is initialized in `connect()` (or an `init*()` helper called from
  it), not as class fields.
- Registration is automatic via `require.context` in [src/js/stimulus.js](src/js/stimulus.js) —
  any `*-controller.js` / `*_controller.js` under `components/` or `layouts/` is picked up; you
  never register a controller by hand.
- Method names read as event handlers or intents: `onThumbnailEnter`, `onCarouselTouchStart`,
  `show`/`hide`/`toggle`, `startClose`/`finishClose`. Private-ish helpers are still plain methods
  (no `#private` fields in this codebase).
- Cross-controller/global communication goes through custom events, never direct controller
  references:
  - Dispatch with `trigger("some:eventName", { detail-data })` from `js/utils.js`.
  - Listen via `data-action="some:eventName@document->controller#handler"` in the liquid markup
    (see below) — not `addEventListener` inside the controller, except for listeners that must be
    bound/unbound dynamically at runtime (e.g. a `wheel`/`transitionend` listener added only while
    a gesture is active).
  - Shared boolean "app state" (feature flags/modes like `is-lists`, `carousel-fullscreen`) lives
    as classes on `<body>`, read/written through `appState`/`setAppState`/`removeAppState`/
    `toggleAppState` in [src/js/app.js](src/js/app.js) — don't invent a parallel global-state
    mechanism.
- Timers: store the id on `this` (`this.hoverTimer`, `this.slideshowTimeout`) and always
  `clearTimeout`/`clearInterval` it before reassigning or on teardown.
- Utility imports come from `js/utils.js` (`trigger`, `getLocale`, `lang`, `isTouchDevice`,
  `escapeHTML`, `asArray`, …) and `js/app.js` (app-state helpers) — check there before writing a
  new helper.

## Liquid / markup wiring

- One `data-controller="name"` per controller, space-separated when a node hosts more than one
  (e.g. `data-controller="lists--photos"` for a nested `lists/photos` controller).
- `data-action` lists one `event->controller#method` (or `event@window/document->controller#method`
  for global listeners) per line, indented/aligned under the attribute for readability:
  ```liquid
  <div data-controller="photos"
       data-action="scroll->photos#onScroll
                    resize@window->photos#resizeThumbnails
                    thumbnail:loaded@document->photos#loadThumbnails"
  >
  ```
- Targets are `data-<controller>-target="name"` and read in JS as `this.<name>Target` /
  `this.<name>Targets`.
- A component's own markup is pulled in with `{% include component-folder/component-name.liquid %}`.
  Overlay/global components (carousel, dialogs, age-restriction template, header nav) are included
  once at the bottom of the layout file, as siblings after the main content `<div>`, not nested
  inside it — see [src/layouts/photos/photos.liquid](src/layouts/photos/photos.liquid).

## CSS / SCSS

- **Never inline styles for anything that is just a state/visibility/theme change.** Toggle a
  class from JS (`classList.add/remove/toggle`) and let the SCSS file own the resulting look and
  the transition:
  ```js
  this.element.classList.add("snackbar--show")   // JS only flips the class
  ```
  ```scss
  .snackbar {
    transition: opacity 0.5s $ease-out-expo, transform 0.5s $ease-out-expo;
    opacity: 0;
  }
  .snackbar--show {
    opacity: 1;
  }
  ```
  The only inline styles (`el.style.foo = ...`) that appear in the codebase are for values that
  are inherently computed at runtime and can't be expressed as a fixed class — measured pixel
  positions/widths/heights (`timeline-controller.js`, `header-nav-controller.js`), transform
  matrices for pinch-zoom/drag (`carousel-controller.js`), a per-photo `background-image` URL
  (`carousel-controller.js`, `home-controller.js`). Reach for a class toggle first; only fall back
  to inline styles when the value genuinely can't be known ahead of time in CSS.
- Shared design tokens are SCSS variables, not hardcoded values: colors (`$dark-base`, `$green`,
  `$red`, `$light-primary`, …) from `src/scss/colors.scss`, easing curves (`$ease-out-expo`,
  `$ease-out-cubic`, …) from `src/scss/animation.scss`, and the `torem(px)` function for px→rem.
  Reach for these before writing a literal color or `cubic-bezier(...)`.
  - Long-hand state classes commonly used: `is-visible`, `is-hidden`, `is-active`, `is-loaded`,
    `is-disabled`, `is-selected` — reuse these names for the same meaning rather than inventing
    new ones per component.
- Component SCSS is scoped by nesting under the component's root class (`.snackbar { ... }`,
  `.snackbar__close { ... }`), BEM-ish `block__element`/`block--modifier` naming, with theme
  variants handled via `.theme--light &` / `.theme--dark &` parent selectors (see
  `age-restriction.scss`, `autosuggest.scss`) rather than a separate stylesheet.

## JS style (enforced by eslint/prettier, see [.eslintrc.json](.eslintrc.json) / [.prettierrc](.prettierrc))

- No semicolons, double quotes, 2-space indent, print width 120, trailing commas (es5).
- Prefer `const`/arrow functions for free-standing helpers (`js/utils.js`), regular class methods
  (not arrow class fields) inside Stimulus controllers.
- Guard-clause / early-return style over deep nesting (`if (!thing) return`).
