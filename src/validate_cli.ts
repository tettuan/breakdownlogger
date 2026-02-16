/**
 * CLI script to detect @tettuan/breakdownlogger imports in non-test (production) files.
 *
 * Usage:
 *   deno run --allow-read src/validate_cli.ts [target-dir]
 *
 * Default target: "."
 *
 * Exit code 1 if violations found, 0 if clean.
 *
 * @module
 */

import { walk } from "@std/fs/walk";
import { TEST_FILE_PATTERNS } from "./test_detector.ts";

/** A single violation: a non-test file importing @tettuan/breakdownlogger. */
export interface Violation {
  file: string;
  line: number;
  content: string;
}

const IMPORT_PATTERN = /@tettuan\/breakdownlogger/;

/**
 * Returns true if the given file name matches any test file pattern.
 *
 * @param fileName - The base name of the file to check
 * @returns Whether the file is considered a test file
 */
function isTestFile(fileName: string): boolean {
  return TEST_FILE_PATTERNS.some((pattern) => fileName.endsWith(pattern));
}

/**
 * Scans a directory for non-test .ts/.js files that import @tettuan/breakdownlogger.
 *
 * @param dir - The directory to scan recursively
 * @returns Array of violations found
 */
export async function validateNoProductionUsage(
  dir: string,
): Promise<Violation[]> {
  const violations: Violation[] = [];

  for await (
    const entry of walk(dir, {
      exts: ["ts", "js"],
      includeDirs: false,
    })
  ) {
    if (isTestFile(entry.name)) {
      continue;
    }

    const content = await Deno.readTextFile(entry.path);
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      if (IMPORT_PATTERN.test(lines[i])) {
        violations.push({
          file: entry.path,
          line: i + 1,
          content: lines[i],
        });
      }
    }
  }

  return violations;
}

async function main(): Promise<void> {
  const targetDir = Deno.args[0] ?? ".";

  console.log(`Scanning: ${targetDir}`);

  try {
    const violations = await validateNoProductionUsage(targetDir);

    if (violations.length > 0) {
      for (const v of violations) {
        console.log(`  VIOLATION: ${v.file}:${v.line}: ${v.content}`);
      }
      console.error(
        `Found ${violations.length} violation(s) in non-test files.`,
      );
      Deno.exit(1);
    }

    console.log(
      "No violations found. All @tettuan/breakdownlogger imports are in test files only.",
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
