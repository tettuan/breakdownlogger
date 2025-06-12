import {
  assertEquals,
  assertMatch,
} from "https://deno.land/std@0.219.0/assert/mod.ts";
import { BreakdownLogger } from "../mod.ts";
import { EnvironmentConfig } from "../src/environment_config.ts";

// テストユーティリティ：コンソール出力のキャプチャ
class ConsoleCapture {
  private originalLog: typeof console.log;
  private originalError: typeof console.error;
  public logs: string[];
  public errors: string[];

  constructor() {
    this.originalLog = console.log;
    this.originalError = console.error;
    this.logs = [];
    this.errors = [];
    console.log = (message: string) => {
      this.logs.push(message);
    };
    console.error = (message: string) => {
      this.errors.push(message);
    };
  }

  restore() {
    console.log = this.originalLog;
    console.error = this.originalError;
  }

  clear() {
    this.logs = [];
    this.errors = [];
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
    Deno.env.delete("LOG_LENGTH");
    Deno.env.delete("LOG_KEY");
    // EnvironmentConfigのシングルトンをリセット
    EnvironmentConfig.reset();
  };

  await t.step({
    name: "基本機能: デフォルトログレベル（INFO）の初期化",
    fn: () => {
      cleanup();
      const logger = new BreakdownLogger("test-key");

      logger.debug("This should not be logged");
      logger.info("This should be logged");

      assertEquals(capture.logs.length, 1);
      // デフォルトでは30文字に切り詰められる
      assertEquals(capture.logs[0].length, 30);
      assertMatch(
        capture.logs[0],
        /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]\s\.\.\.$/,
      );
    },
  });

  await t.step({
    name: "環境変数: LOG_LEVEL=debug の設定",
    fn: () => {
      cleanup();
      Deno.env.set("LOG_LEVEL", "debug");
      Deno.env.set("LOG_LENGTH", "W"); // 完全な出力を取得
      const logger = new BreakdownLogger("test-key");

      logger.debug("Debug message");
      logger.info("Info message");

      assertEquals(capture.logs.length, 2);
      assertMatch(capture.logs[0], /\[DEBUG\]\s\[test-key\]\sDebug message/);
      assertMatch(capture.logs[1], /\[INFO\]\s\[test-key\]\sInfo message/);
    },
  });

  await t.step({
    name: "データ出力: 構造化データの正しいフォーマット",
    fn: () => {
      cleanup();
      Deno.env.set("LOG_LEVEL", "debug");
      Deno.env.set("LOG_LENGTH", "W"); // WHOLE
      const logger = new BreakdownLogger("test-key");
      const testData = { key: "value", nested: { test: true } };

      logger.debug("Message with data", testData);

      assertEquals(capture.logs.length, 1);
      assertMatch(
        capture.logs[0],
        /\[DEBUG\]\s\[test-key\]\sMessage with data\nData:\s{\n\s\s"key":\s"value",\n\s\s"nested":\s{\n\s\s\s\s"test":\strue\n\s\s}\n}/,
      );
    },
  });

  await t.step({
    name: "ログレベル階層: 上位レベルでの下位レベルのフィルタリング",
    fn: () => {
      cleanup();
      Deno.env.set("LOG_LEVEL", "warn");
      Deno.env.set("LOG_LENGTH", "W"); // 完全な出力を取得
      const logger = new BreakdownLogger("test-key");

      logger.debug("Should not log");
      logger.info("Should not log");
      logger.warn("Should log");
      logger.error("Should log");

      assertEquals(capture.logs.length, 1);
      assertEquals(capture.errors.length, 1);
      assertMatch(capture.logs[0], /\[WARN\]\s\[test-key\]\sShould log/);
      assertMatch(capture.errors[0], /\[ERROR\]\s\[test-key\]\sShould log/);
    },
  });

  await t.step({
    name: "環境変数: LOG_LENGTH=S の設定（100文字制限）",
    fn: () => {
      cleanup();
      Deno.env.set("LOG_LENGTH", "S");
      const logger = new BreakdownLogger("test-key");
      const longMessage = "a".repeat(150);

      logger.info(longMessage);

      assertEquals(capture.logs.length, 1);
      const output = capture.logs[0];
      // タイムスタンプ + レベル + キー + メッセージで100文字以内
      assertEquals(output.length, 100);
      assertMatch(output, /\.\.\.$/);
    },
  });

  await t.step({
    name: "環境変数: LOG_KEY フィルタリング（単一キー）",
    fn: () => {
      cleanup();
      Deno.env.set("LOG_KEY", "allowed-key");
      Deno.env.set("LOG_LENGTH", "W"); // 完全な出力を取得
      const logger1 = new BreakdownLogger("allowed-key");
      const logger2 = new BreakdownLogger("not-allowed");

      logger1.info("This should be logged");
      logger2.info("This should NOT be logged");

      assertEquals(capture.logs.length, 1);
      assertMatch(capture.logs[0], /\[allowed-key\]\sThis should be logged/);
    },
  });

  await t.step({
    name: "環境変数: LOG_KEY フィルタリング（複数キー）",
    fn: () => {
      cleanup();
      Deno.env.set("LOG_KEY", "key1,key2:key3/key4");
      Deno.env.set("LOG_LENGTH", "W"); // 完全な出力を取得
      const logger1 = new BreakdownLogger("key1");
      const logger2 = new BreakdownLogger("key3");
      const logger3 = new BreakdownLogger("key5");

      logger1.info("From key1");
      logger2.info("From key3");
      logger3.info("Should not log");

      assertEquals(capture.logs.length, 2);
      assertMatch(capture.logs[0], /\[key1\]\sFrom key1/);
      assertMatch(capture.logs[1], /\[key3\]\sFrom key3/);
    },
  });

  await t.step({
    name: "デフォルトキー: 引数なしでBreakdownLoggerを作成",
    fn: () => {
      cleanup();
      Deno.env.set("LOG_LENGTH", "W"); // 完全な出力を取得
      const logger = new BreakdownLogger();

      logger.info("Message with default key");

      assertEquals(capture.logs.length, 1);
      assertMatch(capture.logs[0], /\[default\]\sMessage with default key/);
    },
  });

  await t.step({
    name: "異常系: 不正な環境変数値の処理",
    fn: () => {
      cleanup();
      Deno.env.set("LOG_LEVEL", "INVALID_LEVEL");
      Deno.env.set("LOG_LENGTH", "INVALID");
      const logger = new BreakdownLogger("test-key");

      logger.info("Should log with default settings");
      logger.debug("Should not log");

      assertEquals(capture.logs.length, 1);
      // デフォルト長さ（30文字）で切り詰められる
      assertEquals(capture.logs[0].length, 30);
      assertMatch(capture.logs[0], /\.\.\.$/);
    },
  });

  await t.step({
    name: "エラーレベル: console.errorへの出力",
    fn: () => {
      cleanup();
      Deno.env.set("LOG_LENGTH", "W"); // 完全な出力を取得
      const logger = new BreakdownLogger("error-test");

      logger.error("This is an error", { code: "ERR001" });

      assertEquals(capture.errors.length, 1);
      assertMatch(
        capture.errors[0],
        /\[ERROR\]\s\[error-test\]\sThis is an error/,
      );
    },
  });
});
