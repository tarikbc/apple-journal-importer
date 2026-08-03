export interface PluginSettings {
  targetFolder: string;
  convertHeic: boolean;
  mediaSubfolder: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  targetFolder: "Journal",
  convertHeic: true,
  mediaSubfolder: "media",
};

// Apple Journal exports HEIC content under any of these extensions, so the
// importer converts them all to real JPEG via sips (when enabled). The
// converter must rewrite note links with this same set so links match disk.
export const CONVERTED_IMAGE_EXTS = new Set([".heic", ".jpg", ".jpeg", ".png"]);

export type AssetType =
  | "photo"
  | "video"
  | "audio"
  | "map"
  | "stateOfMind"
  | "motionActivity"
  | "workoutIcon"
  | "contact"
  | "unknown";

export interface Asset {
  uuid: string;
  type: AssetType;
  /** Filename only (e.g. "UUID.heic") — file lives in export's Resources/ */
  filename: string;
  /** Text shown in overlay footer (place name for maps, etc.) */
  overlayText?: string;
  /** Duration label for videos */
  duration?: string;
}

export interface JournalEntry {
  /** YYYY-MM-DD */
  date: string;
  /** Human-readable title from HTML or filename */
  title: string;
  assets: Asset[];
  /** Cleaned body text lines ready to paste into markdown */
  bodyLines: string[];
  /** Absolute path to the source HTML file */
  sourcePath: string;
  /**
   * Suffix used when multiple entries share the same date and have no
   * distinct title. E.g. "(2)", "(3)". Undefined for the first entry.
   */
  duplicateSuffix?: string;
}

export interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: Array<{ entry: string; error: string }>;
  /** Media referenced by an entry but not found in the export's Resources/ */
  mediaMissing: Array<{ entry: string; file: string }>;
  /** Media that failed to convert (a raw fallback copy may still exist) */
  mediaErrors: Array<{ entry: string; file: string; error: string }>;
}
