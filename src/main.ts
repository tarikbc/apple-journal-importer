import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, PluginSettings } from "./types";
import { ImportModal } from "./ui/ImportModal";
import { SettingsTab } from "./ui/SettingsTab";

export default class AppleJournalImporterPlugin extends Plugin {
  settings!: PluginSettings;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addSettingTab(new SettingsTab(this.app, this));

    this.addCommand({
      id: "import-apple-journal",
      name: "Import Apple Journal",
      callback: () => new ImportModal(this.app, this.settings).open(),
    });

    this.addRibbonIcon("book-open", "Import Apple Journal", () => {
      new ImportModal(this.app, this.settings).open();
    });
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData()
    );
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
