import { test } from "node:test";
import * as assert from "node:assert/strict";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { DOMParser } from "linkedom";

import { makeFakeApp, App } from "./obsidian-stub";
import { runImport } from "../src/importer";
import { DEFAULT_SETTINGS } from "../src/types";

(globalThis as { DOMParser?: unknown }).DOMParser = DOMParser;

function makeExport(files: {
  entries: Record<string, string>;
  resources: Record<string, string>;
}): { exportDir: string; vaultDir: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aji-test-"));
  const exportDir = path.join(root, "export");
  const vaultDir = path.join(root, "vault");
  fs.mkdirSync(path.join(exportDir, "Entries"), { recursive: true });
  fs.mkdirSync(path.join(exportDir, "Resources"), { recursive: true });
  fs.mkdirSync(vaultDir, { recursive: true });

  for (const [name, content] of Object.entries(files.entries)) {
    fs.writeFileSync(path.join(exportDir, "Entries", name), content);
  }
  for (const [name, content] of Object.entries(files.resources)) {
    fs.writeFileSync(path.join(exportDir, "Resources", name), content);
  }
  return { exportDir, vaultDir };
}

function photoEntryHtml(...filenames: string[]): string {
  const items = filenames
    .map(
      (f, i) =>
        `<div class="gridItem assetType_photo" id="id-${i}"><img src="../Resources/${f}"></div>`
    )
    .join("");
  return `<!DOCTYPE html><html><body><div class="assetGrid">${items}</div></body></html>`;
}

test("reports media files missing from Resources/ instead of skipping silently", async () => {
  const { exportDir, vaultDir } = makeExport({
    entries: { "2024-01-01.html": photoEntryHtml("present.png", "gone.heic") },
    resources: { "present.png": "png-bytes" },
  });
  const { app } = makeFakeApp(vaultDir);

  const result = await runImport(
    app as unknown as Parameters<typeof runImport>[0],
    { ...DEFAULT_SETTINGS, convertHeic: false },
    exportDir,
    () => undefined
  );

  assert.equal(result.imported, 1);
  assert.deepEqual(result.mediaMissing, [
    { entry: "2024-01-01.html", file: "gone.heic" },
  ]);
  assert.ok(
    fs.existsSync(path.join(vaultDir, "Journal/2024-01-01/media/present.png")),
    "existing media should still be copied"
  );
});

test("reports failed image conversions instead of swallowing the error", async () => {
  const { exportDir, vaultDir } = makeExport({
    entries: { "2024-01-02.html": photoEntryHtml("bad.heic") },
    resources: { "bad.heic": "this is not a real HEIC file" },
  });
  const { app } = makeFakeApp(vaultDir);

  const result = await runImport(
    app as unknown as Parameters<typeof runImport>[0],
    { ...DEFAULT_SETTINGS, convertHeic: true },
    exportDir,
    () => undefined
  );

  assert.equal(result.imported, 1);
  assert.equal(result.mediaErrors.length, 1);
  assert.equal(result.mediaErrors[0].entry, "2024-01-02.html");
  assert.equal(result.mediaErrors[0].file, "bad.heic");
  assert.ok(
    fs.existsSync(path.join(vaultDir, "Journal/2024-01-02/media/bad.jpg")),
    "original bytes should still be copied as a fallback"
  );
});

test("normalizes an uppercase .HEIC extension to .jpg without a leftover .HEIC.jpg", async () => {
  const { exportDir, vaultDir } = makeExport({
    entries: { "2024-01-03.html": photoEntryHtml("Photo.HEIC") },
    resources: { "Photo.HEIC": "this is not a real HEIC file" },
  });
  const { app } = makeFakeApp(vaultDir);

  await runImport(
    app as unknown as Parameters<typeof runImport>[0],
    { ...DEFAULT_SETTINGS, convertHeic: true },
    exportDir,
    () => undefined
  );

  assert.ok(
    fs.existsSync(path.join(vaultDir, "Journal/2024-01-03/media/Photo.jpg")),
    "uppercase .HEIC should normalize to Photo.jpg"
  );
  assert.ok(
    !fs.existsSync(path.join(vaultDir, "Journal/2024-01-03/media/Photo.HEIC.jpg")),
    "should not leave a double .HEIC.jpg extension"
  );
});
