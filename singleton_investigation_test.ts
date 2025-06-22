import { BreakdownLogger } from "./mod.ts";
import { EnvironmentConfig } from "./src/environment_config.ts";

Deno.test("環境変数即座反映の調査", () => {
  console.log("=== Step 1: 初期状態の確認 ===");
  Deno.env.delete("LOG_LEVEL");
  Deno.env.delete("LOG_KEY");

  // 新しいロガーを作成
  const logger1 = new BreakdownLogger("test");
  logger1.debug("最初のDEBUGメッセージ（表示されないはず）");
  logger1.info("最初のINFOメッセージ（表示されるはず）");

  console.log("\n=== Step 2: LOG_LEVEL=debugに設定後の状態 ===");
  Deno.env.set("LOG_LEVEL", "debug");

  // 既存のロガーでテスト（古い設定のまま）
  logger1.debug("既存ロガーのDEBUGメッセージ（表示されない）");
  logger1.info("既存ロガーのINFOメッセージ");

  // 新しいロガーでテスト（新しい設定を反映）
  const logger2 = new BreakdownLogger("test2");
  logger2.debug("新しいロガーのDEBUGメッセージ（表示されるはず）");
  logger2.info("新しいロガーのINFOメッセージ");

  console.log("\n=== Step 3: 環境変数を削除してテスト ===");
  Deno.env.delete("LOG_LEVEL");

  // 新しいロガーを作成（デフォルト設定を反映）
  const logger3 = new BreakdownLogger("test3");
  logger3.debug("環境変数削除後のDEBUGメッセージ（表示されないはず）");
  logger3.info("環境変数削除後のINFOメッセージ");

  // 既存のロガーは古い設定のまま
  logger2.debug("古いロガーのDEBUGメッセージ（まだ表示される）");
  logger2.info("古いロガーのINFOメッセージ");

  // 現在の設定を表示
  const config = new EnvironmentConfig();
  console.log(`\n現在のLogLevel: ${config.getLogLevel()}`);
  console.log(
    `現在のLOG_LEVEL環境変数: ${Deno.env.get("LOG_LEVEL") || "未設定"}`,
  );
});
