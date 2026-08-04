import { test } from "node:test";
import * as assert from "node:assert/strict";
import { DOMParser } from "linkedom";

import { parseHtmlEntry } from "../src/parser";

// parser.ts relies on the browser-global DOMParser; linkedom provides it in Node.
(globalThis as { DOMParser?: unknown }).DOMParser = DOMParser;

function entryHtml(body: string): string {
  return `<!DOCTYPE html><html><head></head><body>${body}</body></html>`;
}

test("extracts a photo asset from a single asset grid", () => {
  const html = entryHtml(`
    <div class="assetGrid">
      <div class="gridItem assetType_photo" id="AAA-111">
        <img src="../Resources/AAA-111.heic">
      </div>
    </div>`);

  const entry = parseHtmlEntry(html, "/x/2024-01-01.html", "2024-01-01.html");

  assert.equal(entry.assets.length, 1);
  assert.equal(entry.assets[0].filename, "AAA-111.heic");
  assert.equal(entry.assets[0].type, "photo");
});

test("extracts assets from every asset grid, not just the first", () => {
  const html = entryHtml(`
    <div class="assetGrid">
      <div class="gridItem assetType_photo" id="AAA-111">
        <img src="../Resources/AAA-111.heic">
      </div>
    </div>
    <p>Some text between media groups</p>
    <div class="assetGrid">
      <div class="gridItem assetType_photo" id="BBB-222">
        <img src="../Resources/BBB-222.heic">
      </div>
      <div class="gridItem assetType_photo" id="CCC-333">
        <img src="../Resources/CCC-333.heic">
      </div>
    </div>`);

  const entry = parseHtmlEntry(html, "/x/2024-01-01.html", "2024-01-01.html");

  assert.deepEqual(
    entry.assets.map((a) => a.filename),
    ["AAA-111.heic", "BBB-222.heic", "CCC-333.heic"]
  );
});

test("decodes percent-encoded characters in src filenames", () => {
  const html = entryHtml(`
    <div class="assetGrid">
      <div class="gridItem assetType_photo" id="DDD-444">
        <img src="../Resources/My%20Photo%20%C3%A9.heic">
      </div>
    </div>`);

  const entry = parseHtmlEntry(html, "/x/2024-01-01.html", "2024-01-01.html");

  assert.equal(entry.assets[0].filename, "My Photo é.heic");
});

test("extracts an asset when Apple Journal omits the .gridItem wrapper for a single asset", () => {
  const html = entryHtml(`
    <div class="assetGrid assetType_photo" id="FFF-666">
      <img src="../Resources/FFF-666.heic">
    </div>`);

  const entry = parseHtmlEntry(html, "/x/2024-01-01.html", "2024-01-01.html");

  assert.equal(entry.assets.length, 1);
  assert.equal(entry.assets[0].filename, "FFF-666.heic");
  assert.equal(entry.assets[0].type, "photo");
});

test("extracts filename from a video element with a direct src attribute", () => {
  const html = entryHtml(`
    <div class="assetGrid">
      <div class="gridItem assetType_video" id="EEE-555">
        <video src="../Resources/EEE-555.mov"></video>
      </div>
    </div>`);

  const entry = parseHtmlEntry(html, "/x/2024-01-01.html", "2024-01-01.html");

  assert.equal(entry.assets[0].filename, "EEE-555.mov");
});
