import { App, FileSystemAdapter, normalizePath, TFile } from "obsidian";
import * as fs from "fs";
import * as fsp from "fs/promises";
import * as path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

import { Asset, ImportResult, JournalEntry, PluginSettings } from "./types";
import { parseHtmlEntry } from "./parser";
import { entryToMarkdown } from "./converter";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Sanitise a string so it can be used as a vault path segment. */
function sanitiseName(name: string): string {
  return name.replace(/[\\/:*?"<>|#^[\]]/g, "-").trim();
}

/** Return the vault's absolute base path. */
function vaultBasePath(app: App): string {
  return (app.vault.adapter as FileSystemAdapter).getBasePath();
}

/** Create a vault folder if it does not already exist. */
async function ensureVaultFolder(app: App, vaultPath: string): Promise<void> {
  if (!app.vault.getAbstractFileByPath(vaultPath)) {
    await app.vault.createFolder(vaultPath);
  }
}

/** Write or overwrite a markdown note in the vault. */
async function writeNote(
  app: App,
  vaultPath: string,
  content: string
): Promise<void> {
  const existing = app.vault.getAbstractFileByPath(vaultPath);
  if (existing instanceof TFile) {
    await app.vault.modify(existing, content);
  } else {
    await app.vault.create(vaultPath, content);
  }
}

// ---------------------------------------------------------------------------
// Media file handling
// ---------------------------------------------------------------------------

async function copyMedia(
  srcPath: string,
  destAbsPath: string,
  convertHeic: boolean
): Promise<void> {
  if (fs.existsSync(destAbsPath)) return; // already done

  const ext = path.extname(srcPath).toLowerCase();

  if (ext === ".heic" && convertHeic) {
    // sips is macOS-only, always available where Apple Journal runs
    await execFileAsync("sips", [
      "-s",
      "format",
      "jpeg",
      srcPath,
      "--out",
      destAbsPath,
    ]);
  } else {
    await fsp.copyFile(srcPath, destAbsPath);
  }
}

async function processAssets(
  assets: Asset[],
  resourcesDir: string,
  mediaFolderAbsPath: string,
  convertHeic: boolean
): Promise<void> {
  await fsp.mkdir(mediaFolderAbsPath, { recursive: true });

  for (const asset of assets) {
    if (!asset.filename) continue;

    const srcPath = path.join(resourcesDir, asset.filename);
    if (!fs.existsSync(srcPath)) continue;

    const ext = path.extname(asset.filename).toLowerCase();
    const destFilename =
      ext === ".heic" && convertHeic
        ? asset.filename.replace(/\.heic$/i, ".jpg")
        : asset.filename;

    const destAbsPath = path.join(mediaFolderAbsPath, destFilename);

    try {
      await copyMedia(srcPath, destAbsPath, convertHeic);
    } catch {
      // If conversion fails, fall back to a plain copy
      if (!fs.existsSync(destAbsPath)) {
        await fsp.copyFile(srcPath, destAbsPath);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Note filename resolution
// ---------------------------------------------------------------------------

/**
 * Given an entry, determine the vault paths for:
 *   - the day folder  (e.g. "Journal/2024-08-28")
 *   - the note file   (e.g. "Journal/2024-08-28/2024-08-28 - Evening outing.md")
 *   - the media folder (e.g. "Journal/2024-08-28/media")
 */
function resolveEntryPaths(
  entry: JournalEntry,
  targetFolder: string,
  mediaSubfolder: string
): { dayFolder: string; noteFile: string; mediaFolder: string } {
  const date = entry.date || "unknown";

  // Day folder is always named by date only so same-day entries share it
  const dayFolder = normalizePath(`${targetFolder}/${sanitiseName(date)}`);

  // Note filename: "2024-08-28 - Title.md", "2024-08-28.md", or "2024-08-28 (2).md"
  let noteBaseName: string;
  if (entry.duplicateSuffix) {
    noteBaseName = `${date} ${entry.duplicateSuffix}`;
  } else if (entry.title) {
    noteBaseName = `${date} - ${sanitiseName(entry.title)}`;
  } else {
    noteBaseName = date;
  }

  const noteFile = normalizePath(`${dayFolder}/${noteBaseName}.md`);
  const mediaFolder = normalizePath(`${dayFolder}/${mediaSubfolder}`);

  return { dayFolder, noteFile, mediaFolder };
}

// ---------------------------------------------------------------------------
// Public importer
// ---------------------------------------------------------------------------

export type ProgressCallback = (
  current: number,
  total: number,
  label: string
) => void;

export async function runImport(
  app: App,
  settings: PluginSettings,
  exportPath: string,
  onProgress: ProgressCallback
): Promise<ImportResult> {
  const entriesDir = path.join(exportPath, "Entries");
  const resourcesDir = path.join(exportPath, "Resources");

  const htmlFiles = fs
    .readdirSync(entriesDir)
    .filter((f) => f.toLowerCase().endsWith(".html"))
    .sort();

  const result: ImportResult = {
    total: htmlFiles.length,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  // Ensure the root target folder exists
  await ensureVaultFolder(app, settings.targetFolder);

  const basePath = vaultBasePath(app);

  for (let i = 0; i < htmlFiles.length; i++) {
    const filename = htmlFiles[i];
    onProgress(i + 1, htmlFiles.length, filename);

    try {
      const htmlPath = path.join(entriesDir, filename);
      const htmlContent = await fsp.readFile(htmlPath, "utf-8");

      const entry: JournalEntry = parseHtmlEntry(htmlContent, htmlPath, filename);

      const { dayFolder, noteFile, mediaFolder } = resolveEntryPaths(
        entry,
        settings.targetFolder,
        settings.mediaSubfolder
      );

      // Ensure day folder exists in vault
      await ensureVaultFolder(app, dayFolder);

      // Copy/convert media files (directly to filesystem, Obsidian will index them)
      if (entry.assets.some((a) => a.filename)) {
        const mediaFolderAbs = path.join(basePath, mediaFolder);
        await processAssets(
          entry.assets,
          resourcesDir,
          mediaFolderAbs,
          settings.convertHeic
        );
      }

      // Write the markdown note via Obsidian API
      const markdown = entryToMarkdown(entry, settings.mediaSubfolder);
      await writeNote(app, noteFile, markdown);

      result.imported++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push({ entry: filename, error: message });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Export path validation
// ---------------------------------------------------------------------------

export function validateExportPath(exportPath: string): string | null {
  if (!exportPath) return "Please enter the path to your Apple Journal export folder.";

  const trimmed = exportPath.trim();
  if (!fs.existsSync(trimmed)) return `Folder not found: ${trimmed}`;

  const entriesDir = path.join(trimmed, "Entries");
  const resourcesDir = path.join(trimmed, "Resources");

  if (!fs.existsSync(entriesDir))
    return `Could not find an Entries/ subfolder inside:\n${trimmed}`;
  if (!fs.existsSync(resourcesDir))
    return `Could not find a Resources/ subfolder inside:\n${trimmed}`;

  const count = fs
    .readdirSync(entriesDir)
    .filter((f) => f.toLowerCase().endsWith(".html")).length;

  if (count === 0) return "No .html entry files found in the Entries/ folder.";

  return null; // valid
}

export function countEntries(exportPath: string): number {
  const entriesDir = path.join(exportPath.trim(), "Entries");
  return fs
    .readdirSync(entriesDir)
    .filter((f) => f.toLowerCase().endsWith(".html")).length;
}
