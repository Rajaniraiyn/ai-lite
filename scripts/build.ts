import fs from "node:fs";
import { getConfig, getPaths } from "./lib/config.ts";
import { parseCli } from "./lib/cli.ts";
import { run } from "./lib/git.ts";

const { args, positionals } = parseCli({
  string: ["cmd"],
});

const cfg = getConfig();
const { repoDir } = getPaths(cfg);

if (!fs.existsSync(repoDir)) {
  throw new Error(`Repo directory does not exist: ${cfg.dir}`);
}

const cmd =
  String(args.cmd ?? positionals[0] ?? "").trim() || cfg.buildCommand || "";

if (!cmd) {
  throw new Error("Provide --cmd or set config.buildCommand.");
}

run(cmd, { cwd: repoDir });
