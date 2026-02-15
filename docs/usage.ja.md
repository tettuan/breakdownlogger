# BreakdownLogger 戦略的デバッグガイド

> **関連ドキュメント**: [English Version](usage.md) | [仕様書](index.ja.md) |
> [用語集](glossary.ja.md)

## 1. 設計思想

BreakdownLoggerは、テスト開発中に「コード内部で何が起きているか」を環境変数制御のデバッグ出力で答えるライブラリである。

3つの設計原則:

- **テスト専用**:
  テストファイル（`*_test.ts`、`*.test.ts`）からの呼び出し時のみ出力する。コンストラクタ時のスタックトレース検査で強制される。
- **環境変数制御**:
  全設定は`LOG_LEVEL`、`LOG_LENGTH`、`LOG_KEY`で行うため、コード変更なしに出力を調整できる。
- **ゼロオーバーヘッド**:
  テストコンテキスト外では全メソッドが即座にリターンし、アプリケーションコード内の条件分岐は不要。

### 3つの制御軸

| 制御軸      | 環境変数     | 制御対象               | 値                               |
| ----------- | ------------ | ---------------------- | -------------------------------- |
| ログレベル  | `LOG_LEVEL`  | 重要度フィルタ         | `debug`, `info`, `warn`, `error` |
| ログ出力長  | `LOG_LENGTH` | 切り詰め制限           | （未指定）, `S`, `L`, `W`        |
| 出力場所KEY | `LOG_KEY`    | コンポーネントフィルタ | カンマ/コロン/スラッシュ区切り   |

ログレベルは「どの重要度」、ログ出力長は「どこまで」、出力場所KEYは「どのコンポーネント」を表示するかを決め、組み合わせによりソースコード無変更でスイート概要から単一モジュールの完全ダンプまで切り替えられる。

## 2. クイックスタート

```typescript
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";

// example_test.ts
Deno.test("my first logged test", () => {
  const logger = new BreakdownLogger("example");
  logger.info("Test is running");
  logger.debug("Detailed state", { step: 1, status: "ok" });
});
```

```bash
LOG_LEVEL=debug deno test --allow-env --allow-read --allow-write example_test.ts
```

## 3. 設定リファレンス

### コンストラクタ

```typescript
new BreakdownLogger(key?: string)
```

`key`はインスタンス識別・出力ラベル・`LOG_KEY`フィルタ対象として使用される。省略時は`"default"`。環境変数はコンストラクタ時にキャッシュされる。

**メソッド:** `debug`, `info`, `warn`, `error` --
全て`(message: string, data?: unknown): void`のシグネチャ。

### LOG_LEVEL

| 値      | 出力されるレベル         | 用途                                 |
| ------- | ------------------------ | ------------------------------------ |
| `debug` | DEBUG, INFO, WARN, ERROR | 調査中の詳細なトレース               |
| `info`  | INFO, WARN, ERROR        | デフォルト; 一般的な進捗と問題の確認 |
| `warn`  | WARN, ERROR              | 疑わしい状態への集中                 |
| `error` | ERROR のみ               | 最小限のノイズで障害を特定           |

デフォルト:
`info`。DEBUG/INFO/WARNは**stdout**（`console.log`）、ERRORは**stderr**（`console.error`）に出力されるため、`2>error.log`で分離できる。

### LOG_LENGTH

| 値         | 最大文字数 | 使用場面                     |
| ---------- | ---------- | ---------------------------- |
| （未指定） | 80         | CI、クイックスキャン、高頻度 |
| `S`        | 160        | 一般的なデバッグ             |
| `L`        | 300        | APIペイロード、複雑な状態    |
| `W`        | 無制限     | 完全ダンプ、根本原因分析     |

切り詰め時は`...`を付加（3文字は制限にカウント）し、Data行・Timestamp行を含むフォーマット済み出力全体に適用される。

### LOG_KEY

指定値のいずれかに完全一致するKEYのロガーのみ出力する。`LOG_KEY=auth`は`auth-module`にマッチしない。未設定時は全KEY表示。

```bash
LOG_KEY=auth,database deno test --allow-env
```

### FORCE_TEST_MODE

`FORCE_TEST_MODE=true`でテストコンテキスト検出をバイパスする。テストファイル外でのロガーデバッグ、非標準テスト環境、REPL用。本番環境では使用しないこと。

### 出力フォーマット

dataなし: `[LEVEL] [key] message` dataあり:

