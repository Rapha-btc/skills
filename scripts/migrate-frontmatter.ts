/**
 * Migration script: Move all custom fields under `metadata:` in every SKILL.md file.
 * Keeps `name` and `description` at the top level.
 * All metadata values are quoted strings (strictyaml requirement).
 * Arrays become comma-separated strings; empty arrays become "".
 * Renames `author_agent` to `author-agent`.
 * Adds missing fields to aibtc-news-classifieds and onboarding.
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";

// The root of the skills repo
const ROOT = path.resolve(__dirname, "..");

function arrayToString(val: unknown): string {
  if (Array.isArray(val)) {
    return val.join(", ");
  }
  return String(val ?? "");
}

function toMetadataString(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (Array.isArray(val)) return val.join(", ");
  if (typeof val === "boolean") return String(val);
  return String(val);
}

function buildFrontmatter(data: Record<string, unknown>): string {
  // Pull out name and description (top-level required fields)
  const name = data.name as string;
  const description = data.description as string;

  // Build metadata object from all other fields
  const metadataFields: Record<string, string> = {};

  const skipFields = new Set(["name", "description"]);

  for (const [key, val] of Object.entries(data)) {
    if (skipFields.has(key)) continue;

    // Rename author_agent -> author-agent
    const metaKey = key === "author_agent" ? "author-agent" : key;
    metadataFields[metaKey] = toMetadataString(val);
  }

  // Build YAML manually for full control over quoting
  const lines: string[] = ["---"];
  lines.push(`name: ${name}`);

  // Description may contain colons — always quote it
  lines.push(`description: ${JSON.stringify(description)}`);

  lines.push(`metadata:`);

  for (const [key, val] of Object.entries(metadataFields)) {
    // Always use JSON.stringify for values to ensure proper quoting
    lines.push(`  ${key}: ${JSON.stringify(val)}`);
  }

  lines.push(`---`);

  return lines.join("\n");
}

function migrateSKILLmd(filePath: string): void {
  const content = fs.readFileSync(filePath, "utf-8");

  // Extract frontmatter between --- delimiters
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!fmMatch) {
    console.warn(`SKIP (no frontmatter): ${filePath}`);
    return;
  }

  const rawFrontmatter = fmMatch[1];
  const bodyStart = fmMatch[0].length;
  const body = content.slice(bodyStart);

  // Pre-process: quote unquoted description values that contain colons
  // The YAML parser chokes on "description: foo: bar" (colons in value)
  // Only quote if value is NOT already quoted (doesn't start with " or ')
  // The regex anchors: "description: " followed by a non-quote, non-newline char
  // Using a positive lookahead to ensure the trimmed value doesn't start with " or '
  const fixedFrontmatter = rawFrontmatter.replace(
    /^description: (?!['"])(.+:.+)$/m,
    (_, value) => {
      // Value contains a colon and is not already quoted
      return `description: "${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
  );

  // Parse YAML
  let data: Record<string, unknown>;
  try {
    data = yaml.parse(fixedFrontmatter) as Record<string, unknown>;
  } catch (err) {
    console.error(`ERROR parsing ${filePath}: ${err}`);
    return;
  }

  // Already migrated? If file has name, description, and metadata block with all string values, skip it.
  if (data.metadata && typeof data.metadata === "object") {
    const meta = data.metadata as Record<string, unknown>;
    const allStrings = Object.values(meta).every((v) => typeof v === "string");
    if (allStrings && !meta["author_agent"]) {
      // Already in correct format — skip to avoid corruption
      console.log(`SKIP (already migrated): ${path.relative(ROOT, filePath)}`);
      return;
    }
    // Otherwise re-flatten and re-process
    delete data.metadata;
    for (const [k, v] of Object.entries(meta)) {
      if (!data[k]) {
        data[k] = v;
      }
    }
  }

  // Add missing fields for specific skills
  const skillName = data.name as string;

  if (skillName === "aibtc-news-classifieds") {
    if (!data.author) data.author = "whoabuddy";
    if (!data.author_agent && !data["author-agent"])
      data["author-agent"] = "Trustless Indra";
    if (!data["user-invocable"]) data["user-invocable"] = false;
  }

  if (skillName === "onboarding") {
    if (!data.author_agent && !data["author-agent"])
      data["author-agent"] = "k9dreamermacmini-coder";
  }

  const newFrontmatter = buildFrontmatter(data);
  const newContent = newFrontmatter + "\n" + body;

  fs.writeFileSync(filePath, newContent, "utf-8");
  console.log(`MIGRATED: ${path.relative(ROOT, filePath)}`);
}

async function main() {
  // Use Bun.Glob to find all */SKILL.md files
  const glob = new Bun.Glob("*/SKILL.md");
  const matches = glob.scanSync({ cwd: ROOT });

  const files: string[] = [];
  for (const match of matches) {
    files.push(path.join(ROOT, match));
  }

  if (files.length === 0) {
    console.error("No SKILL.md files found!");
    process.exit(1);
  }

  console.log(`Found ${files.length} SKILL.md files to migrate.\n`);

  for (const file of files.sort()) {
    migrateSKILLmd(file);
  }

  console.log(`\nDone. Migrated ${files.length} files.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
