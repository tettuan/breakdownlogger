import { BreakdownLogger } from "../mod.ts";

/**
 * 基本的な使用例
 *
 * このサンプルでは以下の機能をデモンストレーションします：
 * 1. デフォルトのログレベル（INFO）での動作
 * 2. 環境変数によるログレベルの設定方法の説明
 * 3. 構造化データの出力
 * 4. 異なるロガーインスタンスの使用
 */

// デフォルトのログレベル（INFO）でロガーを初期化
const logger = new BreakdownLogger();

// 基本機能のデモ
console.log("\n=== 基本機能のデモ ===");
logger.debug("このメッセージは出力されません（DEBUG < INFO）");
logger.info("このメッセージは出力されます");
logger.warn("このメッセージは出力されます");
logger.error("このメッセージは出力されます");

// 構造化データの出力
console.log("\n=== 構造化データの出力 ===");
const userData = {
  id: 123,
  name: "テストユーザー",
  preferences: {
    theme: "dark",
    notifications: true,
  },
};
logger.info("ユーザー情報", userData);

// 環境変数によるログレベル制御のデモ
console.log("\n=== 環境変数によるログレベル制御 ===");
console.log("現在のログレベル: INFO（デフォルト）");
console.log("ログレベルを変更するには、環境変数 LOG_LEVEL を設定してください");
console.log("例: LOG_LEVEL=debug deno run --allow-env example/basic_usage.ts");

// 異なるロガーインスタンスの作成
console.log("\n=== 異なるロガーインスタンス ===");
const apiLogger = new BreakdownLogger("api");
const dbLogger = new BreakdownLogger("database");

apiLogger.info("APIリクエストを受信しました", { endpoint: "/users/123" });
dbLogger.info("データベースクエリを実行しました", {
  query: "SELECT * FROM users WHERE id = 123",
});
