/**
 * デモンストレーション用ファイル
 * これは実際のテストファイルではなく、BreakdownLoggerの使用例を示すためのものです。
 * BreakdownLoggerはテストファイル内でのみ動作するため、_test.tsという名前になっています。
 */

import { BreakdownLogger } from "@tettuan/breakdownlogger";

/**
 * 高度な使用例のデモンストレーション
 *
 * このファイルは必ずテストファイルとして実行してください：
 * deno test --allow-env example/advanced_usage_test.ts
 */

// 異なるキーを持つ複数のロガーインスタンスを作成
const authLogger = new BreakdownLogger("auth");
const dbLogger = new BreakdownLogger("database");
const apiLogger = new BreakdownLogger("api");
const cacheLogger = new BreakdownLogger("cache");
const defaultLogger = new BreakdownLogger(); // デフォルトキー "default"

Deno.test("高度な機能のデモンストレーション", () => {
  console.log("\n=== BreakdownLogger 高度な使用例 ===\n");

  // 環境変数の設定を表示
  console.log("現在の環境変数設定:");
  console.log(
    `LOG_LEVEL: ${Deno.env.get("LOG_LEVEL") || "未設定 (デフォルト: info)"}`,
  );
  console.log(
    `LOG_LENGTH: ${
      Deno.env.get("LOG_LENGTH") || "未設定 (デフォルト: 30文字)"
    }`,
  );
  console.log(
    `LOG_KEY: ${Deno.env.get("LOG_KEY") || "未設定 (全てのキーを出力)"}`,
  );
  console.log("\n");

  // 1. 異なるキーでのログ出力
  console.log("--- 異なるキーでのログ出力 ---");
  authLogger.info("ユーザー認証を開始しました");
  authLogger.debug("認証トークンの検証中", {
    userId: 12345,
    token: "abc...xyz",
  });

  dbLogger.info("データベース接続を確立しました");
  dbLogger.debug("クエリ実行", {
    query: "SELECT * FROM users WHERE id = ?",
    params: [12345],
  });

  apiLogger.info("API呼び出しを受信しました");
  apiLogger.warn("レート制限に近づいています", {
    remaining: 10,
    resetAt: "2024-03-20T13:00:00Z",
  });
  apiLogger.error("外部APIでエラーが発生しました", {
    status: 503,
    message: "Service Unavailable",
    endpoint: "https://api.example.com/users",
  });

  cacheLogger.debug("キャッシュから取得", { key: "user:12345", hit: true });

  defaultLogger.info("デフォルトキーでのログメッセージ");

  // 2. 長いメッセージの切り詰めデモ
  console.log("\n--- 長いメッセージの切り詰めデモ ---");
  const longMessage =
    "これは非常に長いメッセージです。デフォルトでは30文字で切り詰められますが、LOG_LENGTH環境変数を設定することで制御できます。";
  const veryLongData = {
    description: "このオブジェクトには多くのデータが含まれています",
    items: Array.from({ length: 20 }, (_, i) => ({
      id: i,
      name: `アイテム${i}`,
      value: Math.random() * 100,
    })),
  };

  authLogger.info(longMessage);
  dbLogger.debug("大量のデータを取得しました", veryLongData);

  // 3. 異なるログレベルの出力
  console.log("\n--- 異なるログレベルの出力 ---");
  apiLogger.debug("詳細なデバッグ情報（LOG_LEVEL=debugの時のみ表示）");
  apiLogger.info("一般的な情報メッセージ（デフォルトで表示）");
  apiLogger.warn("警告メッセージ（LOG_LEVEL=warn以下で表示）");
  apiLogger.error("エラーメッセージ（常に表示）");

  // 4. 実際のユースケース例
  console.log("\n--- 実際のユースケース例 ---");

  // 関数の実行追跡
  function processUser(userId: number) {
    const logger = new BreakdownLogger("user-processor");

    logger.debug("processUser開始", { userId });

    try {
      // 処理をシミュレート
      logger.debug("ユーザーデータ取得中", { source: "database" });
      const userData = {
        id: userId,
        name: "テストユーザー",
        email: "test@example.com",
      };

      logger.debug("データ検証中");
      if (!userData.email) {
        logger.warn("メールアドレスが未設定です", { userId });
      }

      logger.debug("処理完了", { result: "success" });
      return userData;
    } catch (error) {
      logger.error("処理中にエラーが発生しました", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  processUser(12345);
});

// 実行例の説明
console.log("\n=== 実行例 ===");
console.log("1. 全てのログを表示（デバッグレベル、全文表示）:");
console.log(
  "   LOG_LEVEL=debug LOG_LENGTH=W deno test --allow-env example/advanced_usage_test.ts",
);
console.log("\n2. 特定のキーのみ表示:");
console.log(
  "   LOG_KEY=auth,api deno test --allow-env example/advanced_usage_test.ts",
);
console.log("\n3. エラーのみ表示:");
console.log(
  "   LOG_LEVEL=error deno test --allow-env example/advanced_usage_test.ts",
);
console.log("\n4. 組み合わせ例:");
console.log(
  "   LOG_LEVEL=debug LOG_LENGTH=S LOG_KEY=database,cache deno test --allow-env example/advanced_usage_test.ts",
);
