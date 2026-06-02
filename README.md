## Fortepan.hu

Fortepan is a copyright-free and community-based photo archive with over 100,000 photographs available for anyone to browse and download in high-resolution, free of charge. This repository contains the frontend source of the website and now it's opened for everyone to contribute and collaborate.

#### Technologies used

- Eleventy - Static site generator (https://11ty.dev)
- Liquid as the templating language
- Sass for writing CSS
- PostCSS + Autoprefixer for vendor prefixing CSS
- Webpack for compiling Sass and JavaScript assets
- Prettier, Stylelint, ESLint and Airbnb's base js linting configuration for basic code hyigene
- Stimulus - a very efficinent HTML-first frontend javascript framework by Basecamp (https://stimulus.hotwire.dev/)
- Vanilla Js

The website is hosted on Netlify, the admin team is using Forestry CMS for content management.

### Getting started

#### Install all dependencies using npm:

```
$ nvm use &
$ npm install
```

#### Elasticsearch credentials (required for build and search)

Credentials are **not** stored in the repository. Copy [`.env.example`](.env.example) to `.env` and set:

- `ELASTIC_HOST` / `ELASTIC_AUTH` — production cluster (build script and live site)
- `ELASTIC_HOST_DEV` / `ELASTIC_AUTH_DEV` — dev cluster at `elastic-develop.fortepan.hu` (local dev mode via `?dev=1`)

On **Netlify**, set the same variables in Site settings → Environment variables. Deploy the `elastic-proxy` function and frontend together.

**Security:** If credentials were ever committed to git, rotate them on Elasticsearch before deploying.

#### Running and serving a dev build

Photo search and lists call `/api/elastic/...`, which is served by a Netlify Function. Use:

```
$ netlify dev
```

Browse to http://localhost:8888 (with `.env` loaded for the function and build).

`npm run dev` alone (port 8080) does not proxy Elasticsearch; use `netlify dev` when testing search.

#### Running a prod build

```
npm run build
```

Requires `ELASTIC_HOST` and `ELASTIC_AUTH` (via `.env` or CI env) for the autocomplete import step.

HTTP security headers (CSP, HSTS, etc.) are defined in [`src/static/_headers`](src/static/_headers) and copied to `_dist` on build. Embed pages (`/hu/embed/*`, `/en/embed/*`) allow `frame-ancestors *` so third-party sites can iframe them.

#### Project structure

```
src/
  api/
    All Drupal auth and ElasticSearch related APIs
  components/
    All UI partials
  data/
    Eleventy data files
  js/
    App specific js helpers and utils
  layouts/
    Base page layouts and layout (stimulus) components
  pages/
    Localized page content in markdown format
  scss/
    All fortend theme related css files (scopes, tyopgraphy, layout, helpers, color vars)
  static/
    All static content used (images, files generated during build time, etc.)
```

Eleventy’s output will be generated to a `_dist` directory at the root level.
