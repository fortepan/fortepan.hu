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

#### Backend configuration (required for build and search)

Backend hosts, Elasticsearch index names and credentials are **not** stored in the repository — the
environment is the single source of truth. Copy [`.env.example`](.env.example) to `.env` and set:

- `DRUPAL_HOST` / `DRUPAL_HOST_DEV` — Drupal backend for the live site and for dev mode (`?dev=1`)
- `ELASTIC_HOST` / `ELASTIC_AUTH` — production Elasticsearch cluster (build script and live site)
- `ELASTIC_INDEX_MEDIA`, `ELASTIC_INDEX_LISTS`, `ELASTIC_INDEX_LIST_CONTENT`, `ELASTIC_INDEX_CIMKE` — production index
  names (`CIMKE` is only used by the autocomplete import script)
- `ELASTIC_HOST_DEV` / `ELASTIC_AUTH_DEV` and `ELASTIC_INDEX_MEDIA_DEV`, `ELASTIC_INDEX_LISTS_DEV`,
  `ELASTIC_INDEX_LIST_CONTENT_DEV` — dev cluster (dev mode via `?dev=1`)

Moving to a different backend is a change of these values only, no code change. On Netlify, values can be set per
deploy context or per branch to test another backend on a branch deploy.

On **Netlify**, set the same variables in Site settings → Environment variables. Deploy the `elastic-proxy` function and frontend together.

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
