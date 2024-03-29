export default {
  fields: [
    {
      type: "string",
      name: "title",
      label: "title",
    },
    {
      type: "rich-text",
      name: "body",
      label: "Body of Document",
      description: "This is the markdown body",
      isBody: true,
    },
    {
      type: "object",
      name: "projects",
      label: "Projects",
      list: true,
      fields: [
        {
          type: "string",
          name: "title",
          label: "title",
        },
        {
          type: "string",
          name: "project_date",
          label: "project_date",
        },
        {
          type: "string",
          name: "description",
          label: "description",
          ui: {
            component: "textarea",
          },
        },
        {
          type: "string",
          name: "funding_info",
          label: "funding_info",
          ui: {
            component: "textarea",
          },
        },
        {
          type: "image",
          name: "funding_logo",
          label: "funding_logo",
        },
      ],
    },
  ],
  label: "projects",
  name: "projects",
}
