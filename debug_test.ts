import { BreakdownLogger } from "./mod.ts";

Deno.test("デバッグログレベルの調査", () => {
  // 現在の環境変数をチェック
  console.log("=== 環境変数の確認 ===");
  console.log(`LOG_LEVEL: ${Deno.env.get("LOG_LEVEL") || "未設定"}`);
  console.log(`LOG_LENGTH: ${Deno.env.get("LOG_LENGTH") || "未設定"}`);
  console.log(`LOG_KEY: ${Deno.env.get("LOG_KEY") || "未設定"}`);
  console.log(`FORCE_TEST_MODE: ${Deno.env.get("FORCE_TEST_MODE") || "未設定"}`);

  // テスト環境の検出を確認
  const logger1 = new BreakdownLogger();
  const logger2 = new BreakdownLogger("test-key");

  console.log("\n=== ログレベルの確認 ===");
  console.log("デフォルトロガー:");
  logger1.debug("これはDEBUGメッセージです（LOG_LEVEL=debugでない場合は表示されないはず）");
  logger1.info("これはINFOメッセージです");

  console.log("\nキー付きロガー:");
  logger2.debug("これはDEBUGメッセージです（キー: test-key）");
  logger2.info("これはINFOメッセージです（キー: test-key）");

  // スタックトレース分析
  console.log("\n=== スタックトレース分析 ===");
  const stack = new Error().stack;
  console.log("現在のスタックトレース（抜粋）:");
  const lines = stack?.split('\n').slice(0, 5) || [];
  lines.forEach(line => console.log(line));

  // テスト環境パターンのチェック
  const testPatterns = [
    "_test.ts",
    "_test.js", 
    ".test.ts",
    ".test.js",
    "ext:cli/40_test.js",
    "$deno$test$",
    "TestContext",
    "ext:deno_test/",
    "deno:test",
    "test_runner"
  ];

  console.log("\n=== テスト環境パターンマッチング ===");
  testPatterns.forEach(pattern => {
    const matches = stack?.includes(pattern) || false;
    console.log(`${pattern}: ${matches ? "マッチ" : "非マッチ"}`);
  });
});
