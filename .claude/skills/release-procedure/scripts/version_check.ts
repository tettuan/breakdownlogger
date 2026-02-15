/**
 * Check version consistency across deno.json, src/version.ts, and release branch.
 *
 * Usage:
 *   deno run --allow-read --allow-run scripts/version_check.ts
 */

const DENO_JSON = "deno.json";
const VERSION_TS = "src/version.ts";
const VERSION_RE = /export\s+const\s+BREAKDOWN_LOGGER_VERSION\s*=\s*"([^"]+)"/;

async function readDenoJsonVersion(): Promise<string> {
  const text = await Deno.readTextFile(DENO_JSON);
  const json = JSON.parse(text) as { version?: string };
  if (!json.version) {
    console.error(`Error: "version" field not found in ${DENO_JSON}`);
    Deno.exit(1);
  }
  return json.version;
}

async function readVersionTs(): Promise<string> {
  const text = await Deno.readTextFile(VERSION_TS);
  const match = text.match(VERSION_RE);
  if (!match) {
    console.error(
      `Error: BREAKDOWN_LOGGER_VERSION not found in ${VERSION_TS}`,
    );
    Deno.exit(1);
  }
  return match[1];
}

async function getCurrentBranch(): Promise<string> {
  const cmd = new Deno.Command("git", {
    args: ["branch", "--show-current"],
    stdout: "piped",
    stderr: "piped",
  });
  const { stdout } = await cmd.output();
  return new TextDecoder().decode(stdout).trim();
}

async function main(): Promise<void> {
  // 1. Check deno.json vs src/version.ts
  const denoJsonVersion = await readDenoJsonVersion();
  const versionTsVersion = await readVersionTs();

  if (denoJsonVersion !== versionTsVersion) {
    console.error("Error: version mismatch between files");
    console.error(`  ${DENO_JSON}: ${denoJsonVersion}`);
    console.error(`  ${VERSION_TS}: ${versionTsVersion}`);
    Deno.exit(1);
  }
  console.log(`Version consistency check passed: ${denoJsonVersion}`);

  // 2. Check release branch version (conditional)
  const branch = await getCurrentBranch();
  const releaseMatch = branch.match(/^release\/(.+)$/);

  if (!releaseMatch) {
    console.log(`Not on a release/* branch (${branch}), skipping branch check`);
    return;
  }

  const branchVersion = releaseMatch[1];
  if (branchVersion !== denoJsonVersion) {
    console.error("Error: branch version does not match deno.json");
    console.error(`  branch: release/${branchVersion}`);
    console.error(`  ${DENO_JSON}: ${denoJsonVersion}`);
    Deno.exit(1);
  }
  console.log(`Branch version check passed: release/${branchVersion}`);
}

main();
