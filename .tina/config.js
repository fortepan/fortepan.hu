import { defineConfig } from "tinacms"

import projects from "./templates/projects"
import home from "./templates/home"
import article from "./templates/article"
import defaultTemplate from "./templates/default"

// Your hosting provider likely exposes this as an environment variable
// const branch = process.env.HEAD || process.env.VERCEL_GIT_COMMIT_REF || "master"

export default defineConfig({
  branch: "master",
  clientId: "5201a87a-dc24-4552-8b2e-3272e08089dd", // Get this from tina.io
  token: "ebb20c574667a9ccbad5fc85104e4cf4a3171ac0", // Get this from tina.io
  build: {
    outputFolder: "admin",
    publicFolder: "_dist",
  },
  media: {
    tina: {
      mediaRoot: "images",
      publicFolder: "_dist",
    },
  },
  schema: {
    collections: [
      {
        label: "Heti Fortepan",
        name: "hetifortepan",
        path: "src/data",
        match: {
          include: "blog_content",
        },
        format: "json",
        fields: [
          {
            name: "hu",
            label: "HU",
            type: "object",
            ui: {
              component: "group-list",
              itemProps: item => ({
                label: item.title,
              }),
            },
            fields: [
              {
                name: "date",
                label: "Dátum",
                type: "string",
              },
              {
                name: "cover_image",
                label: "Borítókép (mid)",
                type: "string",
              },
              {
                name: "title",
                label: "Cím",
                type: "string",
              },
              {
                name: "excerpt",
                label: "Leírás",
                type: "string",
                ui: {
                  component: "textarea",
                },
              },
              {
                name: "url",
                label: "URL",
                type: "string",
              },
            ],
            list: true,
          },
          {
            name: "en",
            label: "EN",
            type: "object",
            list: true,
            ui: {
              component: "group-list",
              itemProps: item => ({
                label: item.title,
              }),
            },
            fields: [
              {
                name: "date",
                label: "Dátum",
                type: "string",
              },
              {
                name: "cover_image",
                label: "Borítókép (id)",
                type: "string",
              },
              {
                name: "title",
                label: "Cím",
                type: "string",
              },
              {
                name: "excerpt",
                label: "Leírás",
                type: "string",
                ui: {
                  component: "textarea",
                },
              },
              {
                name: "url",
                label: "URL",
                type: "string",
              },
            ],
          },
        ],
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
        },
      },
      {
        label: "HU oldalak",
        name: "pages_hu",
        path: "src/pages/hu",
        match: {
          include: "*-cms",
        },
        templates: [projects, article, home, defaultTemplate],
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
        },
      },
      {
        label: "EN oldalak",
        name: "pages_en",
        path: "src/pages/en",
        match: {
          include: "*-cms",
        },
        templates: [projects, article, home, defaultTemplate],
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
        },
      },
      {
        label: "Általános beállítások",
        name: "settings",
        path: "src/data",
        match: {
          include: "cmsConfig",
        },
        format: "json",
        fields: [
          {
            name: "latestDate",
            label: "Friss feltöltések dátuma",
            type: "datetime",
            ui: {
              timeFormat: "(YYYY-MM-DD)",
            },
          },
          {
            name: "tax1percent",
            label: "Adó 1% banner megjelenítése",
            type: "boolean",
          },
        ],
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
        },
      },
    ],
  },
})
