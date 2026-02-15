/**
 * CLI script to copy BreakdownLogger user guide docs to a target directory.
 *
 * Usage:
 *   deno run -A jsr:@tettuan/breakdownlogger/docs [target-dir]
 *   deno run -A src/docs_cli.ts [target-dir]
 *
 * Default target: tests/docs/breakdownlogger/
 */

const DOC_FILES = ["usage.md", "usage.ja.md"];
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

    console.log(`Done. ${fetched.length} files saved.`);
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
