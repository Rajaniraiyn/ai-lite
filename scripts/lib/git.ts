import { spawnSync } from "node:child_process";

type RunOptions = {
  cwd?: string;
  stdio?: "inherit" | "pipe";
};

export function run(cmd: string, options: RunOptions = {}) {
  const result = spawnSync(cmd, {
    cwd: options.cwd,
    shell: true,
    stdio: options.stdio ?? "inherit",
    encoding: "utf8",
  });

  if (result.status !== 0) {
    const error = new Error(`Command failed: ${cmd}`);
    (error as Error & { code?: number }).code = result.status ?? undefined;
    throw error;
  }

  return result.stdout ?? "";
}

export function runCapture(cmd: string, options: RunOptions = {}) {
  return run(cmd, { ...options, stdio: "pipe" }).toString();
}

export function ensureCleanRepo(repoDir: string) {
  const status = runCapture("git status --porcelain", { cwd: repoDir }).trim();
  if (status) {
    throw new Error("Repo has uncommitted changes. Reset or stash before continuing.");
  }
}
