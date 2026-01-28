import readline from "node:readline";

export async function prompt(question: string): Promise<string> {
  if (!process.stdin.isTTY) {
    throw new Error("Prompt requested but no TTY is available.");
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return await new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function confirm(question: string): Promise<boolean> {
  const answer = await prompt(`${question} [y/N] `);
  return /^y(es)?$/i.test(answer);
}
