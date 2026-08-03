import { test } from "node:test";
import * as assert from "node:assert/strict";

import { entryToMarkdown } from "../src/converter";
import { JournalEntry, Asset } from "../src/types";

function photoEntry(filename: string): JournalEntry {
  const asset: Asset = { uuid: "u1", type: "photo", filename };
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
