import fs from "node:fs";
import path from "node:path";

export type Config = {
  repo: string;
  commit: string;
  dir: string;
  patchesDir: string;
  branch: string;
  buildCommand?: string;
};

export type AppPaths = {
  rootDir: string;
  repoDir: string;
  patchesDir: string;
};

export function getConfig(): Config {
  const pkgPath = path.join(process.cwd(), "package.json");
  const pkgRaw = fs.readFileSync(pkgPath, "utf8");
  const pkg = JSON.parse(pkgRaw) as { config?: Partial<Config> };
  const cfg = pkg.config ?? {};

  const repo = String(cfg.repo ?? "").trim();
  const commit = String(cfg.commit ?? "").trim();
  const dir = String(cfg.dir ?? "ai").trim();
  const patchesDir = String(cfg.patchesDir ?? "patches").trim();
  const branch = String(cfg.branch ?? "ai-lite").trim();
  const buildCommand = String(cfg.buildCommand ?? "").trim();

  if (!repo) {
    throw new Error("package.json config.repo is required.");
  }
  if (!commit) {
    throw new Error("package.json config.commit is required.");
  }
  if (!dir) {
    throw new Error("package.json config.dir is required.");
  }
  if (!patchesDir) {
    throw new Error("package.json config.patchesDir is required.");
  }
  if (!branch) {
    throw new Error("package.json config.branch is required.");
  }

  return { repo, commit, dir, patchesDir, branch, buildCommand };
}

export function getPaths(cfg: Config): AppPaths {
  const rootDir = process.cwd();
  return {
    rootDir,
    repoDir: path.join(rootDir, cfg.dir),
    patchesDir: path.join(rootDir, cfg.patchesDir),
  };
}
