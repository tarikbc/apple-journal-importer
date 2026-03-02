import { normalizePath, Plugin, TFile } from "obsidian";
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

    this.addCommand({
      id: "new-journal-entry",
      name: "New journal entry for today",
      callback: () => this.createTodayEntry(),
    });

    this.addRibbonIcon("book-open", "Import Apple Journal", () => {
      new ImportModal(this.app, this.settings).open();
    });
  }

  private async createTodayEntry(): Promise<void> {
    const today = new Date();
    const date = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-"); // YYYY-MM-DD in local time

    const dayFolder = normalizePath(`${this.settings.targetFolder}/${date}`);
    const mediaFolder = normalizePath(`${dayFolder}/${this.settings.mediaSubfolder}`);
    const notePath = normalizePath(`${dayFolder}/${date}.md`);

    // Create folders
    for (const folder of [this.settings.targetFolder, dayFolder, mediaFolder]) {
      if (!this.app.vault.getAbstractFileByPath(folder)) {
        await this.app.vault.createFolder(folder);
      }
    }

    // Create note if it doesn't exist yet, then open it
    let file = this.app.vault.getAbstractFileByPath(notePath);
    if (!(file instanceof TFile)) {
      const content = `---\ndate: ${date}\ntags:\n  - journal\n---\n\n`;
      file = await this.app.vault.create(notePath, content);
    }

    if (file instanceof TFile) {
      await this.app.workspace.getLeaf(false).openFile(file);
    }
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
