export default {
  fields: [
    {
      type: "object",
      name: "projects",
      label: "Projects",
      list: true,
      ui: {
        component: "group-list",
        itemProps: item => ({
          label: item.title,
        }),
      },
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
          type: "rich-text",
          name: "description",
          label: "description",
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
          type: "string",
          name: "funding_logo",
          label: "funding_logo",
        },
      ],
    },
  ],
  label: "projects",
  name: "projects",
}
