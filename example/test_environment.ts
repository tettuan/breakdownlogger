/**
 * デモンストレーション用ファイル
 * これは実際のテストファイルではなく、BreakdownLoggerの使用例を示すためのものです。
 * ファイル名が_test.tsで終わっていないため、deno testコマンドで実行する必要があります。
 */

import { BreakdownLogger } from "../mod.ts";

/**
 * テスト環境での使用例
 *
 * このサンプルでは以下の機能をデモンストレーションします：
 * 1. 環境変数によるログレベルの設定
 * 2. テストケースでのログ出力
 * 3. エラーケースのログ出力
 */

// テストケースの実行をシミュレート
async function runTestSuite() {
  // テストコード用のロガーを初期化
  const logger = new BreakdownLogger();

  // テストケース1: 正常系
  logger.info("テストケース1: 正常系のテストを開始");
  try {
    const result = await simulateNormalOperation();
    logger.debug("処理結果", result);
    logger.info("テストケース1: 成功");
  } catch (error) {
    logger.error("テストケース1: 失敗", error);
  }

  // テストケース2: 異常系
  logger.info("テストケース2: 異常系のテストを開始");
  try {
    await simulateErrorOperation();
    logger.info("テストケース2: 成功");
  } catch (error) {
    logger.error("テストケース2: 失敗", error);
  }

  // テストケース3: パフォーマンステスト
  logger.info("テストケース3: パフォーマンステストを開始");
  const startTime = performance.now();
  await simulatePerformanceTest();
  const endTime = performance.now();
  logger.debug("パフォーマンス計測結果", {
    duration: `${endTime - startTime}ms`,
    timestamp: new Date().toISOString(),
  });
  logger.info("テストケース3: 完了");
}

// テスト用のモック関数
async function simulateNormalOperation() {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return { status: "success", data: "テストデータ" };
}

async function simulateErrorOperation() {
  await new Promise((resolve) => setTimeout(resolve, 100));
  throw new Error("意図的なエラー");
}

async function simulatePerformanceTest() {
  await new Promise((resolve) => setTimeout(resolve, 500));
}

// テストスイートの実行
console.log("=== テスト環境での使用例 ===");
console.log(
  "環境変数 LOG_LEVEL の設定:",
  Deno.env.get("LOG_LEVEL") || "未設定",
);
console.log("テストスイートを開始します...\n");

runTestSuite().catch((error) => {
  console.error("テストスイートの実行中にエラーが発生しました:", error);
});
