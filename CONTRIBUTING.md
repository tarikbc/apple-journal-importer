# Contributing to Apple Journal Importer

Thanks for your interest in improving this plugin! Here's how to get started.

## Development setup

**Prerequisites:** Node.js 18+, npm

```bash
git clone https://github.com/tarikbc/apple-journal-importer.git
cd apple-journal-importer
npm install
```

For the fastest development loop, symlink (or copy) the plugin folder directly into your vault:

```bash
ln -s "$(pwd)" "/path/to/your/vault/.obsidian/plugins/apple-journal-importer"
```

Then start the watcher:

```bash
npm run dev
```

Every time you save a source file, esbuild will rebuild `main.js` in under a second. Reload the plugin in Obsidian with **Ctrl/Cmd+R** or via the community plugin toggle.

## Project structure

```
src/
  main.ts         Plugin entry point — registers commands, ribbon, settings tab
  types.ts        Shared interfaces and default settings
  parser.ts       Parses Apple Journal HTML into structured JournalEntry objects
  converter.ts    Converts JournalEntry objects into Markdown strings
  importer.ts     Orchestrates the import: parse → convert media → write files
  ui/
    ImportModal.ts  4-step import modal (pick path → confirm → progress → summary)
    SettingsTab.ts  Plugin settings panel
```

## Submitting a pull request

1. Fork the repo and create a branch: `git checkout -b my-feature`
2. Make your changes
3. Run `npm run build` and verify it compiles cleanly
4. Test manually against an Apple Journal export
5. Open a PR with a clear description of what changed and why

## Reporting bugs

Please open an [issue](https://github.com/tarikbc/apple-journal-importer/issues) and include:

- Your Obsidian version
- Your macOS version
- A description of what happened vs. what you expected
- Any error messages from the import summary or the Obsidian developer console (`Cmd+Option+I`)
