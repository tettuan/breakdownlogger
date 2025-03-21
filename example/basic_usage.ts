import { BreakdownLogger, LogLevel } from "../mod.ts";

/**
 * 基本的な使用例
 *
 * このサンプルでは以下の機能をデモンストレーションします：
 * 1. デフォルトのログレベル（INFO）での動作
 * 2. 環境変数によるログレベルの設定
 * 3. 構造化データの出力
 * 4. ログレベルの動的変更
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

// ログレベルの動的変更
console.log("\n=== ログレベルの動的変更 ===");
logger.setLogLevel(LogLevel.DEBUG);
logger.debug("DEBUGレベルに変更したので、このメッセージは出力されます");
logger.info("このメッセージも出力されます");
logger.warn("このメッセージも出力されます");
logger.error("このメッセージも出力されます");

// より厳格なログレベルに変更
console.log("\n=== より厳格なログレベル ===");
logger.setLogLevel(LogLevel.ERROR);
logger.debug("このメッセージは出力されません");
logger.info("このメッセージは出力されません");
logger.warn("このメッセージは出力されません");
logger.error("このメッセージのみ出力されます");
