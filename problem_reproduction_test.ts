import { BreakdownLogger } from "./mod.ts";
import { EnvironmentConfig } from "./src/environment_config.ts";

Deno.test("修正後の動作確認", () => {
  console.log("=== 修正後の動作確認テスト ===");
  
  // 環境変数をクリア（LOG_LEVEL=debugでない状態を作る）
  Deno.env.delete("LOG_LEVEL");
  Deno.env.delete("LOG_KEY");
  Deno.env.delete("FORCE_TEST_MODE");
  
  console.log(`LOG_LEVEL: ${Deno.env.get("LOG_LEVEL") || "未設定（デフォルト: INFO）"}`);
  console.log(`LOG_KEY: ${Deno.env.get("LOG_KEY") || "未設定（全てのキーを許可）"}`);
  
  // テストヘルパーファイルのパターンを模倣
  // キーなしまたはデフォルトキーでBreakdownLoggerを使用
  const defaultLogger = new BreakdownLogger(); // デフォルトキー "default"
  const namedLogger = new BreakdownLogger("test-module");
  
  console.log("\n=== デフォルトキーのロガー ===");
  defaultLogger.debug("これはDEBUGメッセージです（LOG_LEVEL≠debugで表示されないはず）");
  defaultLogger.info("これはINFOメッセージです（表示されるはず）");
  
  console.log("\n=== 名前付きキーのロガー ===");
  namedLogger.debug("これはDEBUGメッセージです（LOG_LEVEL≠debugで表示されないはず）");
  namedLogger.info("これはINFOメッセージです（表示されるはず）");
  
  // 現在の設定を確認
  const config = new EnvironmentConfig();
  console.log(`\n=== 内部設定の確認 ===`);
  console.log(`LogLevel: ${config.getLogLevel()} (0=DEBUG, 1=INFO, 2=WARN, 3=ERROR)`);
  console.log(`LogKeys: [${config.getLogKeys().join(", ")}]`);
  console.log(`LogKeysの長さ: ${config.getLogKeys().length}`);
});
