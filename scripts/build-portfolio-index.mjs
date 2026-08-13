import { readdir, readFile, mkdir, writeFile } from "fs/promises";
import { join, relative, basename } from "path";

const CONTENT_DIR = join(import.meta.dirname, "..", "content");
const OUT_DIR = join(import.meta.dirname, "..", "public", "static");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(full)));
    else if (e.name.endsWith(".md")) files.push(full);
  }
  return files;
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const fm = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val === "true") val = true;
    else if (val === "false") val = false;
    else if (/^\[.*\]$/.test(val))
      val = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ""));
    else val = val.replace(/^['"]|['"]$/g, "");
    fm[key] = val;
  }
  return fm;
}

const files = await walk(CONTENT_DIR);
const index = [];

for (const file of files) {
  if (basename(file) === "index.md") continue;
  const raw = await readFile(file, "utf-8");
  const fm = parseFrontmatter(raw);
  if (!fm || fm.publish !== true) continue;

  const rel = relative(CONTENT_DIR, file).replace(/\.md$/, "");
  const folder = rel.split("/")[0];

  index.push({
    slug: rel,
    folder,
    title: fm.title || "",
    date: fm.date || "",
    description: fm.description || "",
    status: fm.status || "",
    tags: Array.isArray(fm.tags) ? fm.tags : [],
  });
}

index.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

await mkdir(OUT_DIR, { recursive: true });
await writeFile(join(OUT_DIR, "portfolioIndex.json"), JSON.stringify(index, null, 2));
console.log(`portfolioIndex.json: ${index.length} entries`);
