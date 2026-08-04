import { test } from "node:test";
import * as assert from "node:assert/strict";

import { entryToMarkdown } from "../src/converter";
import { JournalEntry, Asset } from "../src/types";

function photoEntry(filename: string): JournalEntry {
  const asset: Asset = { uuid: "u1", type: "photo", filename };
  return entryWithAsset(asset);
}

function entryWithAsset(asset: Asset): JournalEntry {
  return {
    date: "2024-01-01",
    title: "",
    assets: [asset],
    bodyLines: [],
    sourcePath: "/x/2024-01-01.html",
  };
}

test("links heic assets as .jpg when image conversion is on", () => {
  const md = entryToMarkdown(photoEntry("AAA.heic"), "media", true);
  assert.match(md, /!\[\[AAA\.jpg\]\]/);
});

test("links png assets as .jpg when image conversion is on", () => {
  const md = entryToMarkdown(photoEntry("BBB.png"), "media", true);
  assert.match(md, /!\[\[BBB\.jpg\]\]/);
});

test("keeps original extensions when image conversion is off", () => {
  const md = entryToMarkdown(photoEntry("CCC.heic"), "media", false);
  assert.match(md, /!\[\[CCC\.heic\]\]/);
});

test("renders a link-preview asset as an image plus a clickable link", () => {
  const asset: Asset = {
    uuid: "u2",
    type: "link",
    filename: "DDD.heic",
    href: "https://example.com/recipe",
  };
  const md = entryToMarkdown(entryWithAsset(asset), "media", true);
  assert.match(md, /!\[\[DDD\.jpg\]\]/);
  assert.match(md, /\[🔗 Link\]\(https:\/\/example\.com\/recipe\)/);
});

test("renders a link-preview asset without a href as just the image", () => {
  const asset: Asset = { uuid: "u3", type: "link", filename: "EEE.heic" };
  const md = entryToMarkdown(entryWithAsset(asset), "media", true);
  assert.match(md, /!\[\[EEE\.jpg\]\]/);
  assert.doesNotMatch(md, /🔗/);
});

test("renders a workout route asset with its activity caption", () => {
  const asset: Asset = {
    uuid: "u4",
    type: "workoutRoute",
    filename: "FFF.heic",
    overlayText: "Outdoor Walk · 2.87KM · 0:39:08",
  };
  const md = entryToMarkdown(entryWithAsset(asset), "media", true);
  assert.match(md, /!\[\[FFF\.jpg\]\]/);
  assert.match(md, /🏃 Outdoor Walk · 2\.87KM · 0:39:08/);
});

test("renders a workout icon asset with its activity caption instead of dropping the image", () => {
  const asset: Asset = {
    uuid: "u6",
    type: "workoutIcon",
    filename: "HHH.heic",
    overlayText: "5 Workouts · 3,734 KJ · 2:03:13",
  };
  const md = entryToMarkdown(entryWithAsset(asset), "media", true);
  assert.match(md, /!\[\[HHH\.jpg\]\]/);
  assert.match(md, /💪 5 Workouts · 3,734 KJ · 2:03:13/);
});

test("renders a state-of-mind asset with its mood caption instead of dropping the image", () => {
  const asset: Asset = {
    uuid: "u7",
    type: "stateOfMind",
    filename: "III.heic",
    overlayText: "Calm · Health, Fitness",
  };
  const md = entryToMarkdown(entryWithAsset(asset), "media", true);
  assert.match(md, /!\[\[III\.jpg\]\]/);
  assert.match(md, /🧠 Calm · Health, Fitness/);
});

test("still embeds an unrecognized asset type and flags it with a warning", () => {
  const asset: Asset = {
    uuid: "u5",
    type: "unknown",
    filename: "GGG.heic",
    rawTypeClass: "gridItem assetType_futureThing",
  };
  const md = entryToMarkdown(entryWithAsset(asset), "media", true);
  assert.match(md, /!\[\[GGG\.jpg\]\]/);
  assert.match(md, /⚠️ Unrecognized asset type \(`gridItem assetType_futureThing`\)/);
});
