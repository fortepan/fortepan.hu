#!/usr/bin/env node

const { execFileSync } = require("child_process")
const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "..")
const SCAN_DIRS = ["src", "plugins", "scripts"]
const EXT = new Set([".liquid", ".js", ".html"])
const SKIP_DIRS = new Set(["node_modules", "_dist", ".git"])
const TARGET = /target=["']_blank["']/
const NOOPENER = /noopener/

const warnOnly = process.argv.includes("--warn")
const stagedOnly = process.argv.includes("--staged")
const report = warnOnly ? console.warn : console.error
const exitWith = code => process.exit(warnOnly && code !== 0 ? 0 : code)

const isScannable = relPath =>
  EXT.has(path.extname(relPath)) && SCAN_DIRS.some(dir => relPath === dir || relPath.startsWith(`${dir}/`))

const walk = (dir, files = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (isScannable(path.relative(ROOT, full).replace(/\\/g, "/"))) files.push(full)
  }
  return files
}

const getStagedFiles = () =>
  execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "--", ...SCAN_DIRS], {
    cwd: ROOT,
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .filter(Boolean)
    .filter(isScannable)
    .map(relPath => path.join(ROOT, relPath))

const getFilesToCheck = () => {
  if (stagedOnly) return getStagedFiles()
  return SCAN_DIRS.flatMap(dir => (fs.existsSync(path.join(ROOT, dir)) ? walk(path.join(ROOT, dir)) : []))
}

const checkFile = content => {
  if (!TARGET.test(content)) return []

  const issues = []
  const lines = content.split("\n")

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!TARGET.test(line)) continue

    if (/setAttribute\(["']target["']/.test(line)) {
      if (!NOOPENER.test(lines.slice(i, i + 3).join("\n"))) {
        issues.push({ line: i + 1, snippet: line.trim() })
      }
      continue
    }

    const tags = line.match(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)
    if (tags) {
      for (const tag of tags) {
        if (!NOOPENER.test(tag)) issues.push({ line: i + 1, snippet: tag })
      }
      continue
    }

    if (!NOOPENER.test(line)) {
      issues.push({ line: i + 1, snippet: line.trim() })
    }
  }

  return issues
}

let files
try {
  files = getFilesToCheck()
} catch {
  report(`check-target-blank-rel: could not read ${stagedOnly ? "staged" : "repo"} files`)
  exitWith(1)
}

const issues = files.flatMap(file => {
  const relPath = path.relative(ROOT, file).replace(/\\/g, "/")
  return checkFile(fs.readFileSync(file, "utf8")).map(issue => ({ relPath, ...issue }))
})

issues.forEach(({ relPath, line, snippet }) => {
  report(`${relPath}:${line}: target="_blank" without rel="noopener noreferrer"\n  ${snippet}\n`)
})

if (issues.length > 0) {
  report(warnOnly ? "check-target-blank-rel: warning (commit not blocked)" : "check-target-blank-rel: failed")
  exitWith(1)
}

const scope = stagedOnly ? "staged" : "all"
console.log(`check-target-blank-rel: ok (${files.length} ${scope} files)`)
