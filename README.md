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

#### Running and serving a dev build

```
$ npm run dev

```

Browse to http://localhost:8080.

or, if you want to take full advantage of Netlify's local dev env (testing redirects and AWS Lambda functions):

```
$ netlify dev
```

In this case, browse to http://localhost:8888.

#### Running a prod build

```
npm run build
```

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
