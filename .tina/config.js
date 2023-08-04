import { defineConfig } from "tinacms"

import projects from "./templates/projects"
import home from "./templates/home"
import article from "./templates/article"
import defaultTemplate from "./templates/default"

// Your hosting provider likely exposes this as an environment variable
const branch = process.env.HEAD || process.env.VERCEL_GIT_COMMIT_REF || "master"

export default defineConfig({
  branch: branch,
  clientId: "5201a87a-dc24-4552-8b2e-3272e08089dd", // Get this from tina.io
  token: "cb8e6ac56b6e16ee26f90051e621aa2442787299", // Get this from tina.io
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
        label: "Feltöltések",
        name: "photo_uploads",
        path: "src/data",
        match: {
          include: "photo_uploads",
        },
        format: "json",
        fields: [
          {
            name: "uploads",
            label: "Feltöltések",
            type: "object",
            list: true,
            ui: {
              component: "group-list",
              itemProps: item => ({
                label: item.name,
              }),
            },
            fields: [
              {
                name: "name",
                label: "Cím (azonosításhoz)",
                description: "Ez a mező nem jelenik meg az oldalon, csak az adminban használjuk azonosításhoz",
                defaultTemplate: "Új feltöltés",
                type: "string",
              },
              {
                name: "date",
                label: "Feltöltés dátuma",
                type: "datetime",
                ui: {
                  dateFormat: "YYYY-MM-DD",
                  utc: true,
                },
              },
              {
                name: "cover_image",
                label: "Borítókép (mid)",
                type: "string",
              },
              {
                name: "hu",
                label: "Magyar szöveg",
                type: "object",
                fields: [
                  {
                    name: "title",
                    label: "Cím",
                    type: "string",
                  },
                  {
                    name: "blurb",
                    label: "Leírás",
                    type: "string",
                    ui: {
                      component: "textarea",
                    },
                  },
                  {
                    name: "actions",
                    label: "Gombok",
                    type: "object",
                    fields: [
                      {
                        name: "best_of",
                        label: "Best of gomb szövege",
                        type: "string",
                      },
                      {
                        name: "all",
                        label: "Teljes kollekció gomb szövege",
                        type: "string",
                      },
                    ],
                  },
                ],
              },
              {
                name: "en",
                label: "Angol szöveg",
                type: "object",
                fields: [
                  {
                    name: "title",
                    label: "Cím",
                    type: "string",
                  },
                  {
                    name: "blurb",
                    label: "Leírás",
                    type: "string",
                    ui: {
                      component: "textarea",
                    },
                  },
                  {
                    name: "actions",
                    label: "Gombok",
                    type: "object",
                    fields: [
                      {
                        name: "best_of",
                        label: "Best of gomb szövege",
                        type: "string",
                      },
                      {
                        name: "all",
                        label: "Teljes kollekció gomb szövege",
                        type: "string",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
          global: true,
        },
      },
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
            label: "Magyar bejegyzések",
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
                type: "datetime",
                ui: {
                  dateFormat: "YYYY-MM-DD",
                  utc: true,
                },
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
            label: "Angol bejegyzések",
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
                type: "datetime",
                ui: {
                  dateFormat: "YYYY-MM-DD",
                  utc: true,
                },
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
          global: true,
          allowedActions: {
            create: false,
            delete: false,
          },
        },
      },
      {
        label: "Értesítések",
        name: "notifications",
        path: "src/data",
        match: {
          include: "notifications",
        },
        format: "json",
        ui: {
          global: true,
          allowedActions: {
            create: false,
            delete: false,
          },
        },
        fields: [
          {
            name: "notifications",
            label: "Értesítések",
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
                name: "lang",
                label: "Nyelv",
                type: "string",
                options: [
                  {
                    value: "hu",
                    label: "Magyar",
                  },
                  {
                    value: "en",
                    label: "Angol",
                  },
                ],
              },
              {
                name: "date",
                label: "Dátum",
                type: "datetime",
                ui: {
                  dateFormat: "YYYY-MM-DD",
                  utc: true,
                },
              },
              {
                name: "title",
                label: "Cím",
                type: "string",
              },
              {
                name: "message",
                label: "Értesítés szövege",
                type: "rich-text",
              },
            ],
          },
        ],
      },
      {
        label: "Magyar oldalak",
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
        label: "Angol oldalak",
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
              dateFormat: "YYYY-MM-DD",
              utc: true,
            },
          },
          {
            name: "tax1percent",
            label: "Adó 1% banner megjelenítése",
            type: "boolean",
          },
        ],
        ui: {
          global: true,
          allowedActions: {
            create: false,
            delete: false,
          },
        },
      },
    ],
  },
})