```
[LEVEL] [key] message
Data: { "field": "value" }
Timestamp: 2025-01-15T09:30:00.000Z
```

Timestampは`data`提供時のみ出力。データは`JSON.stringify(data, null, 2)`で整形。循環参照時は`[Object: toString()]`にフォールバック。フォーマット済み文字列全体が`LOG_LENGTH`切り詰め対象。

## 4. 戦略的デバッグワークフロー

出力の洪水を避けつつ根本原因に到達するため、「広く→狭く→深く」の3フェーズで進める。

**フェーズ1 -- 概要把握**: エラーのみで障害箇所を特定する。

```bash
LOG_LEVEL=error deno test --allow-env
```

**フェーズ2 -- 範囲特定**: 疑わしいコンポーネントに絞り込む。

```bash
LOG_LEVEL=debug LOG_KEY=payment LOG_LENGTH=S deno test --allow-env
```

**フェーズ3 -- 詳細調査**:
単一テストファイルで切り詰めなしの完全データを確認する。

```bash
LOG_LEVEL=debug LOG_KEY=payment LOG_LENGTH=W deno test --allow-env tests/payment_test.ts
```

### 判断ガイド

| 症状                        | 対処                                       |
| --------------------------- | ------------------------------------------ |
| 出力が多すぎる              | `LOG_KEY`で1コンポーネントにフィルタリング |
| メッセージ切り詰め（`...`） | `LOG_LENGTH`引き上げ: `S` → `L` → `W`      |
| もっと詳細が必要            | ログ呼び出しに`data`パラメータを追加       |
| 1テストファイルだけにエラー | `deno test`の後にファイルパスを指定        |

## 5. ログの配置

診断価値を最大化するため、データ変換・転送の境界にロガーを配置する:

1. **引数受け取り直後** -- 関数が実際に受け取ったものを確認する
2. **返り値の直前** -- スコープを離れる前の最終結果をキャプチャする
3. **外部呼び出しの前後** -- 依存先（DB、API、ファイルシステム）との境界を挟む
4. **エラーハンドラ内部** --
   キャッチ時点のエラーオブジェクトとコンテキストをキャプチャする

```typescript
async function processOrder(order: Order): Promise<Receipt> {
  const logger = new BreakdownLogger("order");
  logger.debug("processOrder called", order); // 1
  logger.debug("Calling paymentGateway.charge", { orderId: order.id }); // 3
  try {
    const charge = await paymentGateway.charge(order);
    logger.debug("paymentGateway.charge returned", charge); // 3
  } catch (err) {
    logger.error("paymentGateway.charge failed", {
      orderId: order.id,
      error: err,
    }); // 4
    throw err;
  }
  logger.debug("processOrder returning", receipt); // 2
  return receipt;
}
```

切り詰めは末尾から行われるため、重要な情報を先頭に配置する。`message`は「何が起きたか」、`data`は構造化詳細に使う。循環参照を含むオブジェクトは関連フィールドを抽出してから渡すこと。

## 6. 運用ルール

### KEY命名

効果的な`LOG_KEY`フィルタリングのため、プロジェクト内で一貫した方式を選択する:

| 方式         | KEYの例                                      | 最適な場面                   |
| ------------ | -------------------------------------------- | ---------------------------- |
| 機能別       | `auth`, `payment`, `notification`            | ユーザー向け機能デバッグ     |
| レイヤー別   | `controller`, `service`, `repository`        | アーキテクチャフローデバッグ |
| 処理フロー別 | `order-auth`, `order-stock`, `order-payment` | サブシステム横断追跡         |

KEYは論理コンポーネントごとに一意に保つ。大規模プロジェクトではプレフィックスで名前空間を作る（`auth-token`,
`auth-session`）。

### 一時的な調査

恒久的KEYと衝突しない一意タグ（例: `fix-423`）を使い、調査完了後に削除する。

```bash
LOG_LEVEL=debug LOG_KEY=fix-423 deno test --allow-env
```

### CI連携

CIデフォルトは`LOG_LEVEL=error`で最小ノイズにし、障害調査時のみ`LOG_LEVEL=debug LOG_LENGTH=L`に拡張する。ERROR/stderr分離によりCIシステムで障害が自然に強調される。

## 7. 実行パターン

