import { Asset, JournalEntry } from "./types";

// ---------------------------------------------------------------------------
// Asset → markdown line(s)
// ---------------------------------------------------------------------------

function assetToMarkdown(asset: Asset, _mediaSubfolder: string): string {
  const raw = asset.filename;
  if (!raw) return assetFallback(asset);

  // HEIC and .jpeg files will have been normalised to .jpg by the importer.
  // Use filename only (no path prefix) so Obsidian resolves by unique UUID name
  // rather than treating it as a vault-root-relative path, which would fail
  // when there are hundreds of folders all named "media".
  const displayName = raw.replace(/\.heic$/i, ".jpg").replace(/\.jpeg$/i, ".jpg");

  switch (asset.type) {
    case "photo":
      return `![[${displayName}]]`;

    case "video":
      return `![[${displayName}]]`;

    case "audio":
      return `![[${displayName}]]`;

    case "map": {
      const img = `![[${displayName}]]`;
      return asset.overlayText ? `📍 ${asset.overlayText}\n${img}` : img;
    }

    default:
      return assetFallback(asset);
  }
}

function assetFallback(asset: Asset): string {
  switch (asset.type) {
    case "stateOfMind":
      return "🧠 State of mind";
    case "motionActivity":
      return "🏃 Activity recorded";
    case "workoutIcon":
      return "💪 Workout";
    case "contact":
      return "👤 Contact";
    default:
      return "";
  }
}

// ---------------------------------------------------------------------------
// Entry → full markdown document
// ---------------------------------------------------------------------------

export function entryToMarkdown(
  entry: JournalEntry,
  mediaSubfolder: string
): string {
  const lines: string[] = [];

  // --- Frontmatter ---
  lines.push("---");
  lines.push(`date: ${entry.date}`);
  if (entry.title) {
    lines.push(`title: "${entry.title.replace(/"/g, '\\"')}"`);
  }
  lines.push("tags:");
  lines.push("  - journal");
  lines.push("---");
  lines.push("");

  // --- Assets ---
  for (const asset of entry.assets) {
    const md = assetToMarkdown(asset, mediaSubfolder);
    if (md) {
      lines.push(md);
      lines.push("");
    }
  }

  // --- Body ---
  if (entry.bodyLines.length > 0) {
    lines.push(...entry.bodyLines);
    lines.push("");
  }

  return lines.join("\n");
}
