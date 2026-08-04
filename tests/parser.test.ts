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

test("extracts a link-preview asset with its href", () => {
  const html = entryHtml(`
    <div class="assetGrid">
      <div id="GGG-777" class="gridItem assetType_link " >
        <a href='https://example.com/recipe'>
        <img src="../Resources/GGG-777.heic" class="asset_image"/>
        </a>
      </div>
    </div>`);

  const entry = parseHtmlEntry(html, "/x/2024-01-01.html", "2024-01-01.html");

  assert.equal(entry.assets[0].type, "link");
  assert.equal(entry.assets[0].filename, "GGG-777.heic");
  assert.equal(entry.assets[0].href, "https://example.com/recipe");
});

test("treats an empty href on a link-preview asset as absent", () => {
  const html = entryHtml(`
    <div class="assetGrid">
      <div id="HHH-888" class="gridItem assetType_link " >
        <a href=''>
        <img src="../Resources/HHH-888.heic" class="asset_image"/>
        </a>
      </div>
    </div>`);

  const entry = parseHtmlEntry(html, "/x/2024-01-01.html", "2024-01-01.html");

  assert.equal(entry.assets[0].href, undefined);
});

test("maps a generic (single-pin) map asset to the map type", () => {
  const html = entryHtml(`
    <div class="assetGrid">
      <div id="III-999" class="gridItem assetType_genericMap " >
        <img src="../Resources/III-999.heic" class="asset_image"/>
      </div>
    </div>`);

  const entry = parseHtmlEntry(html, "/x/2024-01-01.html", "2024-01-01.html");

  assert.equal(entry.assets[0].type, "map");
});

test("maps a live photo to the photo type", () => {
  const html = entryHtml(`
    <div class="assetGrid">
      <div id="JJJ-000" class="gridItem assetType_livePhoto " >
        <img src="../Resources/JJJ-000.heic" class="asset_image"/>
      </div>
    </div>`);

  const entry = parseHtmlEntry(html, "/x/2024-01-01.html", "2024-01-01.html");

  assert.equal(entry.assets[0].type, "photo");
});

test("extracts a workout route asset with its activity caption", () => {
  const html = entryHtml(`
    <div class="assetGrid">
      <div id="KKK-111" class="gridItem assetType_workoutRoute " >
        <div class="activityType">Outdoor Walk</div>
        <img src="../Resources/KKK-111.heic" class="asset_image"/>
        <div class="activityMetrics"><span class="activityMetricsDistance">2.87KM</span> · <span class="activityMetricsDuration">0:39:08</span></div>
      </div>
    </div>`);

  const entry = parseHtmlEntry(html, "/x/2024-01-01.html", "2024-01-01.html");

  assert.equal(entry.assets[0].type, "workoutRoute");
  assert.equal(entry.assets[0].overlayText, "Outdoor Walk · 2.87KM · 0:39:08");
});

test("picks the actual album art for a music asset, not the reused play-icon", () => {
  const html = entryHtml(`
    <div class="assetGrid">
      <div id="LLL-222" class="gridItem assetType_music " >
        <img src="../Resources/mediaPlayIcon.heic" class="mediaPlayIcon" />
        <img src="../Resources/LLL-222.heic" class="asset_image"/>
        <img src="../Resources/musicIcon.heic" class="mediaTypeIcon" />
      </div>
    </div>`);

  const entry = parseHtmlEntry(html, "/x/2024-01-01.html", "2024-01-01.html");

  assert.equal(entry.assets[0].type, "music");
  assert.equal(entry.assets[0].filename, "LLL-222.heic");
});

test("records the raw class name for an unrecognized asset type", () => {
  const html = entryHtml(`
    <div class="assetGrid">
      <div id="MMM-333" class="gridItem assetType_futureThing " >
        <img src="../Resources/MMM-333.heic" class="asset_image"/>
      </div>
    </div>`);

  const entry = parseHtmlEntry(html, "/x/2024-01-01.html", "2024-01-01.html");

  assert.equal(entry.assets[0].type, "unknown");
  assert.equal(entry.assets[0].rawTypeClass, "gridItem assetType_futureThing");
});
