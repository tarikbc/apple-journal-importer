import { App, Modal, Notice, Setting } from "obsidian";
import { PluginSettings, ImportResult } from "../types";
import { countEntries, runImport, validateExportPath } from "../importer";

export class ImportModal extends Modal {
  private exportPath: string;
  private readonly settings: PluginSettings;

  constructor(app: App, settings: PluginSettings) {
    super(app);
    this.settings = settings;
    this.exportPath = "";
    this.modalEl.addClass("apple-journal-importer-modal");
  }

  onOpen(): void {
    this.renderPicker();
  }

  onClose(): void {
    this.contentEl.empty();
  }

  // ---------------------------------------------------------------------------
  // Step 1 — path picker
  // ---------------------------------------------------------------------------

  private renderPicker(): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "Import Apple Journal" });

    contentEl.createEl("p", {
      text: "Point to the folder you exported from the Apple Journal app. It should contain an Entries/ and a Resources/ subfolder.",
      cls: "setting-item-description",
    });

    const pathSetting = new Setting(contentEl)
      .setName("Export folder path")
      .setClass("path-setting")
      .addText((text) => {
        text
          .setPlaceholder("/Users/you/Downloads/AppleJournalEntries")
          .setValue(this.exportPath)
          .onChange((val) => {
            this.exportPath = val;
          });
        text.inputEl.addClass("apple-journal-path-input");
        // Allow pressing Enter to confirm
        text.inputEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter") this.confirmPath();
        });
      });

    // Suppress the default label layout so the input takes full width
    pathSetting.settingEl.addClass("apple-journal-path-setting");

    new Setting(contentEl).addButton((btn) => {
      btn
        .setButtonText("Next →")
        .setCta()
        .onClick(() => this.confirmPath());
    });
  }

  private confirmPath(): void {
    const path = this.exportPath.trim();
    const error = validateExportPath(path);
    if (error) {
      new Notice(error);
      return;
    }
    this.renderConfirm(path);
  }

  // ---------------------------------------------------------------------------
  // Step 2 — confirm + start
  // ---------------------------------------------------------------------------

  private renderConfirm(exportPath: string): void {
    const { contentEl } = this;
    contentEl.empty();

    const count = countEntries(exportPath);

    contentEl.createEl("h2", { text: "Ready to import" });

    contentEl.createEl("p", {
      text: `Found ${count} journal entries.`,
    });

    contentEl.createEl("p", {
      text: `They will be imported into "${this.settings.targetFolder}" in your vault.`,
      cls: "setting-item-description",
    });

    if (this.settings.convertHeic) {
      contentEl.createEl("p", {
        text: "HEIC images will be converted to JPEG (requires macOS).",
        cls: "setting-item-description",
      });
    }

    new Setting(contentEl)
      .addButton((btn) =>
        btn.setButtonText("← Back").onClick(() => this.renderPicker())
      )
      .addButton((btn) => {
        btn
          .setButtonText(`Import ${count} entries`)
          .setCta()
          .onClick(() => this.startImport(exportPath, count));
      });
  }

  // ---------------------------------------------------------------------------
  // Step 3 — progress
  // ---------------------------------------------------------------------------

  private async startImport(exportPath: string, total: number): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "Importing…" });

    const progressWrap = contentEl.createDiv({ cls: "progress-wrap" });
    const progressBar = progressWrap.createEl("progress");
    progressBar.max = total;
    progressBar.value = 0;

    const progressLabel = progressWrap.createDiv({
      cls: "progress-label",
      text: "Starting…",
    });

    const result = await runImport(
      this.app,
      this.settings,
      exportPath,
      (current, _total, label) => {
        progressBar.value = current;
        progressLabel.setText(`${current} / ${_total} — ${label}`);
      }
    );

    this.renderSummary(result);
  }

  // ---------------------------------------------------------------------------
  // Step 4 — summary
  // ---------------------------------------------------------------------------

  private renderSummary(result: ImportResult): void {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "Import complete" });

    const stats = contentEl.createDiv({ cls: "summary-stats" });

    this.createStat(stats, String(result.imported), "imported");
    if (result.skipped > 0) {
      this.createStat(stats, String(result.skipped), "skipped");
    }
    if (result.errors.length > 0) {
      this.createStat(stats, String(result.errors.length), "errors", true);
    }

    if (result.errors.length > 0) {
      contentEl.createEl("p", { text: "Errors:" });
      const log = contentEl.createDiv({ cls: "error-log" });
      for (const err of result.errors) {
        log.createEl("p", { text: `${err.entry}: ${err.error}` });
      }
    }

    new Setting(contentEl).addButton((btn) => {
      btn
        .setButtonText("Close")
        .setCta()
        .onClick(() => this.close());
    });
  }

  private createStat(
    parent: HTMLElement,
    value: string,
    label: string,
    isError = false
  ): void {
    const stat = parent.createDiv({ cls: "stat" });
    const valueEl = stat.createDiv({ cls: "stat-value", text: value });
    if (isError) valueEl.addClass("error");
    stat.createDiv({ cls: "stat-label", text: label });
  }
}
