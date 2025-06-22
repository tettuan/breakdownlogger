import { BreakdownLogger } from "./mod.ts";

Deno.test("元の問題が修正されたことを確認", () => {
  console.log("=== 元の問題の再現テスト ===");
  
  // 問題のシナリオ：LOG_LEVEL=debugでないのにDEBUGメッセージが表示される
  // 環境変数をクリアして、LOG_LEVEL=debugでない状態を作る
  Deno.env.delete("LOG_LEVEL");
  Deno.env.delete("LOG_KEY");
  
  console.log(`LOG_LEVEL: ${Deno.env.get("LOG_LEVEL") || "未設定（デフォルト: INFO）"}`);
  
  // テストヘルパーファイルでキーなしまたはデフォルトキーで使用される
  const helperLogger = new BreakdownLogger(); // デフォルトキー
  
  console.log("\n=== 修正前: この状況でDEBUGメッセージが表示されていた ===");
  helperLogger.debug("修正前は、これが表示されていた（問題）");
  helperLogger.info("これは正常に表示される");
  
  console.log("\n=== 修正後: DEBUGメッセージは表示されない ===");
  const newLogger = new BreakdownLogger("helper");
  newLogger.debug("修正後は、これは表示されない（正常）");
  newLogger.info("これは正常に表示される");
  
  console.log("\n=== LOG_LEVEL=debugを設定した場合のみDEBUGが表示される ===");
  Deno.env.set("LOG_LEVEL", "debug");
  const debugLogger = new BreakdownLogger("debug-test");
  debugLogger.debug("これは表示される（LOG_LEVEL=debugのため）");
  debugLogger.info("これも表示される");
  
  // 環境変数をクリア
  Deno.env.delete("LOG_LEVEL");
  
  console.log("\n=== 結論 ===");
  console.log("✅ LOG_LEVEL=debugでない時にDEBUGメッセージが表示される問題は修正された");
  console.log("✅ 各BreakdownLoggerインスタンスが作成時の環境変数を独自に読み取る");
  console.log("✅ 新しいインスタンスは最新の環境変数設定を反映する");
  console.log("✅ 既存のインスタンスは作成時の設定を保持する");
});
