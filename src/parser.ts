import { Asset, AssetType, JournalEntry } from "./types";

// ---------------------------------------------------------------------------
// Filename parsing
// ---------------------------------------------------------------------------

/**
 * Parse an entry filename like:
 *   2024-08-27.html
 *   2024-08-28_Evening_outing_to_Vacuno.html
 *   2024-08-30_(1).html   ← Apple Journal duplicate suffix
 */
export function parseEntryFilename(filename: string): {
  date: string;
  titleFromFilename: string;
  duplicateSuffix: string | undefined;
} {
  const base = filename.replace(/\.html$/i, "");

  // Must start with a date
  const m = base.match(/^(\d{4}-\d{2}-\d{2})(?:_(.+))?$/);
  if (!m) {
    return { date: "", titleFromFilename: base, duplicateSuffix: undefined };
  }

  const date = m[1];
  const rest = m[2] ?? "";

  // Duplicate suffix pattern: _(1), _(2), …  →  we turn (n) into (n+1)
  const dupMatch = rest.match(/^\((\d+)\)$/);
  if (dupMatch) {
    const n = parseInt(dupMatch[1], 10) + 1;
    return { date, titleFromFilename: "", duplicateSuffix: `(${n})` };
  }

  const titleFromFilename = rest.replace(/_/g, " ").trim();
  return { date, titleFromFilename, duplicateSuffix: undefined };
}

// ---------------------------------------------------------------------------
// Asset grid parsing
// ---------------------------------------------------------------------------

function classToAssetType(className: string): AssetType {
  if (className.includes("assetType_photo")) return "photo";
  if (className.includes("assetType_video")) return "video";
  if (className.includes("assetType_audio")) return "audio";
  if (className.includes("assetType_multiPinMap")) return "map";
  if (className.includes("assetType_stateOfMind")) return "stateOfMind";
  if (className.includes("assetType_motionActivity")) return "motionActivity";
  if (className.includes("assetType_workoutIcon")) return "workoutIcon";
  if (className.includes("assetType_contact")) return "contact";
  return "unknown";
}

function extractAssets(assetGrid: Element): Asset[] {
  const assets: Asset[] = [];

  for (const item of Array.from(assetGrid.querySelectorAll(".gridItem"))) {
    const uuid = item.id ?? "";
    const type = classToAssetType(item.className);

    // Try every media element for the src
    const img = item.querySelector("img");
    const videoSrc = item.querySelector("video source");
    const audioSrc = item.querySelector("audio source");
    const mediaEl = img ?? videoSrc ?? audioSrc;

    const rawSrc = mediaEl?.getAttribute("src") ?? "";
    // Strip the leading "../Resources/" prefix Apple puts in the HTML
    const filename = rawSrc.replace(/^\.\.\/Resources\//, "").replace(/^Resources\//, "");

    const overlayText =
      item.querySelector(".gridItemOverlayFooter")?.textContent?.trim() || undefined;
    const duration =
      item.querySelector(".durationText")?.textContent?.trim() || undefined;

    if (uuid || filename) {
      assets.push({ uuid, type, filename, overlayText, duration });
    }
  }

  return assets;
}

// ---------------------------------------------------------------------------
// Body text extraction
// ---------------------------------------------------------------------------

function extractBodyLines(bodyEl: Element): string[] {
  const lines: string[] = [];

  function walk(el: Element): void {
    const tag = el.tagName.toLowerCase();

    if (tag === "ul" || tag === "ol") {
      for (const li of Array.from(el.querySelectorAll(":scope > li"))) {
        const text = li.textContent?.trim() ?? "";
        if (text) lines.push(`- ${text}`);
      }
      return;
    }

    if (tag === "p" || tag === "div") {
      // If it only contains inline elements, grab the full text
      const childTags = Array.from(el.children).map((c) =>
        c.tagName.toLowerCase()
      );
      const hasBlockChildren = childTags.some((t) =>
        ["p", "div", "ul", "ol", "li"].includes(t)
      );

      if (!hasBlockChildren) {
        const text = el.textContent?.trim() ?? "";
        if (text) lines.push(text);
        return;
      }
    }

    // Recurse into children
    for (const child of Array.from(el.children)) {
      walk(child);
    }
  }

  walk(bodyEl);

  // Collapse runs of blank lines to a single blank
  return lines.filter((line, i, arr) => {
    if (line !== "") return true;
    return i > 0 && arr[i - 1] !== "";
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function parseHtmlEntry(
  htmlContent: string,
  sourcePath: string,
  filename: string
): JournalEntry {
  const { date, titleFromFilename, duplicateSuffix } =
    parseEntryFilename(filename);

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");

  // Prefer the in-HTML title; fall back to filename-derived title
  const htmlTitle = doc.querySelector(".title")?.textContent?.trim() ?? "";
  const title = htmlTitle || titleFromFilename;

  const assetGrid = doc.querySelector(".assetGrid");
  const assets = assetGrid ? extractAssets(assetGrid) : [];

  const bodyEl = doc.querySelector(".bodyText");
  const bodyLines = bodyEl ? extractBodyLines(bodyEl) : [];

  return { date, title, assets, bodyLines, sourcePath, duplicateSuffix };
}
