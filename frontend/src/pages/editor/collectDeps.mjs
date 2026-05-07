import fs from "node:fs";
import path from "node:path";

/**
 * Collect relative-import dependency closure starting from entry files,
 * and copy them into a "portable src subtree" under DEST_ROOT/src/...
 *
 * This keeps original relative import paths working without rewriting.
 */

const PROJECT_ROOT = path.resolve(
  "/Users/bytedance/code/personal_test/svg_editor",
);
const SRC_ROOT = path.join(PROJECT_ROOT, "src");
const DEST_ROOT = path.join(
  PROJECT_ROOT,
  "src",
  "layers",
  "view",
  "edit",
);
const DEST_SRC_ROOT = path.join(DEST_ROOT, "src");

const ENTRY_FILES = [
  path.join(SRC_ROOT, "main.tsx"),
  path.join(SRC_ROOT, "index.css"),
  path.join(SRC_ROOT, "App.tsx"),
  path.join(SRC_ROOT, "App.css"),
];

const TEXT_EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
  ".json",
  ".svg",
]);

function isUnder(dir, file) {
  const rel = path.relative(dir, file);
  return rel && !rel.startsWith("..") && !path.isAbsolute(rel);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function resolveImport(fromFile, spec) {
  if (!spec.startsWith(".")) return null;

  const base = path.resolve(path.dirname(fromFile), spec);
  const tryFiles = [];

  // If spec already has an extension, try as-is first.
  if (path.extname(base)) {
    tryFiles.push(base);
  } else {
    // TS-style resolution.
    tryFiles.push(`${base}.ts`);
    tryFiles.push(`${base}.tsx`);
    tryFiles.push(`${base}.js`);
    tryFiles.push(`${base}.jsx`);
    tryFiles.push(`${base}.mjs`);
    tryFiles.push(`${base}.cjs`);
    tryFiles.push(`${base}.json`);
    tryFiles.push(`${base}.css`);
    tryFiles.push(path.join(base, "index.ts"));
    tryFiles.push(path.join(base, "index.tsx"));
    tryFiles.push(path.join(base, "index.js"));
    tryFiles.push(path.join(base, "index.jsx"));
  }

  for (const candidate of tryFiles) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

const IMPORT_RE =
  /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']\s*;?/g;

function collectDeps(entryFiles) {
  const queue = [...entryFiles];
  const seen = new Set();
  const result = [];

  while (queue.length) {
    const file = queue.pop();
    if (!file) continue;
    const real = fs.existsSync(file) ? fs.realpathSync(file) : file;
    if (seen.has(real)) continue;
    seen.add(real);

    if (!fs.existsSync(real) || !fs.statSync(real).isFile()) continue;
    if (!isUnder(SRC_ROOT, real)) continue;

    result.push(real);

    const ext = path.extname(real);
    if (!TEXT_EXTS.has(ext)) continue;

    const content = readText(real);
    IMPORT_RE.lastIndex = 0;
    let m;
    while ((m = IMPORT_RE.exec(content))) {
      const spec = m[1];
      const resolved = resolveImport(real, spec);
      if (resolved) queue.push(resolved);
    }
  }

  // stable order for diffs / inspection
  result.sort();
  return result;
}

function copyToDest(srcFile) {
  const relFromSrcRoot = path.relative(SRC_ROOT, srcFile);
  const destFile = path.join(DEST_SRC_ROOT, relFromSrcRoot);
  ensureDir(path.dirname(destFile));
  fs.copyFileSync(srcFile, destFile);
  return destFile;
}

function main() {
  ensureDir(DEST_SRC_ROOT);
  const deps = collectDeps(ENTRY_FILES);
  const copied = deps.map((f) => copyToDest(f));

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        entryFiles: ENTRY_FILES.map((f) => path.relative(PROJECT_ROOT, f)),
        srcRoot: path.relative(PROJECT_ROOT, SRC_ROOT),
        destSrcRoot: path.relative(PROJECT_ROOT, DEST_SRC_ROOT),
        fileCount: copied.length,
      },
      null,
      2,
    ),
  );
}

main();
