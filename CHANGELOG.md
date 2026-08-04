# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed

- Assets were silently dropped when an entry had exactly one asset: Apple
  Journal omits the `.gridItem` wrapper in that case, and the parser only
  ever looked for asset elements nested inside `.gridItem`. (#1)

### Changed

- Regenerated `package-lock.json` to match `package.json` — it had drifted
  out of sync (missing `htmlparser2` and other `linkedom` transitive
  dependencies), which made `npm ci` fail. No dependency version ranges
  changed, only the resolved lock tree.

## [1.0.2]

Fixes broken media embeds reported in #1.

- Notes embedded `.png` assets under their original name while the
  importer converted the file on disk to `.jpg`, leaving a dead link.
  Note links now mirror the importer's renaming exactly (all of
  `.heic`/`.jpg`/`.jpeg`/`.png` → `.jpg`).
- When the "Convert HEIC" setting is off, links now keep the original
  extension instead of pointing at a `.jpg` that was never created.

## [1.0.1]

Fixes media not being imported (#1) and clears the community-catalog scan
findings.

### Media import fixes

- Entries with several media groups (asset grids between text blocks) now
  import all of them — previously only the first group was read.
- Percent-encoded filenames in the export HTML are now decoded before
  looking them up in `Resources/`.
- Videos/audio whose `src` sits directly on the `<video>`/`<audio>` tag
  are now detected.
- Media that is missing from the export or fails HEIC conversion is now
  counted and listed in the import summary instead of being skipped
  silently.
- When conversion fails, the original file is copied as a fallback
  (replacing any partial output).

### Also in this release

- Fixes flagged by the Obsidian catalog scans that were committed after
  1.0.0: `instanceof TFile` narrowing, inline styles moved to CSS, and
  settings-heading guidelines.
- A test suite now covers the parser and importer (`npm test`).

## [1.0.0]

First release — imports Apple Journal exports into Obsidian as Markdown
notes with media conversion.

[Unreleased]: https://github.com/tarikbc/apple-journal-importer/compare/1.0.2...HEAD
[1.0.2]: https://github.com/tarikbc/apple-journal-importer/compare/1.0.1...1.0.2
[1.0.1]: https://github.com/tarikbc/apple-journal-importer/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/tarikbc/apple-journal-importer/releases/tag/1.0.0
