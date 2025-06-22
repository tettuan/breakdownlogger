import { BreakdownLogger } from "./mod.ts";
import { EnvironmentConfig } from "./src/environment_config.ts";

Deno.test("環境設定の詳細調査", () => {
  console.log("=== 環境設定インスタンスの状態確認 ===");

  // 明示的にLOG_KEYを設定
  Deno.env.set("LOG_KEY", "specific");

  // EnvironmentConfigインスタンスを作成
  const config = new EnvironmentConfig();

  console.log(`LOG_LEVEL環境変数: ${Deno.env.get("LOG_LEVEL") || "未設定"}`);
  console.log(`LOG_KEY環境変数: ${Deno.env.get("LOG_KEY") || "未設定"}`);
  console.log(`パースされたLogLevel: ${config.getLogLevel()}`);
  console.log(`パースされたLogKeys: [${config.getLogKeys().join(", ")}]`);
  console.log(`LogKeysの長さ: ${config.getLogKeys().length}`);

  // テスト用ロガーの作成
  const logger1 = new BreakdownLogger("default");
  const logger2 = new BreakdownLogger("specific");
  const logger3 = new BreakdownLogger("other");

  console.log("\n=== フィルタリングのテスト ===");
  console.log("defaultキー:");
  logger1.info("defaultキーのメッセージ");

  console.log("specificキー:");
  logger2.info("specificキーのメッセージ");

  console.log("otherキー:");
  logger3.info("otherキーのメッセージ");

  // 区切り文字のテスト
  console.log("\n=== 区切り文字のテスト ===");
  Deno.env.set("LOG_KEY", "key1,key2:key3/key4");
  const config2 = new EnvironmentConfig();
  console.log(`複数キー設定: ${Deno.env.get("LOG_KEY")}`);
  console.log(`パースされたキー: [${config2.getLogKeys().join(", ")}]`);

  const loggers = [
    new BreakdownLogger("key1"),
    new BreakdownLogger("key2"),
    new BreakdownLogger("key3"),
    new BreakdownLogger("key4"),
    new BreakdownLogger("key5"),
  ];

  loggers.forEach((logger, index) => {
    const keyName = `key${index + 1}`;
    console.log(`${keyName}:`);
    logger.info(`${keyName}のメッセージ`);
  });

  // 環境変数をクリア
  Deno.env.delete("LOG_KEY");
});
