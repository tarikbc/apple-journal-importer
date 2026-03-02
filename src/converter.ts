import { Asset, JournalEntry } from "./types";

// ---------------------------------------------------------------------------
// Asset → markdown line(s)
// ---------------------------------------------------------------------------

function assetToMarkdown(asset: Asset, mediaSubfolder: string): string {
  const raw = asset.filename;
  if (!raw) return assetFallback(asset);

  // HEIC and .jpeg files will have been normalised to .jpg by the importer
  const displayName = raw.replace(/\.heic$/i, ".jpg").replace(/\.jpeg$/i, ".jpg");
  const embedPath = `${mediaSubfolder}/${displayName}`;

  switch (asset.type) {
    case "photo":
      return `![[${embedPath}]]`;

    case "video":
      return `![[${embedPath}]]`;

    case "audio":
      return `![[${embedPath}]]`;

    case "map": {
      const img = `![[${embedPath}]]`;
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
