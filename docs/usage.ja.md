# BreakdownLogger ユーザーガイド

> **関連ドキュメント**: [English Version](usage.md) | [仕様書](index.ja.md) |
> [用語集](glossary.ja.md)

BreakdownLoggerは、Deno/JSR向けのデバッグ用ログ出力ライブラリである。
テストコード（`*_test.ts`）でのみ動作し、環境変数で出力を制御する。
通常のアプリケーションコードからは何も出力しない。

## クイックスタート

### インストール

JSRからインポートする。

```typescript
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
```

### はじめてのログ出力

テストファイル内でロガーを生成し、ログを出力する。

```typescript
// example_test.ts
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";

Deno.test("はじめてのログ出力", () => {
  const logger = new BreakdownLogger("example");
  logger.debug("デバッグ情報を出力");
  logger.info("処理を開始しました");
});
```

実行コマンド:

```bash
LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read example_test.ts
```

## 基本的な使い方

### ログレベル

4段階のログレベルを持ち、重要度に応じて使い分ける。

| レベル | 用途                                   | 出力先         |
| ------ | -------------------------------------- | -------------- |
| DEBUG  | 詳細なデバッグ情報                     | 標準出力       |
| INFO   | 一般的な情報（デフォルト）             | 標準出力       |
| WARN   | 警告（警告的な分岐の中で使用）         | 標準出力       |
| ERROR  | エラー（エラーハンドリングの中で使用） | 標準エラー出力 |

`LOG_LEVEL`で指定したレベル以上のログのみが出力される。

- `LOG_LEVEL=debug` : DEBUG, INFO, WARN, ERROR の全てを出力
- `LOG_LEVEL=info` : INFO, WARN, ERROR を出力（デフォルト）
- `LOG_LEVEL=warn` : WARN, ERROR を出力
- `LOG_LEVEL=error` : ERROR のみ出力

### 出力場所KEY

出力場所KEYは、ロガーごとに付与する固有の識別子である。
コンストラクタの引数で指定する。

```typescript
const authLogger = new BreakdownLogger("auth");
const dbLogger = new BreakdownLogger("database");
```

KEYを付与することで、大量のログ出力の中から関心のある箇所だけをフィルタリングできる。
出力には常にKEYが含まれるため、問題の位置を特定しやすい。

### デフォルトKEY

KEYを指定しない場合、`"default"` が自動的に使用される。

```typescript
const logger = new BreakdownLogger(); // KEY は "default"
logger.info("汎用的なログメッセージ");
```

特定の機能に紐づかない一時的なログ出力に適している。

## 環境変数

### LOG_LEVEL

出力するログレベルの下限を制御する。

| 値      | 出力されるレベル                |
| ------- | ------------------------------- |
| `debug` | DEBUG, INFO, WARN, ERROR        |
| `info`  | INFO, WARN, ERROR               |
| `warn`  | WARN, ERROR                     |
| `error` | ERROR                           |
| 未指定  | INFO, WARN, ERROR（デフォルト） |

```bash
# DEBUGレベルで全ログを表示
LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read

# ERRORレベルのみ表示
LOG_LEVEL=error deno test --allow-env --allow-write --allow-read
```

### LOG_LENGTH

ログメッセージの最大文字数を制御する。制限を超えた場合、末尾が `...`
に置換される。

| 値          | 最大文字数 | 用途                            |
| ----------- | ---------- | ------------------------------- |
| 未指定      | 80文字     | CI/CDパイプライン、概要確認     |
| `S` (Short) | 160文字    | 一般的なデバッグ作業            |
| `L` (Long)  | 300文字    | APIリクエスト・レスポンスの確認 |
| `W` (Whole) | 無制限     | 完全なデータの検査              |

```bash
# デフォルト（80文字）で概要を確認
LOG_LEVEL=debug deno test --allow-env

# Short（160文字）で少し詳しく確認
LOG_LEVEL=debug LOG_LENGTH=S deno test --allow-env

# Whole（全文）で完全なデータを確認
LOG_LEVEL=debug LOG_LENGTH=W deno test --allow-env
```

### LOG_KEY

特定の出力場所KEYを持つログのみを表示する。
区切り文字はカンマ（`,`）、コロン（`:`）、スラッシュ（`/`）のいずれかを使用できる。

```bash
# 単一KEYの指定
LOG_KEY=auth deno test --allow-env

# 複数KEYの指定（カンマ区切り）
LOG_KEY=auth,database deno test --allow-env

# 複数KEYの指定（コロン区切り）
LOG_KEY=auth:database:api deno test --allow-env
```

`LOG_KEY`を指定しない場合、全てのKEYのログが出力される。

## 出力フォーマット

### 基本フォーマット

`data`引数なしで呼び出した場合の出力形式:

```
[LEVEL] [key] message
```

例:

```typescript
const logger = new BreakdownLogger("auth");
logger.info("ユーザー認証を開始");
```

出力:

```
[INFO] [auth] ユーザー認証を開始
```

### データ付きフォーマット

`data`引数ありで呼び出した場合、データとタイムスタンプが付与される:

```
[LEVEL] [key] message
Data: {...}
Timestamp: 2024-03-10T12:00:00.000Z
```

例:

```typescript
logger.debug("認証結果", { userId: 12345, status: "success" });
```

出力:

```
[DEBUG] [auth] 認証結果
Data: {
  "userId": 12345,
  "status": "success"
}
Timestamp: 2024-03-10T12:00:00.000Z
```

重要: タイムスタンプは `data` がある場合のみ出力される。`data`
なしの呼び出しではタイムスタンプは付与されない。

