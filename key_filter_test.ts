import { BreakdownLogger } from "./mod.ts";

Deno.test("LOG_KEYとデフォルトキーの関係を調査", () => {
  console.log("=== 現在の環境変数 ===");
  console.log(
    `LOG_LEVEL: ${Deno.env.get("LOG_LEVEL") || "未設定 (デフォルト: INFO)"}`,
  );
  console.log(
    `LOG_KEY: ${Deno.env.get("LOG_KEY") || "未設定 (全てのキーを許可)"}`,
  );

  console.log("\n=== テスト1: LOG_KEYが未設定の場合 ===");
  Deno.env.delete("LOG_KEY");

  const logger1 = new BreakdownLogger(); // "default"キー
  const logger2 = new BreakdownLogger("test-key");

  console.log("デフォルトキー（引数なし）のロガー:");
  logger1.debug("DEBUGメッセージ（デフォルトキー）");
  logger1.info("INFOメッセージ（デフォルトキー）");

  console.log("明示的なキーのロガー:");
  logger2.debug("DEBUGメッセージ（test-key）");
  logger2.info("INFOメッセージ（test-key）");

  console.log("\n=== テスト2: LOG_KEY=specificに設定した場合 ===");
  Deno.env.set("LOG_KEY", "specific");

  const logger3 = new BreakdownLogger(); // "default"キー
  const logger4 = new BreakdownLogger("specific");
  const logger5 = new BreakdownLogger("other");

  console.log("デフォルトキーのロガー（フィルタされるはず）:");
  logger3.debug("DEBUGメッセージ（デフォルトキー、フィルタされるはず）");
  logger3.info("INFOメッセージ（デフォルトキー、フィルタされるはず）");

  console.log("許可されたキーのロガー:");
  logger4.debug("DEBUGメッセージ（specific、許可されている）");
  logger4.info("INFOメッセージ（specific、許可されている）");

  console.log("許可されていないキーのロガー:");
  logger5.debug("DEBUGメッセージ（other、フィルタされるはず）");
  logger5.info("INFOメッセージ（other、フィルタされるはず）");

  console.log("\n=== テスト3: LOG_KEY=defaultに設定した場合 ===");
  Deno.env.set("LOG_KEY", "default");

  const logger6 = new BreakdownLogger(); // "default"キー
  const logger7 = new BreakdownLogger("test-key");

  console.log("デフォルトキーのロガー（許可されているはず）:");
  logger6.debug("DEBUGメッセージ（デフォルトキー、許可されている）");
  logger6.info("INFOメッセージ（デフォルトキー、許可されている）");

  console.log("他のキーのロガー（フィルタされるはず）:");
  logger7.debug("DEBUGメッセージ（test-key、フィルタされるはず）");
  logger7.info("INFOメッセージ（test-key、フィルタされるはず）");

  // 環境変数をクリア
  Deno.env.delete("LOG_KEY");
});
