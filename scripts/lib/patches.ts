import fs from "node:fs";
import path from "node:path";

export type PatchEntry = {
  file: string;
  number: number;
  name: string;
  absPath: string;
};

const patchPattern = /^(\d+)_([a-zA-Z0-9._-]+)\.patch$/;

export function listPatches(patchesDir: string): PatchEntry[] {
  if (!fs.existsSync(patchesDir)) {
    return [];
  }
  const entries = fs
    .readdirSync(patchesDir)
    .filter((file) => patchPattern.test(file))
    .map((file) => {
      const match = patchPattern.exec(file);
      if (!match) {
        return null;
      }
      const number = Number.parseInt(match[1], 10);
      const name = match[2];
      return {
        file,
        number,
        name,
        absPath: path.join(patchesDir, file),
      };
    })
    .filter(Boolean) as PatchEntry[];

  return entries.sort((a, b) => a.number - b.number);
}

export function nextPatchNumber(patches: PatchEntry[]): number {
  if (patches.length === 0) {
    return 1;
  }
  return Math.max(...patches.map((p) => p.number)) + 1;
}

export function resolvePatch(
  patches: PatchEntry[],
  target: string,
): PatchEntry {
  const byNumber = Number.parseInt(target, 10);
  if (!Number.isNaN(byNumber)) {
    const found = patches.find((patch) => patch.number === byNumber);
    if (found) {
      return found;
    }
  }

  const found = patches.find(
    (patch) => patch.file === target || patch.name === target,
  );
  if (!found) {
    throw new Error(`Patch not found: ${target}`);
  }
  return found;
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
