import { Asset, CONVERTED_IMAGE_EXTS, JournalEntry } from "./types";

// ---------------------------------------------------------------------------
// Asset → markdown line(s)
// ---------------------------------------------------------------------------

/** Mirror the importer's renaming: images become .jpg only when converting. */
function displayNameFor(filename: string, convertImages: boolean): string {
  if (!convertImages) return filename;
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return filename;
  const ext = filename.slice(dot).toLowerCase();
  return CONVERTED_IMAGE_EXTS.has(ext) ? filename.slice(0, dot) + ".jpg" : filename;
}

function assetToMarkdown(asset: Asset, convertImages: boolean): string {
  const raw = asset.filename;
  if (!raw) return assetFallback(asset);

  // Use filename only (no path prefix) so Obsidian resolves by unique UUID name
  // rather than treating it as a vault-root-relative path, which would fail
  // when there are hundreds of folders all named "media".
  const displayName = displayNameFor(raw, convertImages);

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
  _mediaSubfolder: string,
  convertImages: boolean
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
    const md = assetToMarkdown(asset, convertImages);
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
