/**
 * Bump version in deno.json and src/version.ts.
 *
 * Usage:
 *   deno task bump-version          # auto-detect from release/* branch name
 *   deno task bump-version 1.2.3    # explicit version
 */

const DENO_JSON = "deno.json";
const VERSION_TS = "src/version.ts";
const SEMVER_RE = /^\d+\.\d+\.\d+$/;

async function getBranchVersion(): Promise<string | null> {
  const cmd = new Deno.Command("git", {
    args: ["branch", "--show-current"],
    stdout: "piped",
    stderr: "piped",
  });
  const { stdout } = await cmd.output();
  const branch = new TextDecoder().decode(stdout).trim();
  const match = branch.match(/^release\/(.+)$/);
  if (match && SEMVER_RE.test(match[1])) {
    return match[1];
  }
  return null;
}

function updateDenoJson(content: string, version: string): string {
  return content.replace(
    /"version":\s*"[^"]*"/,
    `"version": "${version}"`,
  );
}

function updateVersionTs(version: string): string {
  return `export const BREAKDOWN_LOGGER_VERSION = "${version}";\n`;
}

async function main(): Promise<void> {
  const explicit = Deno.args[0];
  let version: string;

  if (explicit) {
    if (!SEMVER_RE.test(explicit)) {
      console.error(`Error: invalid semver "${explicit}"`);
      Deno.exit(1);
    }
    version = explicit;
  } else {
    const detected = await getBranchVersion();
    if (!detected) {
      console.error(
        "Error: not on a release/* branch and no version argument provided",
      );
      console.error("Usage: deno task bump-version [version]");
      Deno.exit(1);
    }
    version = detected;
  }

  // Update deno.json
  const denoJsonText = await Deno.readTextFile(DENO_JSON);
  const updatedDenoJson = updateDenoJson(denoJsonText, version);
  await Deno.writeTextFile(DENO_JSON, updatedDenoJson);

  // Update src/version.ts
  await Deno.writeTextFile(VERSION_TS, updateVersionTs(version));

  console.log(`Version bumped to ${version}`);
  console.log(`  ${DENO_JSON}: updated`);
  console.log(`  ${VERSION_TS}: updated`);
}

main();
