import { App, PluginSettingTab, Setting } from "obsidian";
import AppleJournalImporterPlugin from "../main";

export class SettingsTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: AppleJournalImporterPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Target folder")
      .setDesc(
        "Vault folder where imported entries will be created. Will be created if it does not exist."
      )
      .addText((text) => {
        text
          .setPlaceholder("Journal")
          .setValue(this.plugin.settings.targetFolder)
          .onChange(async (val) => {
            this.plugin.settings.targetFolder = val.trim() || "Journal";
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Convert HEIC to JPEG")
      .setDesc(
        "Convert Apple HEIC images to JPEG so Obsidian can display them inline. Uses the built-in macOS sips command."
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.convertHeic)
          .onChange(async (val) => {
            this.plugin.settings.convertHeic = val;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Media subfolder name")
      .setDesc(
        "Name of the subfolder inside each entry folder where media files are stored."
      )
      .addText((text) => {
        text
          .setPlaceholder("media")
          .setValue(this.plugin.settings.mediaSubfolder)
          .onChange(async (val) => {
            this.plugin.settings.mediaSubfolder = val.trim() || "media";
            await this.plugin.saveSettings();
          });
      });
  }
}
