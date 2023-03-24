export default {
  fields: [
    {
      type: "string",
      name: "layout",
      label: "layout",
      disabled: true,
    },
    {
      type: "string",
      name: "title",
      label: "title",
    },
    {
      type: "string",
      name: "permalink",
      label: "permalink",
    },
    {
      type: "rich-text",
      name: "body",
      label: "Body of Document",
      description: "This is the markdown body",
      isBody: true,
    },
  ],
  label: "article",
  name: "article",
}
