// Minimal stand-ins for the "obsidian" module so importer.ts can run under node:test.

export class TFile {}

export class FileSystemAdapter {}

export function normalizePath(p: string): string {
  return p
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/^\/|\/$/g, "");
}

export type App = {
  vault: {
    adapter: { getBasePath(): string };
    getAbstractFileByPath(path: string): unknown;
    createFolder(path: string): Promise<void>;
    create(path: string, content: string): Promise<void>;
    modify(file: unknown, content: string): Promise<void>;
  };
};

/** In-memory vault mock covering the surface runImport touches. */
export function makeFakeApp(basePath: string): {
  app: App;
  notes: Map<string, string>;
  folders: Set<string>;
} {
  const notes = new Map<string, string>();
  const folders = new Set<string>();

  const app: App = {
    vault: {
      adapter: { getBasePath: () => basePath },
      getAbstractFileByPath: (p: string) => (folders.has(p) ? {} : null),
      createFolder: async (p: string) => {
        folders.add(p);
      },
      create: async (p: string, content: string) => {
        notes.set(p, content);
      },
      modify: async (_f: unknown, _content: string) => {
        /* not exercised: getAbstractFileByPath never returns a TFile */
      },
    },
  };

  return { app, notes, folders };
}
