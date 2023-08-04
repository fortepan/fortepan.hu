module.exports = () => {
  return {
    ENV: process.env.ENV,
    SITE: "https://www.fortepan.hu",
    SITE_DEV: "http://localhost:8888",
    DRUPAL_HOST: "https://backend.fortepan.hu",
    ELASTIC_HOST: "https://elastic.fortepan.hu",
    DRUPAL_HOST_DEV: "https://backend-develop.fortepan.hu",
    ELASTIC_HOST_DEV: "https://elastic-develop.fortepan.hu",
    PHOTO_SOURCE: "https://fortepan.download/_photo/",
    PHOTO_SOURCE_LARGE: "https://fortepan.download/_photo/download/fortepan_",
    THUMBNAILS_QUERY_LIMIT: 40,
    BREAKPOINT_PHONE_XS: 360,
    BREAKPOINT_PHONE_SM: 480,
    BREAKPOINT_PHONE: 640,
    BREAKPOINT_TABLET: 768,
    BREAKPOINT_DESKTOP: 1024,
    BREAKPOINT_DESKTOP_LG: 1220,
    CAROUSEL_SLIDESHOW_DELAY: 4000,
    DEFAULT_THEME: "light",
    LOCALES: {
      hu: "Magyar",
      en: "English",
    },
    AGE_RESTRICTION_TAG: "18+",
  }
}
