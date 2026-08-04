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

/**
 * The href comes straight out of the export's HTML, so treat it as untrusted:
 * allow only http(s) URLs and percent-encode anything that could break out of
 * the markdown link syntax and inject content into the note.
 */
function safeMarkdownUrl(href: string): string | undefined {
  if (!/^https?:\/\//i.test(href)) return undefined;
  // encodeURIComponent leaves ( and ) alone, so percent-encode by hand
  return href.replace(/[\s()<>[\]]/g, (c) => {
    return "%" + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0");
  });
}

function unknownTypeWarning(asset: Asset): string {
  const label = asset.rawTypeClass ? `\`${asset.rawTypeClass}\`` : "unrecognized type";
  return `⚠️ Unrecognized asset type (${label}) — may need a plugin update`;
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

    case "music":
      return `![[${displayName}]]`;

    case "map": {
      const img = `![[${displayName}]]`;
      return asset.overlayText ? `📍 ${asset.overlayText}\n${img}` : img;
    }

    case "workoutRoute": {
      const img = `![[${displayName}]]`;
      return asset.overlayText ? `🏃 ${asset.overlayText}\n${img}` : img;
    }

    case "link": {
      const img = `![[${displayName}]]`;
      const url = asset.href ? safeMarkdownUrl(asset.href) : undefined;
      return url ? `${img}\n[🔗 Link](${url})` : img;
    }

    case "stateOfMind": {
      const img = `![[${displayName}]]`;
      return asset.overlayText ? `🧠 ${asset.overlayText}\n${img}` : img;
    }

    case "motionActivity": {
      const img = `![[${displayName}]]`;
      return asset.overlayText ? `🏃 ${asset.overlayText}\n${img}` : img;
    }

    case "workoutIcon": {
      const img = `![[${displayName}]]`;
      return asset.overlayText ? `💪 ${asset.overlayText}\n${img}` : img;
    }

    case "contact": {
      const img = `![[${displayName}]]`;
      return asset.overlayText ? `👤 ${asset.overlayText}\n${img}` : img;
    }

    case "unknown": {
      // We don't know how to caption this asset, but the file itself
      // exists and was copied/converted — embed it rather than silently
      // dropping it, and flag it so a plugin update can add proper support.
      const img = `![[${displayName}]]`;
      return `${img}\n${unknownTypeWarning(asset)}`;
    }

    default:
      return assetFallback(asset);
  }
}

/** Rendered when an asset has no extractable media file — still leave a trace. */
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
    case "music":
      return "🎵 Music";
    case "workoutRoute":
      return "🏃 Workout route";
    case "link": {
      const url = asset.href ? safeMarkdownUrl(asset.href) : undefined;
      return url ? `[🔗 Link](${url})` : "🔗 Link";
    }
    case "unknown":
      return unknownTypeWarning(asset);
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
