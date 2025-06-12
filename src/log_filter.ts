import type { LogLevel } from "./types.ts";

export class LogFilter {
  private isTestEnvironment: boolean;

  constructor() {
    this.isTestEnvironment = this.checkTestEnvironment();
  }

  shouldLog(level: LogLevel, currentLevel: LogLevel): boolean {
    // テストコードでない場合は常にfalse
    if (!this.isTestEnvironment) {
      return false;
    }

    // 現在のログレベル以上のものだけ出力
    return level >= currentLevel;
  }

  shouldOutputKey(key: string, allowedKeys: string[]): boolean {
    // KEYが指定されていない場合は全て出力
    if (allowedKeys.length === 0) {
      return true;
    }

    // 指定されたKEYに含まれているかチェック
    return allowedKeys.includes(key);
  }

  private checkTestEnvironment(): boolean {
    // Deno.testコンテキストかどうかをチェック
    // Denoテストコンテキストでは、スタックトレースに特定のパターンが含まれる
    const stack = new Error().stack;
    if (!stack) return false;

    // Denoのテストランナーが含まれているかチェック
    const isDenoTest = stack.includes("ext:cli/40_test.js") ||
      stack.includes("$deno$test$") ||
      stack.includes("TestContext") ||
      stack.includes("ext:deno_test/") || // CI環境でのテストランナー
      stack.includes("deno:test") || // 別のテストランナーパターン
      stack.includes("test.ts") || // Deno test files in CI
      stack.includes("test_runner"); // Generic test runner pattern

    // テストファイルパターンをチェック
    const hasTestPattern = stack.includes("_test.ts") ||
      stack.includes("_test.js") ||
      stack.includes("_test.mjs") ||
      stack.includes("_test.jsx") ||
      stack.includes("_test.tsx") ||
      stack.includes(".test.ts") ||
      stack.includes(".test.js") ||
      stack.includes("_test.") || // より広範なパターン
      stack.includes(".test."); // より広範なパターン

    // 環境変数による強制テストモード（デバッグ用）
    const forceTestMode = Deno.env.get("FORCE_TEST_MODE") === "true";

    return isDenoTest || hasTestPattern || forceTestMode;
  }
}
