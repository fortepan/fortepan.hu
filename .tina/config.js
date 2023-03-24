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
        label: "Pages (HU)",
        name: "pages_hu",
        path: "src/pages/hu",
        match: {
          include: "*-cms",
        },
        templates: [projects, article, home, defaultTemplate],
      },
      {
        label: "Pages (EN)",
        name: "pages_en",
        path: "src/pages/en",
        match: {
          include: "*-cms",
        },
        templates: [projects, article, home, defaultTemplate],
      },
    ],
  },
})