## 実践的なユースケース

### 段階的デバッグ

テスト失敗時の原因調査を、段階的に絞り込む手順を示す。

```bash
# ステップ1: まずエラーだけ確認して問題の概要を把握
LOG_LEVEL=error deno test --allow-env --allow-write --allow-read

# ステップ2: 警告も表示して問題の前兆を確認
LOG_LEVEL=warn deno test --allow-env --allow-write --allow-read

# ステップ3: 特定モジュールのDEBUGログをShortで確認
LOG_LEVEL=debug LOG_LENGTH=S LOG_KEY=auth,api deno test --allow-env --allow-write --allow-read

# ステップ4: 問題箇所を特定し、全文表示で詳細を確認
LOG_LEVEL=debug LOG_LENGTH=W LOG_KEY=auth deno test --allow-env --allow-write --allow-read
```

### 関数呼び出しの追跡

BreakdownLoggerのデバッグ推奨ポイントに沿った、関数の入出力を追跡する例:

```typescript
// user_service_test.ts
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";

const callLogger = new BreakdownLogger("user-call");
const implLogger = new BreakdownLogger("user-impl");

function fetchUserProfile(userId: number): { name: string; email: string } {
  // 引数の受け取り直後
  implLogger.debug("fetchUserProfile: 引数受け取り", { userId });

  const profile = { name: "Taro", email: "taro@example.com" };

  // 返り値の直前
  implLogger.debug("fetchUserProfile: 返り値", profile);
  return profile;
}

Deno.test("ユーザープロファイル取得の追跡", () => {
  const userId = 42;

  // 関数呼び出し前
  callLogger.debug("fetchUserProfile呼び出し前", { userId });

  const result = fetchUserProfile(userId);

  // 返り値の受け取り直後
  callLogger.debug("fetchUserProfile返り値受け取り", result);
});
```

実行:

```bash
# 呼び出し側のみ追跡
LOG_LEVEL=debug LOG_KEY=user-call deno test --allow-env --allow-write --allow-read

# 実装側のみ追跡
LOG_LEVEL=debug LOG_KEY=user-impl deno test --allow-env --allow-write --allow-read

# 両方を追跡
LOG_LEVEL=debug LOG_KEY=user-call,user-impl deno test --allow-env --allow-write --allow-read
```

### LOG_KEYによる問題の切り分け

複数のモジュールにまたがる処理で、KEYを分けて問題箇所を特定する例:

```typescript
// order_processing_test.ts
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";

Deno.test("注文処理フロー全体のデバッグ", () => {
  const authLogger = new BreakdownLogger("order-auth");
  const stockLogger = new BreakdownLogger("order-stock");
  const paymentLogger = new BreakdownLogger("order-payment");

  authLogger.debug("注文者の認証チェック開始");
  authLogger.debug("認証結果", { valid: true, userId: 100 });

  stockLogger.debug("在庫確認開始", { itemId: "ITEM-001", quantity: 2 });
  stockLogger.debug("在庫確認結果", { available: true, remaining: 15 });

  paymentLogger.debug("決済処理開始", { amount: 3000, method: "credit" });
  paymentLogger.warn("決済処理に通常より時間がかかっています");
  paymentLogger.debug("決済結果", { success: true, transactionId: "TX-9876" });
});
```

```bash
# 決済に問題がありそうな場合、決済ログのみ全文表示で確認
LOG_LEVEL=debug LOG_KEY=order-payment LOG_LENGTH=W deno test --allow-env --allow-write --allow-read

# 認証と決済の連携を確認
LOG_LEVEL=debug LOG_KEY=order-auth,order-payment deno test --allow-env --allow-write --allow-read
```

## ベストプラクティス

### KEYの命名規則

出力場所KEYは一意であることが重要である。以下の命名パターンを推奨する。

- **機能別**: `auth`, `api`, `database`, `cache`
- **レイヤー別**: `controller`, `service`, `repository`
- **処理フロー別**: `order-auth`, `order-stock`, `order-payment`

同じKEYを複数の異なる箇所で使わないこと。KEYが重複すると、`LOG_KEY`で絞り込んだ際に無関係なログが混在する。

### メッセージの書き方

メッセージは切り詰めが末尾から行われるため、重要な情報を先頭に置く。

```typescript
// 推奨: 重要な情報が先頭にある
logger.debug("認証失敗: パスワード不一致", { userId: 12345, attempt: 3 });

// 非推奨: 重要な情報が末尾にあり、切り詰め時に失われる
logger.debug("データを処理した結果、パスワード不一致により認証に失敗しました");
```

デフォルトの80文字以内でも意味が通るようにメッセージを構成すること。

### 環境変数の組み合わせ

`LOG_LEVEL`、`LOG_LENGTH`、`LOG_KEY`の3つを組み合わせることで、出力を効率的に制御できる。

```bash
# 概要把握: 全モジュール、エラーのみ、デフォルト長
LOG_LEVEL=error deno test --allow-env --allow-write --allow-read

# 範囲特定: 特定モジュール、DEBUG、Short
LOG_LEVEL=debug LOG_LENGTH=S LOG_KEY=auth,api deno test --allow-env --allow-write --allow-read

# 詳細調査: 単一モジュール、DEBUG、Whole
LOG_LEVEL=debug LOG_LENGTH=W LOG_KEY=auth deno test --allow-env --allow-write --allow-read
```

この「概要把握 -> 範囲特定 ->
詳細調査」の流れで、大量のログ出力があっても効率的に問題を特定できる。
