import { assertEquals } from "https://deno.land/std@0.219.0/assert/mod.ts";
import { EnvironmentConfig } from "../src/environment_config.ts";
import { LogLength, LogLevel } from "../src/types.ts";

Deno.test("EnvironmentConfig - Edge Cases and Error Handling", async (t) => {
  // Store original environment values
  const originalLogLevel = Deno.env.get("LOG_LEVEL");
  const originalLogLength = Deno.env.get("LOG_LENGTH");
  const originalLogKey = Deno.env.get("LOG_KEY");

  const cleanup = () => {
    // Restore original values
    if (originalLogLevel !== undefined) {
      Deno.env.set("LOG_LEVEL", originalLogLevel);
    } else {
      Deno.env.delete("LOG_LEVEL");
    }
    if (originalLogLength !== undefined) {
      Deno.env.set("LOG_LENGTH", originalLogLength);
    } else {
      Deno.env.delete("LOG_LENGTH");
    }
    if (originalLogKey !== undefined) {
      Deno.env.set("LOG_KEY", originalLogKey);
    } else {
      Deno.env.delete("LOG_KEY");
    }
  };

  await t.step("LOG_LEVEL edge cases", async (t) => {
    await t.step("should handle mixed case LOG_LEVEL", () => {
      try {
        Deno.env.set("LOG_LEVEL", "DeBuG");
        const config = new EnvironmentConfig();
        assertEquals(config.getLogLevel(), LogLevel.DEBUG);
      } finally {
        cleanup();
      }
    });

    await t.step("should handle LOG_LEVEL with leading/trailing spaces", () => {
      try {
        Deno.env.set("LOG_LEVEL", "  info  ");
        const config = new EnvironmentConfig();
        assertEquals(config.getLogLevel(), LogLevel.INFO);
      } finally {
        cleanup();
      }
    });

    await t.step("should default to INFO for invalid LOG_LEVEL", () => {
      try {
        Deno.env.set("LOG_LEVEL", "INVALID_LEVEL");
        const config = new EnvironmentConfig();
        assertEquals(config.getLogLevel(), LogLevel.INFO);
      } finally {
        cleanup();
      }
    });

    await t.step("should default to INFO for empty LOG_LEVEL", () => {
      try {
        Deno.env.set("LOG_LEVEL", "");
        const config = new EnvironmentConfig();
        assertEquals(config.getLogLevel(), LogLevel.INFO);
      } finally {
        cleanup();
      }
    });

    await t.step("should handle numeric LOG_LEVEL", () => {
      try {
        Deno.env.set("LOG_LEVEL", "0");
        const config = new EnvironmentConfig();
        assertEquals(config.getLogLevel(), LogLevel.INFO); // Should default
      } finally {
        cleanup();
      }
    });
  });

  await t.step("LOG_LENGTH edge cases", async (t) => {
    await t.step("should handle mixed case LOG_LENGTH", () => {
      try {
        Deno.env.set("LOG_LENGTH", "s");
        const config = new EnvironmentConfig();
        assertEquals(config.getLogLength(), LogLength.SHORT);
      } finally {
        cleanup();
      }
    });

    await t.step("should handle LOG_LENGTH with spaces", () => {
      try {
        Deno.env.set("LOG_LENGTH", " L ");
        const config = new EnvironmentConfig();
        assertEquals(config.getLogLength(), LogLength.LONG);
      } finally {
        cleanup();
      }
    });

    await t.step("should default to DEFAULT for invalid LOG_LENGTH", () => {
      try {
        Deno.env.set("LOG_LENGTH", "INVALID");
        const config = new EnvironmentConfig();
        assertEquals(config.getLogLength(), LogLength.DEFAULT);
      } finally {
        cleanup();
      }
    });

    await t.step("should default to DEFAULT for empty LOG_LENGTH", () => {
      try {
        Deno.env.set("LOG_LENGTH", "");
        const config = new EnvironmentConfig();
        assertEquals(config.getLogLength(), LogLength.DEFAULT);
      } finally {
        cleanup();
      }
    });

    await t.step("should handle numeric LOG_LENGTH", () => {
      try {
        Deno.env.set("LOG_LENGTH", "160");
        const config = new EnvironmentConfig();
        assertEquals(config.getLogLength(), LogLength.DEFAULT); // Should default
      } finally {
        cleanup();
      }
    });
  });

  await t.step("LOG_KEY edge cases", async (t) => {
    await t.step("should handle LOG_KEY with only separators", () => {
      try {
        Deno.env.set("LOG_KEY", ",,,::://");
        const config = new EnvironmentConfig();
        assertEquals(config.getLogKeys(), []); // Empty keys should be filtered
      } finally {
        cleanup();
      }
    });

    await t.step("should handle LOG_KEY with empty segments", () => {
      try {
        Deno.env.set("LOG_KEY", "key1,,key2::,key3//");
        const config = new EnvironmentConfig();
        assertEquals(config.getLogKeys(), ["key1", "key2", "key3"]);
      } finally {
        cleanup();
      }
    });

    await t.step("should preserve whitespace in LOG_KEY values", () => {
      try {
        Deno.env.set("LOG_KEY", " key 1 , key 2 : key 3 ");
        const config = new EnvironmentConfig();
        assertEquals(config.getLogKeys(), [" key 1 ", " key 2 ", " key 3 "]);
      } finally {
        cleanup();
      }
    });

    await t.step("should handle single key without separators", () => {
      try {
        Deno.env.set("LOG_KEY", "single-key");
        const config = new EnvironmentConfig();
        assertEquals(config.getLogKeys(), ["single-key"]);
      } finally {
        cleanup();
      }
    });

    await t.step("should handle LOG_KEY with special characters", () => {
      try {
        Deno.env.set("LOG_KEY", "key-1,key_2:key@3/key$4");
        const config = new EnvironmentConfig();
        assertEquals(config.getLogKeys(), ["key-1", "key_2", "key@3", "key$4"]);
      } finally {
        cleanup();
      }
    });

    await t.step("should handle empty LOG_KEY", () => {
      try {
        Deno.env.set("LOG_KEY", "");
        const config = new EnvironmentConfig();
        assertEquals(config.getLogKeys(), []);
      } finally {
        cleanup();
      }
    });

    await t.step("should handle very long LOG_KEY", () => {
      try {
        const longKeys = Array.from({ length: 50 }, (_, i) => `key${i}`).join(
          ",",
        );
        Deno.env.set("LOG_KEY", longKeys);
        const config = new EnvironmentConfig();
        assertEquals(config.getLogKeys().length, 50);
        assertEquals(config.getLogKeys()[0], "key0");
        assertEquals(config.getLogKeys()[49], "key49");
      } finally {
        cleanup();
      }
    });
  });

  await t.step("multiple environment variables interaction", async (t) => {
    await t.step("should handle all valid environment variables", () => {
      try {
        Deno.env.set("LOG_LEVEL", "debug");
        Deno.env.set("LOG_LENGTH", "L");
        Deno.env.set("LOG_KEY", "test-key,debug-key");

        const config = new EnvironmentConfig();
        assertEquals(config.getLogLevel(), LogLevel.DEBUG);
        assertEquals(config.getLogLength(), LogLength.LONG);
        assertEquals(config.getLogKeys(), ["test-key", "debug-key"]);
      } finally {
        cleanup();
      }
    });

    await t.step(
      "should handle mix of valid and invalid environment variables",
      () => {
        try {
          Deno.env.set("LOG_LEVEL", "INVALID");
          Deno.env.set("LOG_LENGTH", "W");
          Deno.env.set("LOG_KEY", "valid-key");

          const config = new EnvironmentConfig();
          assertEquals(config.getLogLevel(), LogLevel.INFO); // Defaults to INFO
          assertEquals(config.getLogLength(), LogLength.WHOLE); // Valid
          assertEquals(config.getLogKeys(), ["valid-key"]); // Valid
        } finally {
          cleanup();
        }
      },
    );
  });

  await t.step("instance independence", async (t) => {
    await t.step("should create independent instances", () => {
      try {
        Deno.env.set("LOG_LEVEL", "debug");
        Deno.env.set("LOG_LENGTH", "S");
        Deno.env.set("LOG_KEY", "instance-test");

        const config1 = new EnvironmentConfig();
        const config2 = new EnvironmentConfig();

        // Both should have same values but be different instances
        assertEquals(config1.getLogLevel(), config2.getLogLevel());
        assertEquals(config1.getLogLength(), config2.getLogLength());
        assertEquals(config1.getLogKeys(), config2.getLogKeys());

        // Modify environment and create new instance
        Deno.env.set("LOG_LEVEL", "error");
        const config3 = new EnvironmentConfig();

        // Old instances should maintain their original values
        assertEquals(config1.getLogLevel(), LogLevel.DEBUG);
        assertEquals(config2.getLogLevel(), LogLevel.DEBUG);

        // New instance should have updated value
        assertEquals(config3.getLogLevel(), LogLevel.ERROR);
      } finally {
        cleanup();
      }
    });
  });
});
