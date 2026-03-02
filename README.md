# Apple Journal Importer for Obsidian

An [Obsidian](https://obsidian.md) plugin that imports your [Apple Journal](https://support.apple.com/en/guide/iphone/iph0e5ca7dd3/ios) export into your vault as clean Markdown notes — media included.

![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22apple-journal-importer%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-stats%2FHEAD%2Fcommunity-plugin-stats.json)

---

## What it does

Apple Journal lets you export your entries as a folder containing HTML files and a media archive. This plugin reads that export and converts it into organised Markdown notes inside your vault:

```
Journal/
  2024-08-28 - Evening outing to Vacuno Carnes/
    2024-08-28 - Evening outing to Vacuno Carnes.md
    media/
      photo.jpg      ← converted from HEIC
      video.mov
  2024-08-30/
    2024-08-30.md
    2024-08-30 (2).md   ← multiple entries on the same day
    media/
      ...
```

Each note includes YAML frontmatter, embedded media, and the full body text from the original entry:

```markdown
---
date: 2024-08-28
title: "Evening outing to Vacuno Carnes"
tags:
  - journal
---

📍 Vacuno Carnes - Mercadoteca
![[media/photo.jpg]]

![[media/video.mov]]

- Had a great dinner with friends
- Walked along the waterfront
```

---

## How to export from Apple Journal

1. Open the **Journal** app on your Mac or iPhone
2. Go to **Settings → Export**
3. Tap **Export All Entries**
4. Save the resulting folder somewhere accessible (e.g. `~/Downloads/AppleJournalEntries`)

The exported folder will contain an `Entries/` subfolder with HTML files and a `Resources/` subfolder with all your media.

---

## Installation

### From the Obsidian Community Plugins directory _(coming soon)_

1. Open Obsidian → **Settings → Community plugins → Browse**
2. Search for **Apple Journal Importer**
3. Install and enable it

### Manual installation

1. Download the latest release from the [Releases page](https://github.com/tarikbc/apple-journal-importer/releases)
2. Unzip and copy the folder into your vault's `.obsidian/plugins/` directory
3. Reload Obsidian and enable the plugin under **Settings → Community plugins**

---

## Usage

1. Click the **book icon** in the ribbon, or open the Command Palette and run **"Import Apple Journal"**
2. Paste the path to your export folder (e.g. `/Users/you/Downloads/AppleJournalEntries`)
3. Click **Next** — the plugin will verify the folder and show you how many entries were found
4. Click **Import** and watch the progress bar
5. When done, you'll see a summary of imported entries and any errors

---

## Settings

| Setting | Default | Description |
|---|---|---|
| Target folder | `Journal` | Vault folder where entries are created |
| Convert HEIC to JPEG | On | Converts Apple's HEIC format to JPEG so Obsidian can render images inline. Uses the built-in macOS `sips` command. |
| Media subfolder name | `media` | Name of the subfolder inside each entry folder |

---

## Asset type handling

| Apple Journal asset | Output in Markdown |
|---|---|
| Photo | `![[media/photo.jpg]]` |
| Video | `![[media/video.mov]]` |
| Audio | `![[media/audio.m4a]]` |
| Location / Map | `📍 Place Name` + embedded map image |
| State of mind | `🧠 State of mind` |
| Activity | `🏃 Activity recorded` |
| Workout | `💪 Workout` |
| Contact | `👤 Contact` |

---

## Requirements

- **Obsidian 1.4.0** or later
- **macOS** — required for HEIC conversion (uses the built-in `sips` command). Apple Journal itself only runs on Apple platforms, so exports always originate from macOS. HEIC conversion can be disabled in settings if you prefer to skip it.

---

## Roadmap / Ideas for contribution

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to get started.

Open ideas:

- [ ] **Windows/Linux HEIC conversion** — replace `sips` with a cross-platform WASM-based decoder (e.g. `heic-convert`) so the plugin works on non-macOS systems
- [ ] **Selective import** — let users preview and select/deselect individual entries before importing
- [ ] **Duplicate detection** — skip entries that were already imported in a previous run (compare by date + title)
- [ ] **Date format options** — let users choose the note filename and frontmatter date format (ISO, US, EU, etc.)
- [ ] **Custom frontmatter** — let users add extra fields or tags per import
- [ ] **Journal template support** — apply a user-defined Obsidian template after creating each note
- [ ] **Dataview compatibility** — add optional inline fields (e.g. `location::`, `mood::`) alongside the standard frontmatter
- [ ] **Progress persistence** — resume an interrupted import from where it left off
- [ ] **iCloud path auto-detection** — automatically suggest the default Apple Journal export location
- [ ] **Periodic notes integration** — optionally merge imported entries into existing daily notes instead of creating new files
- [ ] **Localisation** — the plugin currently recognises only the English Apple Journal export format; add support for other locales

---

## Contributing

Pull requests and issues are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions.

---

## License

[MIT](LICENSE)