```bash
# 単一テストファイル
LOG_LEVEL=debug deno test --allow-env --allow-read --allow-write tests/auth_test.ts

# テストスイート全体
LOG_LEVEL=debug deno test --allow-env --allow-read --allow-write

# KEYフィルタリング
LOG_LEVEL=debug LOG_KEY=auth,database deno test --allow-env --allow-read --allow-write

# CIエラーのみ
LOG_LEVEL=error deno test --allow-env --allow-read --allow-write

# 段階的絞り込み（順に実行）
LOG_LEVEL=error deno test --allow-env --allow-read --allow-write
LOG_LEVEL=warn deno test --allow-env --allow-read --allow-write
LOG_LEVEL=debug LOG_KEY=payment LOG_LENGTH=S deno test --allow-env --allow-read --allow-write
LOG_LEVEL=debug LOG_KEY=payment LOG_LENGTH=L deno test --allow-env --allow-read --allow-write
LOG_LEVEL=debug LOG_KEY=payment LOG_LENGTH=W deno test --allow-env --allow-read --allow-write tests/payment_test.ts
```

## 8. 出力の把握

### ストリームルーティング

| ログレベル | ストリーム | 関数            |
| ---------- | ---------- | --------------- |
| DEBUG      | stdout     | `console.log`   |
| INFO       | stdout     | `console.log`   |
| WARN       | stdout     | `console.log`   |
| ERROR      | stderr     | `console.error` |

BreakdownLoggerはファイル書き込みを行わない。シェルリダイレクトで取得する:
全出力は`2>&1 | tee debug.log`、エラー分離は`> stdout.log 2> stderr.log`。

### 切り詰めティア

`...`が表示されたら`LOG_LENGTH`を1段階引き上げる: （未指定）80 → `S` 160 → `L`
300 → `W` 無制限。

タイムスタンプ（ISO
8601）は`data`提供時のみ出力され、トレースメッセージをコンパクトに保つ。

## 9. 実践的なユースケース

### 関数呼び出しの追跡

呼び出し側と実装側で異なるKEYを使い、境界を越えたデータ流れを追跡する:

```typescript
const callerLog = new BreakdownLogger("order-caller");
const serviceLog = new BreakdownLogger("order-service");
```

```bash
LOG_LEVEL=debug LOG_KEY=order-caller,order-service deno test --allow-env --allow-read --allow-write
```

### 複数モジュールの切り分け

各サブシステムに固有のロガーを割り当て、`LOG_KEY`でフィルタリングする:

```typescript
const authLog = new BreakdownLogger("auth");
const dbLog = new BreakdownLogger("database");
const cacheLog = new BreakdownLogger("cache");
```

```bash
LOG_LEVEL=debug LOG_KEY=database deno test --allow-env --allow-read --allow-write integration_test.ts
```

### 動的KEYによるリクエスト追跡

リクエストごとに一意KEY（`prefix-uuid`）を生成し、並行実行中の特定の1つを追跡する。`LOG_LEVEL=info`でKEYを発見し、`LOG_KEY=req-<id> LOG_LENGTH=W`で再実行して詳細を確認する。

## 10. Claude Code スキル

docs CLIで2つのClaude Codeスキルを利用プロジェクトにエクスポートする:

```bash
deno run -A jsr:@tettuan/breakdownlogger/docs
```

| スキル                              | ファイル                                                    | 用途                                    |
| ----------------------------------- | ----------------------------------------------------------- | --------------------------------------- |
| `breakdownlogger-implement-logger`  | `.claude/skills/breakdownlogger-implement-logger/SKILL.md`  | KEY命名、境界配置、バリデーション       |
| `breakdownlogger-debug-with-logger` | `.claude/skills/breakdownlogger-debug-with-logger/SKILL.md` | LOG_LEVEL/KEY/LENGTHの3フェーズデバッグ |

エクスポート後、Claude
Codeセッションで`/breakdownlogger-implement-logger`と`/breakdownlogger-debug-with-logger`として利用可能。

## 11. 本番コードでの使用検知

validateツールは非テストファイルの`@tettuan/breakdownlogger`インポート（静的・動的・サブパス・再エクスポート）をスキャンし、本番コードに残った不要インポートを検知する。

```bash
deno run --allow-read jsr:@tettuan/breakdownlogger/validate ./src
```

違反時は終了コード1、クリーン時は0。ラッパーファイルもルートパッケージからインポートするため、import連鎖の根元で必ず検知される。テスト通過後のCIパイプラインに追加する。
