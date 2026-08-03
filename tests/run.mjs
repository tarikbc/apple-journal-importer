// Bundles the TS test files (stubbing the "obsidian" module) and runs them
// with the built-in node:test runner. Usage: npm test
import { build } from "esbuild";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";
import * as fs from "fs";
import * as path from "path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outdir = path.join(root, "tests", ".build");
fs.rmSync(outdir, { recursive: true, force: true });

await build({
  entryPoints: [
    path.join(root, "tests/parser.test.ts"),
    path.join(root, "tests/importer.test.ts"),
    path.join(root, "tests/converter.test.ts"),
  ],
  bundle: true,
  platform: "node",
  format: "cjs",
  outdir,
  alias: { obsidian: path.join(root, "tests/obsidian-stub.ts") },
  logLevel: "warning",
});

const files = fs.readdirSync(outdir).map((f) => path.join(outdir, f));
const res = spawnSync(process.execPath, ["--test", ...files], {
  stdio: "inherit",
});
process.exit(res.status ?? 1);
