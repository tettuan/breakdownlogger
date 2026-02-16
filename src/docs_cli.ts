/**
 * CLI script to copy BreakdownLogger user guide docs and sample skill files.
 *
 * Usage:
 *   deno run -A jsr:@tettuan/breakdownlogger/docs [target-dir]
 *   deno run -A src/docs_cli.ts [target-dir]
 *
 * Default target: tests/docs/breakdownlogger/
 *
 * Outputs:
 *   docs   → {target-dir}/usage.md, usage.ja.md
 *   skills → .claude/skills/breakdownlogger-implement-logger/SKILL.md
 *            .claude/skills/breakdownlogger-debug-with-logger/SKILL.md
 *
 * @module
 */

const DOC_FILES = ["usage.md", "usage.ja.md"];

const SKILL_FILES: { source: string; dest: string }[] = [
  {
    source: ".claude/skills/implement-logger/SKILL.md",
    dest: ".claude/skills/breakdownlogger-implement-logger/SKILL.md",
  },
  {
    source: ".claude/skills/debug-with-logger/SKILL.md",
    dest: ".claude/skills/breakdownlogger-debug-with-logger/SKILL.md",
  },
];

const DEFAULT_TARGET = "tests/docs/breakdownlogger/";

async function main(): Promise<void> {
  const targetDir = Deno.args[0] ?? DEFAULT_TARGET;
  const normalizedDir = targetDir.replace(/\/$/, "");

  console.log(`BreakdownLogger: Saving docs to ${targetDir}`);

  try {
    await Deno.mkdir(targetDir, { recursive: true });

    const fetched = await Promise.all(
      DOC_FILES.map(async (fileName) => {
        const sourceUrl = new URL(`../docs/${fileName}`, import.meta.url);
        const response = await fetch(sourceUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch ${fileName}: ${response.status} ${response.statusText}`,
          );
        }
        const content = await response.text();
        return { fileName, content };
      }),
    );

    await Promise.all(
      fetched.map(async ({ fileName, content }) => {
        const destPath = `${normalizedDir}/${fileName}`;
        await Deno.writeTextFile(destPath, content);
        console.log(`  -> ${fileName}`);
      }),
    );

    // Write skill files to .claude/skills/ in the consuming project
    const skillResults = await Promise.all(
      SKILL_FILES.map(async ({ source, dest }) => {
        const sourceUrl = new URL(`../${source}`, import.meta.url);
        const response = await fetch(sourceUrl);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch ${source}: ${response.status} ${response.statusText}`,
          );
        }
        const content = await response.text();
        return { dest, content };
      }),
    );

    await Promise.all(
      skillResults.map(async ({ dest, content }) => {
        const dir = dest.substring(0, dest.lastIndexOf("/"));
        await Deno.mkdir(dir, { recursive: true });
        await Deno.writeTextFile(dest, content);
        console.log(`  -> ${dest}`);
      }),
    );

    console.log(
      `Done. ${fetched.length} docs + ${skillResults.length} skills saved.`,
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error(`Error: ${String(error)}`);
    }
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
