import resolve from "rollup-plugin-node-resolve"
import { terser } from "rollup-plugin-terser"
import hash from "rollup-plugin-hash"
import commonjs from "rollup-plugin-commonjs"

export default {
  input: "src/scripts.js",
  plugins: [resolve(), commonjs()],
  output: [
    {
      file: "_dist/app.js",
      format: "iife",
      sourcemap: process.env.ENV === "production",
      plugins: [
        process.env.ENV === "production" ? terser() : false,
        process.env.ENV === "production"
          ? hash({
              dest: "_dist/app.[hash].js",
              manifest: "src/data/manifestJS.json",
              algorithm: "md5",
              replace: true,
            })
          : false,
      ],
    },
  ],
}
