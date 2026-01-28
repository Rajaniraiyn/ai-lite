import { parseArgs } from "node:util";

export type ArgSpec = {
  boolean?: string[];
  string?: string[];
  alias?: Record<string, string>;
  defaults?: Record<string, string | boolean>;
};

export function parseCli(spec: ArgSpec = {}) {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: toOptions(spec),
    allowPositionals: true,
  });

  const result: Record<string, string | boolean | undefined> = {
    ...spec.defaults,
  };

  for (const [key, value] of Object.entries(values)) {
    result[key] = value as string | boolean | undefined;
  }

  return { args: result, positionals };
}

function toOptions(spec: ArgSpec) {
  const options: Record<string, { type: "boolean" | "string"; short?: string }> = {};

  for (const key of spec.boolean ?? []) {
    options[key] = { type: "boolean" };
  }
  for (const key of spec.string ?? []) {
    options[key] = { type: "string" };
  }
  for (const [alias, target] of Object.entries(spec.alias ?? {})) {
    if (options[target] && !options[target].short) {
      options[target].short = alias;
    }
  }

  return options;
}
