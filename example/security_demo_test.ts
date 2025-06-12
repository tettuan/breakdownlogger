/**
 * デモンストレーション用ファイル
 * これは実際のテストファイルではなく、BreakdownLoggerの使用例を示すためのものです。
 * BreakdownLoggerはテストファイル内でのみ動作するため、_test.tsという名前になっています。
 */

import { BreakdownLogger } from "../mod.ts";

/**
 * BreakdownLoggerのセキュリティ機能のデモンストレーション
 *
 * このファイルは、BreakdownLoggerがテストファイル内でのみ動作することを示します。
 * 通常のアプリケーションファイル（.ts）では動作しません。
 */

// テストファイル内ではDeno.test()の外側でもロガーが動作します
const outsideLogger = new BreakdownLogger("outside");

// 注意: 現在の実装では、テストファイル内であれば出力されます
console.log("\n=== テストファイル内でのDeno.test()外側での呼び出し ===");
outsideLogger.debug("テストファイル内なので出力されます - DEBUG");
outsideLogger.info("テストファイル内なので出力されます - INFO");
outsideLogger.warn("テストファイル内なので出力されます - WARN");
outsideLogger.error("テストファイル内なので出力されます - ERROR");
console.log("（上記のログは出力されています）\n");

// Deno.test()内部での動作確認
Deno.test("セキュリティ機能のデモ - Deno.test()内部", () => {
  console.log("=== Deno.test()内部での呼び出し ===");

  const insideLogger = new BreakdownLogger("inside");

  // これらは正常に出力されます
  insideLogger.info("Deno.test()内部では正常に動作します");
  insideLogger.debug("デバッグ情報も出力できます", { testId: 123 });
  insideLogger.warn("警告メッセージ");
  insideLogger.error("エラーメッセージ", { code: "TEST_ERROR" });

  // 外側で作成したロガーも、Deno.test()内部では動作します
  outsideLogger.info("外側で作成したロガーもDeno.test()内部では動作します");
});

// 別のテストケース
Deno.test("実際のユースケース例", () => {
  const logger = new BreakdownLogger("real-use-case");

  // テスト対象の関数
  function calculateSum(a: number, b: number): number {
    logger.debug("calculateSum呼び出し", { a, b });

    const result = a + b;
    logger.debug("計算結果", { result });

    return result;
  }

  // テスト実行
  logger.info("テスト開始");
  const sum = calculateSum(5, 3);
  logger.info("テスト完了", { expected: 8, actual: sum });
});

// 再度、テストファイル内でのDeno.test()外側で確認
console.log("\n=== 再度、テストファイル内でのDeno.test()外側での呼び出し ===");
const anotherLogger = new BreakdownLogger("another-outside");
anotherLogger.error("テストファイル内なので、これも出力されます");
console.log("（このログも出力されています）");

console.log("\n=== 説明 ===");
console.log("BreakdownLoggerは以下の仕組みで動作します：");
console.log("1. テストファイル（*_test.ts、*.test.ts）内でのみ動作");
console.log("2. 通常のアプリケーションファイルでは何も出力されない");
console.log("3. これによりメインコードでの誤った出力を防ぐ");
console.log("4. 本番環境での内部処理情報の漏洩を防ぐ");
console.log("5. デバッグ情報がテスト実行時のみに限定される");
