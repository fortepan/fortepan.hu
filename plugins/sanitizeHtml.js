const sanitizeHtml = require("sanitize-html")

const CMS_HTML_OPTIONS = {
  allowedTags: [
    "a",
    "b",
    "blockquote",
    "br",
    "code",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "i",
    "img",
    "li",
    "ol",
    "p",
    "pre",
    "span",
    "strong",
    "u",
    "ul",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel", "class", "style"],
    img: ["src", "alt", "width", "height", "loading", "style"],
    span: ["class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedStyles: {
    a: {
      display: [/^inline-block$/],
    },
    img: {
      width: [/^\d+(?:px|%)$/],
      height: [/^auto$/, /^\d+(?:px|%)$/],
    },
  },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
}

module.exports = html =>
  html
    ? sanitizeHtml(html, CMS_HTML_OPTIONS)
    : ""
