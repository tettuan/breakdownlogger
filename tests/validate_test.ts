import { assertEquals } from "@std/assert";
import { validateNoProductionUsage } from "../src/validate_cli.ts";

Deno.test("validateNoProductionUsage", async (t) => {
  await t.step({
    name: "Clean directory with no violations returns empty result",
    fn: async () => {
      const tmpDir = await Deno.makeTempDir();
      try {
        await Deno.writeTextFile(
          `${tmpDir}/app.ts`,
          'import { something } from "some-other-lib";\n',
        );

        const violations = await validateNoProductionUsage(tmpDir);
        assertEquals(violations.length, 0);
      } finally {
        await Deno.remove(tmpDir, { recursive: true });
      }
    },
  });

  await t.step({
    name:
      "Non-test file with @tettuan/breakdownlogger import reports 1 violation",
    fn: async () => {
      const tmpDir = await Deno.makeTempDir();
      try {
        await Deno.writeTextFile(
          `${tmpDir}/my_debug.ts`,
          'import { BreakdownLogger } from "@tettuan/breakdownlogger";\n',
        );

        const violations = await validateNoProductionUsage(tmpDir);
        assertEquals(violations.length, 1);
        assertEquals(violations[0].line, 1);
        assertEquals(
          violations[0].content,
          'import { BreakdownLogger } from "@tettuan/breakdownlogger";',
        );
      } finally {
        await Deno.remove(tmpDir, { recursive: true });
      }
    },
  });

  await t.step({
    name: "Test file with import is correctly excluded (0 violations)",
    fn: async () => {
      const tmpDir = await Deno.makeTempDir();
      try {
        await Deno.writeTextFile(
          `${tmpDir}/foo_test.ts`,
          'import { BreakdownLogger } from "@tettuan/breakdownlogger";\n',
        );

        const violations = await validateNoProductionUsage(tmpDir);
        assertEquals(violations.length, 0);
      } finally {
        await Deno.remove(tmpDir, { recursive: true });
      }
    },
  });

  await t.step({
    name: "Multiple violations across files are all detected",
    fn: async () => {
      const tmpDir = await Deno.makeTempDir();
      try {
        await Deno.writeTextFile(
          `${tmpDir}/a.ts`,
          'import { BreakdownLogger } from "@tettuan/breakdownlogger";\n',
        );
        await Deno.writeTextFile(
          `${tmpDir}/b.ts`,
          'const x = 1;\nimport { BreakdownLogger } from "@tettuan/breakdownlogger";\n',
        );

        const violations = await validateNoProductionUsage(tmpDir);
        assertEquals(violations.length, 2);
      } finally {
        await Deno.remove(tmpDir, { recursive: true });
      }
    },
  });

  await t.step({
    name: "Subpath import from @tettuan/breakdownlogger/logger is detected",
    fn: async () => {
      const tmpDir = await Deno.makeTempDir();
      try {
        await Deno.writeTextFile(
          `${tmpDir}/util.ts`,
          'import { BreakdownLogger } from "@tettuan/breakdownlogger/logger";\n',
        );

        const violations = await validateNoProductionUsage(tmpDir);
        assertEquals(violations.length, 1);
        assertEquals(
          violations[0].content,
          'import { BreakdownLogger } from "@tettuan/breakdownlogger/logger";',
        );
      } finally {
        await Deno.remove(tmpDir, { recursive: true });
      }
    },
  });

  await t.step({
    name: "Dynamic import of @tettuan/breakdownlogger is detected",
    fn: async () => {
      const tmpDir = await Deno.makeTempDir();
      try {
        await Deno.writeTextFile(
          `${tmpDir}/loader.ts`,
          'const mod = await import("@tettuan/breakdownlogger");\n',
        );

        const violations = await validateNoProductionUsage(tmpDir);
        assertEquals(violations.length, 1);
        assertEquals(
          violations[0].content,
          'const mod = await import("@tettuan/breakdownlogger");',
        );
      } finally {
        await Deno.remove(tmpDir, { recursive: true });
      }
    },
  });

  await t.step({
    name: "Re-export from @tettuan/breakdownlogger is detected",
    fn: async () => {
      const tmpDir = await Deno.makeTempDir();
      try {
        await Deno.writeTextFile(
          `${tmpDir}/reexport.ts`,
          'export { BreakdownLogger } from "@tettuan/breakdownlogger";\n',
        );

        const violations = await validateNoProductionUsage(tmpDir);
        assertEquals(violations.length, 1);
        assertEquals(
          violations[0].content,
          'export { BreakdownLogger } from "@tettuan/breakdownlogger";',
        );
      } finally {
        await Deno.remove(tmpDir, { recursive: true });
      }
    },
  });

  await t.step({
    name: "Various test file patterns are all excluded",
    fn: async () => {
      const tmpDir = await Deno.makeTempDir();
      const importLine =
        'import { BreakdownLogger } from "@tettuan/breakdownlogger";\n';
      try {
        await Deno.writeTextFile(`${tmpDir}/foo_test.ts`, importLine);
        await Deno.writeTextFile(`${tmpDir}/bar.test.ts`, importLine);
        await Deno.writeTextFile(`${tmpDir}/baz_test.js`, importLine);
        await Deno.writeTextFile(`${tmpDir}/qux.test.js`, importLine);
        await Deno.writeTextFile(`${tmpDir}/quux_test.tsx`, importLine);

        const violations = await validateNoProductionUsage(tmpDir);
        assertEquals(violations.length, 0);
      } finally {
        await Deno.remove(tmpDir, { recursive: true });
      }
    },
  });
});
