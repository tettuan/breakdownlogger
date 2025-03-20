import {
  assertEquals,
  assertMatch,
} from "https://deno.land/std@0.219.0/assert/mod.ts";
import { BreakdownLogger, LogLevel } from "../mod.ts";

/**
 * BreakdownLogger のテストスイート
 * 
 * 目的：
 * - ログ出力の階層的フィルタリングの検証
 * - 環境変数とコンフィグによる設定の検証
 * - エラー処理の検証
 * - 各ログレベルの出力フォーマットの検証
 * 
 * 成功定義：
 * 1. ログレベルに応じて適切にフィルタリングされること
 * 2. 環境変数とコンフィグが正しく反映されること
 * 3. 不正な入力に対して適切に処理されること
 * 4. ログ出力が仕様通りのフォーマットで行われること
 */

// テストユーティリティ：コンソール出力のキャプチャ
class ConsoleCapture {
  private originalLog: typeof console.log;
  public logs: string[];

  constructor() {
    this.originalLog = console.log;
    this.logs = [];
    console.log = (message: string) => {
      this.logs.push(message);
    };
  }

  restore() {
    console.log = this.originalLog;
  }

  clear() {
    this.logs = [];
  }
}

// グローバルなキャプチャインスタンス
const capture = new ConsoleCapture();

// テスト完了時のクリーンアップ
addEventListener("unload", () => {
  capture.restore();
});

Deno.test("BreakdownLogger", async (t) => {
  // 各テスト後にログをクリア
  const cleanup = () => {
    capture.clear();
    Deno.env.delete("LOG_LEVEL");
  };

  await t.step({
    name: "基本機能: デフォルトログレベル（INFO）の初期化",
    fn: () => {
      cleanup();
      const logger = new BreakdownLogger();

      logger.debug("This should not be logged");
      logger.info("This should be logged");

      assertEquals(capture.logs.length, 1);
      assertMatch(
        capture.logs[0],
        /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]\s\[INFO\]\sThis should be logged/,
      );
    },
  });

  await t.step({
    name: "環境変数: LOG_LEVEL=debug の設定",
    fn: () => {
      cleanup();
      Deno.env.set("LOG_LEVEL", "debug");
      const logger = new BreakdownLogger();

      logger.debug("Debug message");
      logger.info("Info message");

      assertEquals(capture.logs.length, 2);
      assertMatch(capture.logs[0], /\[DEBUG\]\sDebug message/);
      assertMatch(capture.logs[1], /\[INFO\]\sInfo message/);
    },
  });

  await t.step({
    name: "データ出力: 構造化データの正しいフォーマット",
    fn: () => {
      cleanup();
      const logger = new BreakdownLogger({ initialLevel: LogLevel.DEBUG });
      const testData = { key: "value", nested: { test: true } };
      
      logger.debug("Message with data", testData);

      assertEquals(capture.logs.length, 1);
      assertMatch(
        capture.logs[0],
        /\[DEBUG\]\sMessage with data\nデータ:\s{\n\s\s"key":\s"value",\n\s\s"nested":\s{\n\s\s\s\s"test":\strue\n\s\s}\n}/,
      );
    },
  });

  await t.step({
    name: "ログレベル階層: 上位レベルでの下位レベルのフィルタリング",
    fn: () => {
      cleanup();
      const logger = new BreakdownLogger({ initialLevel: LogLevel.WARN });

      logger.debug("Should not log");
      logger.info("Should not log");
      logger.warn("Should log");
      logger.error("Should log");

      assertEquals(capture.logs.length, 2);
      assertMatch(capture.logs[0], /\[WARN\]\sShould log/);
      assertMatch(capture.logs[1], /\[ERROR\]\sShould log/);
    },
  });

  await t.step({
    name: "異常系: 不正な環境変数値の処理",
    fn: () => {
      cleanup();
      Deno.env.set("LOG_LEVEL", "INVALID_LEVEL");
      const logger = new BreakdownLogger();

      logger.info("Should log with default INFO level");
      logger.debug("Should not log");

      assertEquals(capture.logs.length, 1);
      assertMatch(capture.logs[0], /\[INFO\]\sShould log with default INFO level/);
    },
  });

  await t.step({
    name: "異常系: 特殊文字を含むメッセージの処理",
    fn: () => {
      cleanup();
      const logger = new BreakdownLogger({ initialLevel: LogLevel.INFO });
      const specialMessage = "Special chars: \n\t\r\b\f";
      
      logger.info(specialMessage);

      assertEquals(capture.logs.length, 1);
      assertMatch(capture.logs[0], /\[INFO\]\sSpecial chars: \n\t\r\b\f/);
    },
  });

  await t.step({
    name: "異常系: 巨大なデータオブジェクトの処理",
    fn: () => {
      cleanup();
      const logger = new BreakdownLogger({ initialLevel: LogLevel.INFO });
      const largeData = Array(1000).fill({ test: "data" });
      
      logger.info("Large data object", largeData);

      assertEquals(capture.logs.length, 1);
      assertMatch(capture.logs[0], /\[INFO\]\sLarge data object\nデータ:/);
    },
  });

  await t.step({
    name: "動的設定: ログレベルの変更",
    fn: () => {
      cleanup();
      const logger = new BreakdownLogger();

      logger.debug("Should not log");
      logger.setLogLevel(LogLevel.DEBUG);
      logger.debug("Should log after level change");
      logger.setLogLevel(LogLevel.ERROR);
      logger.warn("Should not log after stricter level");
      logger.error("Should log with ERROR level");

      assertEquals(capture.logs.length, 2);
      assertMatch(capture.logs[0], /\[DEBUG\]\sShould log after level change/);
      assertMatch(capture.logs[1], /\[ERROR\]\sShould log with ERROR level/);
    },
  });
}); 