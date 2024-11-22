export default {
  fields: [
    {
      type: "string",
      name: "title",
      label: "Title",
    },
    {
      type: "rich-text",
      name: "body",
      label: "Általános szöveg",
      isBody: true,
    },
    {
      type: "object",
      name: "best_of_collections",
      label: "Best of collections",
      fields: [
        {
          type: "string",
          name: "title",
          label: "Title",
        },
        {
          type: "string",
          name: "caption",
          label: "Caption",
          ui: {
            component: "textarea",
          },
        },
        {
          type: "object",
          name: "content",
          label: "Content",
          list: true,
          fields: [
            {
              type: "string",
              name: "title",
              label: "Title",
            },
            {
              type: "number",
              name: "counter",
              label: "Counter",
            },
            {
              type: "string",
              name: "cover_image",
              label: "Cover image",
            },
            {
              type: "string",
              name: "url",
              label: "URL",
            },
          ],
        },
      ],
    },
    {
      type: "object",
      name: "blog",
      label: "Blog section",
      fields: [
        {
          type: "string",
          name: "title",
          label: "Title",
        },
        {
          type: "string",
          name: "caption",
          label: "Caption",
          ui: {
            component: "textarea",
          },
        },
        {
          type: "object",
          name: "action",
          label: "More button",
          fields: [
            {
              type: "string",
              name: "label",
              label: "Label",
            },
            {
              type: "string",
              name: "url",
              label: "URL",
            },
          ],
        },
      ],
    },
    {
      type: "object",
      name: "latest",
      label: "Recent uploads section",
      fields: [
        {
          type: "string",
          name: "title",
          label: "Title",
        },
        {
          type: "string",
          name: "caption",
          label: "Caption",
          ui: {
            component: "textarea",
          },
        },
        {
          type: "object",
          name: "action",
          label: "More button",
          fields: [
            {
              type: "string",
              name: "label",
              label: "Label",
            },
            {
              type: "string",
              name: "url",
              label: "URL",
            },
          ],
        },
      ],
    },
  ],
  label: "home",
  name: "home",
}
