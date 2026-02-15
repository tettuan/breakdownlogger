# BreakdownLogger 戦略的デバッグガイド

> **関連ドキュメント**: [English Version](usage.md) | [仕様書](index.ja.md) |
> [用語集](glossary.ja.md)

## 1. はじめに：設計思想

BreakdownLoggerは、Denoテスト環境向けのデバッグ用ログ出力ライブラリである。テスト開発中に「自分のコードの内部で今何が起きているのか」という問いに答えるために存在する。

ライブラリの全ての設計判断は、3つの設計原則に基づいている。

- **テスト専用**:
  テストファイル（`*_test.ts`、`*.test.ts`）から呼び出された場合にのみ出力する。本番コード内でロガーをインスタンス化しても、何も出力されない。これはコンストラクタ時のスタックトレース検査により強制される。
- **環境変数制御**:
  全ての設定は環境変数（`LOG_LEVEL`、`LOG_LENGTH`、`LOG_KEY`）で行う。出力の詳細度やフォーカスの調整にコード変更は一切不要であり、実行コマンドを変えるだけでよい。
- **ゼロオーバーヘッド**:
  テストコンテキスト外であることをロガーが検出した場合、全てのメソッド呼び出しは即座にリターンする。アプリケーションコード内に条件分岐を書く必要はなく、ロガーが内部で処理する。

### 3つの制御軸

BreakdownLoggerは、精密な出力制御のために相互に独立した3つの制御軸を提供する。

| 制御軸      | 環境変数     | 制御対象               | 値                               |
| ----------- | ------------ | ---------------------- | -------------------------------- |
| ログレベル  | `LOG_LEVEL`  | 重要度フィルタ         | `debug`, `info`, `warn`, `error` |
| ログ出力長  | `LOG_LENGTH` | 切り詰め制限           | （未指定）, `S`, `L`, `W`        |
| 出力場所KEY | `LOG_KEY`    | コンポーネントフィルタ | カンマ/コロン/スラッシュ区切り   |

ログレベルは「どの重要度」を表示するかを決める。ログ出力長は各メッセージを「どこまで」表示するかを決める。出力場所KEYは「どのコンポーネント」を表示するかを決める。これら3つを組み合わせることで、テストスイート全体の概要把握から単一モジュールの完全なデータダンプまで、ソースコードに一切触れることなく切り替えられる。

## 2. クイックスタート

### インストール

DenoプロジェクトでJSRからインポートする。

```typescript
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
```

### はじめてのログ出力

テストファイルを作成する（ファイル名は `_test.ts` または `.test.ts`
で終わる必要がある）。

```typescript
// example_test.ts
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";

Deno.test("my first logged test", () => {
  const logger = new BreakdownLogger("example");
  logger.info("Test is running");
  logger.debug("Detailed state", { step: 1, status: "ok" });
});
```

デバッグ出力を有効にして実行する。

```bash
LOG_LEVEL=debug deno test --allow-env --allow-read --allow-write example_test.ts
```

`LOG_LEVEL` が設定されている場合にのみ出力が表示される。デフォルトのログレベルは
`info` であり、`debug` メッセージはその閾値以下であるためである。

## 3. 設定リファレンス

### コンストラクタ

```typescript
new BreakdownLogger(key?: string)
```

- `key` --
  このロガーインスタンスを識別する文字列。出力場所ラベルとして使用され、`LOG_KEY`
  によるフィルタリング対象となる。省略時は `"default"` が使用される。

各ロガーはコンストラクタ時に環境変数を読み取り、値をキャッシュする。同一テスト実行内で異なる設定が必要な場合は、変数を途中で変更するのではなく、異なるKEYを使用して対応する。

**メソッド:**

- `debug(message: string, data?: unknown): void` -- DEBUGレベルでログ出力
- `info(message: string, data?: unknown): void` -- INFOレベルでログ出力
- `warn(message: string, data?: unknown): void` -- WARNレベルでログ出力
- `error(message: string, data?: unknown): void` -- ERRORレベルでログ出力

4つのメソッドは全て同じシグネチャを共有する。`data`
パラメータはオプションであり、その有無によって出力フォーマットが変わる（後述の出力フォーマットを参照）。

### LOG_LEVEL

最低重要度の閾値を制御する。閾値以下のメッセージは無視される。

| 値      | 出力されるレベル         | 用途                                 |
| ------- | ------------------------ | ------------------------------------ |
| `debug` | DEBUG, INFO, WARN, ERROR | 調査中の詳細なトレース               |
| `info`  | INFO, WARN, ERROR        | デフォルト; 一般的な進捗と問題の確認 |
| `warn`  | WARN, ERROR              | 疑わしい状態への集中                 |
| `error` | ERROR のみ               | 最小限のノイズで障害を特定           |

**デフォルト**: `info`（`LOG_LEVEL` が未設定または認識できない値の場合）。

**出力先:**

- DEBUG, INFO, WARN は `console.log` 経由で**標準出力**へ
- ERROR は `console.error` 経由で**標準エラー出力**へ

この分離はシェルリダイレクトやCI環境でのログキャプチャにおいて重要である。エラーはstderrストリームに出力されるため、`2>error.log`
で分離できる。

### LOG_LENGTH

メッセージ行、Data行、Timestamp行を含むフォーマット済み出力全体の切り詰めを制御する。

| 値         | 最大文字数 | 使用場面                                             |
| ---------- | ---------- | ---------------------------------------------------- |
| （未指定） | 80         | CIパイプライン、クイックスキャン、高頻度出力ポイント |
| `S`        | 160        | 一般的なデバッグセッション                           |
| `L`        | 300        | APIペイロード、複雑な状態オブジェクト                |
| `W`        | 無制限     | 完全なオブジェクトダンプ、深い根本原因分析           |

メッセージが制限を超えた場合、末尾が切断され `...` が付加される。`...`
の3文字は制限にカウントされる（つまり制限80の場合、77文字のコンテンツに `...`
が付加される）。

切り詰めはフォーマット済み出力全体に適用される。メッセージとデータを含むログの場合、Data行とTimestamp行も切り詰め対象の文字列に含まれる。短い制限ではデータが途中で切れたり完全に非表示になることがあるが、これは設計上の意図であり、データを検査する必要があるときにのみログ出力長を引き上げることを促すためである。

### LOG_KEY

指定された値のいずれかにKEYが一致するロガーのみに出力をフィルタリングする。カンマ（`,`）、コロン（`:`）、スラッシュ（`/`）のいずれかの区切り文字で、1つ以上のKEYを指定できる。

```bash
LOG_KEY=auth deno test --allow-env
LOG_KEY=auth,database deno test --allow-env
LOG_KEY=auth:database deno test --allow-env
LOG_KEY=auth/database deno test --allow-env
```

**`LOG_KEY` 未設定時**: 全てのKEYが表示される（フィルタリングなし）。

マッチングは完全一致である。`LOG_KEY=auth` はKEYが `auth-module`
のロガーにはマッチしない。KEY名はこれを考慮して計画すること。

### FORCE_TEST_MODE

```bash
FORCE_TEST_MODE=true deno run --allow-env your_script.ts
```

`"true"`
に設定すると、テストコンテキスト検出をバイパスする。ロガーは通常、テストファイル内で実行されていることをコールスタックの検査で確認するが、この変数はそのチェックを上書きする。

用途:

- `_test.ts` ファイル外でロガー自体をデバッグする場合
- スタックパターンが異なる非標準テスト環境での実行
- REPLやスクラッチスクリプトでの簡易確認

この変数は開発用のエスケープハッチである。本番環境では設定しないこと。

### 出力フォーマット

**dataなしの場合:**

```
[LEVEL] [key] message
```

例:

```
[INFO] [auth] User login succeeded
```

**dataありの場合:**

```
[LEVEL] [key] message
Data: {
  "field": "value"
}
Timestamp: 2025-01-15T09:30:00.000Z
```

詳細:

- Timestamp行は `data`
  が提供された場合に**のみ**出力される。dataなしのメッセージにはタイムスタンプは付与されない。
- データは `JSON.stringify(data, null, 2)` で整形される（2スペースインデント）。
- `JSON.stringify` が失敗した場合（通常は循環参照が原因）、出力は
  `[Object: toString()]` にフォールバックされる。
- ヘッダー行、Data行、Timestamp行を含むフォーマット済み文字列全体が、`LOG_LENGTH`
  による切り詰めの対象となる。

## 4. 戦略的デバッグワークフロー

デバッグは「広く→狭く→深く」と進めるのが最も効率的である。この3フェーズアプローチにより、出力の洪水に溺れることなく根本原因に到達できる。

### フェーズ1: 概要把握

**目的**: どのテストが失敗し、障害がどこに集中しているかを特定する。

```bash
LOG_LEVEL=error deno test --allow-env
```

このログレベルではエラーのみが表示される。テストがパスしてもエラーを出力していれば、それが調査の出発点となる。何も表示されなければ
`warn` に広げる。

```bash
LOG_LEVEL=warn deno test --allow-env
```

警告は、障害に先行する状態を明らかにすることが多い。

### フェーズ2: 範囲特定

**目的**: 障害が発生している特定のコンポーネントに集中する。

```bash
LOG_LEVEL=debug LOG_KEY=payment LOG_LENGTH=S deno test --allow-env
```

疑わしいモジュールにフィルタリングするために `LOG_KEY`
を追加する。出力量を抑えつつ十分なコンテキストを得るために `LOG_LENGTH=S`
を使用する。この時点で、テストを通じた単一コンポーネントの処理フローを読み取る。

### フェーズ3: 詳細調査

**目的**: 根本原因を明らかにする完全なデータを確認する。

```bash
LOG_LEVEL=debug LOG_KEY=payment LOG_LENGTH=W deno test --allow-env tests/payment_test.ts
```

切り詰めを解除（`W`）し、単一のテストファイルに絞る。これで全てのデータオブジェクトが完全な形で表示される。根本原因は通常、データの中に見つかる。

### 判断ガイド

| 状況                                    | 対処                                                    |
| --------------------------------------- | ------------------------------------------------------- |
| どのログレベルから始めるべきか？        | `error` -- 常に広く始める                               |
| 出力が多すぎる？                        | `LOG_KEY` を追加して1つのコンポーネントにフィルタリング |
| メッセージが切り詰められている？        | `LOG_LENGTH` を引き上げる（`S` → `L` → `W`）            |
| もっと詳細が必要？                      | ログ呼び出しに `data` パラメータを追加する              |
| 1つのテストファイルだけにエラーがある？ | `deno test` の後にファイルパスを指定する                |

## 5. 記載ルール

### ログの配置場所

データが変換または転送される境界にロガーを配置する。仕様書では以下をデバッグ推奨ポイントとして定義している。

1. **関数の引数受け取り直後** --
   呼び出し元が送ろうとしたものではなく、関数が実際に受け取ったものを確認する。
2. **返り値の直前** --
   スコープを離れる前の、関数の最終的な結果をキャプチャする。
3. **外部呼び出しの前後** --
   コードが依存先（データベース、API、ファイルシステム）に処理を引き渡す境界を挟む。入力が正しく見え、出力がおかしければ、問題は依存先にある。
4. **エラーハンドラ内部** --
   障害がキャッチされた時点で、エラーオブジェクトとその周囲のコンテキストをキャプチャする。

```typescript
async function processOrder(order: Order): Promise<Receipt> {
  const logger = new BreakdownLogger("order");

  // 1. After receiving arguments
  logger.debug("processOrder called", order);

  // 3. Before external call
  logger.debug("Calling paymentGateway.charge", {
    orderId: order.id,
    amount: order.total,
  });
  try {
    const charge = await paymentGateway.charge(order);
    // 3. After external call
    logger.debug("paymentGateway.charge returned", charge);
  } catch (err) {
    // 4. Inside error handler
    logger.error("paymentGateway.charge failed", {
      orderId: order.id,
      error: err,
    });
    throw err;
  }

  const receipt = buildReceipt(order, charge);

  // 2. Before returning
  logger.debug("processOrder returning", receipt);
  return receipt;
}
```

### メッセージの内容

メッセージ切り詰めは末尾から行われる。重要な情報を先頭に配置すること。

```typescript
// 良い例 -- 障害の理由が最初に読める
logger.debug("Timeout: DB connection exceeded 30s", { host: "db.prod" });

// 切り詰め時に有用性が低い -- 重要な詳細が末尾に埋もれている
logger.debug(
  "Attempting to establish a database connection which timed out after 30s",
);
```

メッセージは短く事実に基づいたものにする。検査が必要な構造化データには `data`
パラメータを使用する。

```typescript
// メッセージは「何が起きたか」を、dataは「詳細」を持つ
logger.debug("Query failed", {
  query: "SELECT * FROM orders WHERE status = ?",
  params: ["pending"],
  error: err.message,
  duration: 4500,
});
```

### 循環参照

`data` 引数に循環参照が含まれている場合、`JSON.stringify` が失敗し、出力は
`[Object: toString()]`
となる。これは通常、有用ではない。循環参照を含むオブジェクトを直接 `data`
に渡すことは避け、必要なフィールドをプレーンオブジェクトに抽出してから渡すこと。

```typescript
// circularObj.parent が circularObj 自身を参照している -- 直接渡さない
logger.debug("Node state", {
  id: circularObj.id,
  name: circularObj.name,
  childCount: circularObj.children.length,
});
```

## 6. 運用ルール

### KEY命名戦略

デバッグ時のフィルタリング方法に合わせてKEY名を選択する。3つの一般的な方式がある。

**機能別:**

```typescript
new BreakdownLogger("auth");
new BreakdownLogger("payment");
new BreakdownLogger("notification");
```

ユーザー向け機能を軸にデバッグする場合に最適。

**レイヤー別:**

```typescript
new BreakdownLogger("controller");
new BreakdownLogger("service");
new BreakdownLogger("repository");
```

アーキテクチャレイヤーを通じたデータフローのデバッグに最適。

**処理フロー別:**

```typescript
new BreakdownLogger("order-auth");
new BreakdownLogger("order-stock");
new BreakdownLogger("order-payment");
```

複数サブシステムにまたがる単一のビジネスプロセスを追跡する場合に最適。

**KEYは一意に保つ。** 無関係な2つのモジュールが両方ともKEY `"util"`
を使用すると、`LOG_KEY=util`
で両方が表示され、フィルタリングの目的が失われる。プロジェクト内では、各KEYが正確に1つの論理コンポーネントに対応するようにすること。

### チーム規約

- 開発開始前に命名規則に合意する。同じプロジェクトで「機能別」と「レイヤー別」を混在させると混乱が生じる。
- KEY一覧（プロジェクトドキュメント内のシンプルなリスト）を管理し、開発者が新しいKEYを作る前に既存のKEYを確認できるようにする。
- 大規模プロジェクトでは、名前空間を作るためにプレフィックスを使用する:
  `auth-token`、`auth-session`、`payment-gateway`、`payment-receipt`。

### 一時的な調査

特定の問題を調査する際は、恒久的なKEYと衝突しない一意のタグを使用する。

```typescript
const logger = new BreakdownLogger("fix-423");
logger.debug("State before the suspected off-by-one", { index, length });
```

```bash
LOG_LEVEL=debug LOG_KEY=fix-423 deno test --allow-env
```

調査完了後は一時的なロガーを削除する。一時的なロガーをコードベースに残しておくと、次の開発者にとってノイズとなる。

### CI連携

継続的インテグレーションでは、ログ出力はデフォルトで最小限とし、障害調査時にのみ拡張する。

```bash
# 標準CI実行 -- エラーのみ、最小限のノイズ
LOG_LEVEL=error deno test --allow-env --allow-read --allow-write

# CI障害の調査 -- 拡張されたログ出力長でフルデバッグ
LOG_LEVEL=debug LOG_LENGTH=L deno test --allow-env --allow-read --allow-write
```

ERRORはstderrに、他のログレベルはstdoutに出力されるため、これらのストリームを分離するCIシステムでは障害が自然に強調される。

## 7. 実行パターン

### 単一テストファイル

```bash
LOG_LEVEL=debug deno test --allow-env --allow-read --allow-write tests/auth_test.ts
```

### テストスイート全体のデバッグ実行

```bash
LOG_LEVEL=debug deno test --allow-env --allow-read --allow-write
```

### KEYによるフィルタリング

```bash
# 単一KEY
LOG_LEVEL=debug LOG_KEY=database deno test --allow-env --allow-read --allow-write

# 複数KEY
LOG_LEVEL=debug LOG_KEY=auth,database,cache deno test --allow-env --allow-read --allow-write
```

### CIパイプライン（エラーのみ）

```bash
LOG_LEVEL=error deno test --allow-env --allow-read --allow-write
```

### 段階的な絞り込み

以下は「広く→狭く→深く」ワークフローの全体を、順に実行するコマンドの連続として示したものである。

```bash
# ステップ1: 何が失敗しているか？
LOG_LEVEL=error deno test --allow-env --allow-read --allow-write

# ステップ2: 障害に先行する警告は何か？
LOG_LEVEL=warn deno test --allow-env --allow-read --allow-write

# ステップ3: 疑わしいモジュールの完全なトレース（読みやすさのため切り詰めあり）
LOG_LEVEL=debug LOG_KEY=payment LOG_LENGTH=S deno test --allow-env --allow-read --allow-write

# ステップ4: 同じモジュールのさらなる詳細
LOG_LEVEL=debug LOG_KEY=payment LOG_LENGTH=L deno test --allow-env --allow-read --allow-write

# ステップ5: 失敗するテストファイルの完全なデータダンプ
LOG_LEVEL=debug LOG_KEY=payment LOG_LENGTH=W deno test --allow-env --allow-read --allow-write tests/payment_test.ts
```

各ステップは仮説を確認するか、フォーカスを移すべきことを教えてくれる。ステップ5から始めることはない。出力量がパターンの把握を困難にするためである。

## 8. 出力の把握

### ストリームルーティング

| ログレベル | ストリーム | 関数            |
| ---------- | ---------- | --------------- |
| DEBUG      | stdout     | `console.log`   |
| INFO       | stdout     | `console.log`   |
| WARN       | stdout     | `console.log`   |
| ERROR      | stderr     | `console.error` |

この分離は意図的なものである。シェルやCIシステムでは、stdoutとstderrを独立してキャプチャできる。

### ファイル出力

BreakdownLoggerはファイルへの書き込みを行わない。設計上、コンソールデバッグツールである。出力をファイルにキャプチャする必要がある場合は、シェルリダイレクトを使用する。

```bash
# 全出力を1つのファイルにキャプチャ
deno test --allow-env --allow-read --allow-write 2>&1 | tee debug.log

# stdoutとstderrを別ファイルに分離
deno test --allow-env --allow-read --allow-write > stdout.log 2> stderr.log
```

2番目の形式は特に有用である。`stderr.log`
にはERRORレベルのメッセージのみが含まれ、`stdout.log`
にはDEBUG、INFO、WARNメッセージが含まれる。

### 切り詰められた出力の読み方

行の末尾に `...` が見える場合、メッセージが切り詰められている。`LOG_LENGTH`
を1段階ずつ引き上げる。

1. （未指定）80文字 -- 切り詰められたら `S` を試す
2. `S` 160文字 -- まだ切り詰められたら `L` を試す
3. `L` 300文字 -- まだ切り詰められたら `W` を試す
4. `W` 無制限 -- 全てが表示される

### タイムスタンプ形式

タイムスタンプはISO 8601形式である。

```
2025-01-15T09:30:00.000Z
```

タイムスタンプは `data`
パラメータが提供された場合に**のみ**出力される。dataなしのメッセージにはタイムスタンプは付与されない。これにより、シンプルなトレースメッセージはコンパクトに保たれ、詳細なログエントリには時間的な参照点が与えられる。

## 9. 実践的なユースケース

### 関数呼び出しの追跡

呼び出し側と実装側で異なるKEYを使用し、境界を越えたデータの流れを追跡する。

```typescript
// order_service_test.ts
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";

const callerLog = new BreakdownLogger("order-caller");
const serviceLog = new BreakdownLogger("order-service");

Deno.test("order processing traces correctly", async () => {
  const order = { id: "ord-99", amount: 2500, currency: "USD" };

  // Caller side: what are we sending?
  callerLog.debug("Calling processOrder", order);

  const result = await processOrder(order);

  // Caller side: what did we get back?
  callerLog.debug("processOrder returned", result);
});

async function processOrder(order: Order) {
  // Service side: what did we receive?
  serviceLog.debug("processOrder received", order);

  const validated = validate(order);
  serviceLog.debug("Validation result", validated);

  const receipt = await charge(validated);

  // Service side: what are we returning?
  serviceLog.debug("processOrder returning", receipt);
  return receipt;
}
```

```bash
# 呼び出し側の視点のみ
LOG_LEVEL=debug LOG_KEY=order-caller deno test --allow-env --allow-read --allow-write

# サービス内部のみ
LOG_LEVEL=debug LOG_KEY=order-service deno test --allow-env --allow-read --allow-write

# 境界の両側を確認
LOG_LEVEL=debug LOG_KEY=order-caller,order-service deno test --allow-env --allow-read --allow-write
```

### 複数モジュールの問題切り分け

テストが複数のサブシステムを使用する場合、それぞれに固有のロガーを割り当て、必要なものにフィルタリングする。

```typescript
// integration_test.ts
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";

const authLog = new BreakdownLogger("auth");
const dbLog = new BreakdownLogger("database");
const cacheLog = new BreakdownLogger("cache");

Deno.test("user registration integration", async () => {
  authLog.debug("Hashing password", { algorithm: "bcrypt", rounds: 10 });
  const hash = await hashPassword("secret");

  dbLog.debug("Inserting user record", { table: "users", email: "a@b.com" });
  const userId = await insertUser({ email: "a@b.com", hash });

  cacheLog.debug("Warming user cache", { userId });
  await warmCache(userId);

  authLog.info("Registration complete", { userId });
});
```

```bash
# データベースのアクティビティのみ
LOG_LEVEL=debug LOG_KEY=database deno test --allow-env --allow-read --allow-write integration_test.ts

# 認証とキャッシュを同時に確認
LOG_LEVEL=debug LOG_KEY=auth,cache deno test --allow-env --allow-read --allow-write integration_test.ts

# 全て、完全なデータ付き
LOG_LEVEL=debug LOG_LENGTH=W deno test --allow-env --allow-read --allow-write integration_test.ts
```

### 動的KEYによるリクエスト追跡

複数のリクエストをシミュレートするテストでは、リクエストごとに一意のKEYを生成し、特定の実行パスにフィルタリングできるようにする。

```typescript
// api_test.ts
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";

function createRequestLogger(prefix: string): BreakdownLogger {
  const id = crypto.randomUUID().substring(0, 8);
  const key = `${prefix}-${id}`;
  const logger = new BreakdownLogger(key);
  logger.info(`Logger created with key: ${key}`);
  return logger;
}

Deno.test("concurrent request handling", async () => {
  const requests = [
    { method: "GET", path: "/users" },
    { method: "POST", path: "/orders" },
    { method: "PUT", path: "/users/42" },
  ];

  const handlers = requests.map((req) => {
    const logger = createRequestLogger("req");
    logger.debug("Handling request", req);
    return handleRequest(req, logger);
  });

  await Promise.all(handlers);
});
```

テスト実行時、各リクエストはINFOレベルで自身のKEYをログ出力する。調査したいリクエストのKEYを見つけ、そのKEYを指定して再実行する。

```bash
# 1回目の実行 -- 全KEYを確認
LOG_LEVEL=info deno test --allow-env --allow-read --allow-write api_test.ts
# 出力例: [INFO] [req-a1b2c3d4] Logger created with key: req-a1b2c3d4

# 2回目の実行 -- 1つのリクエストにフィルタリング
LOG_LEVEL=debug LOG_KEY=req-a1b2c3d4 LOG_LENGTH=W deno test --allow-env --allow-read --allow-write api_test.ts
```

このパターンは、同一ロジックの複数インスタンスが並行実行され、特定の1つの実行を追跡する必要があるあらゆるシナリオに適用できる。

## 10. 本番コードでの使用検知

BreakdownLoggerはテストコード専用に設計されている。デバッグ後に本番ファイルにimportを残してしまった場合、ロガーは何も出力しないが、不要なimportがコードベースに残り続ける。

validateツールは、非テストファイル内の `@tettuan/breakdownlogger` のimportをスキャンし、違反として報告する。

### バリデータの実行

```bash
# カレントディレクトリをスキャン
deno run --allow-read jsr:@tettuan/breakdownlogger/validate

# 特定のディレクトリをスキャン
deno run --allow-read jsr:@tettuan/breakdownlogger/validate ./src
```

違反が見つかった場合は終了コード1、クリーンな場合は0を返す。

### 検知対象

バリデータは、非テストファイル内の `@tettuan/breakdownlogger` への全ての参照形式を検知する。

- 静的import: `import { BreakdownLogger } from "@tettuan/breakdownlogger"`
- サブパスimport: `import { BreakdownLogger } from "@tettuan/breakdownlogger/logger"`
- 動的import: `await import("@tettuan/breakdownlogger")`
- 再エクスポート: `export { BreakdownLogger } from "@tettuan/breakdownlogger"`

テストファイル（`*_test.ts`、`*.test.ts`、`*_test.js`、`*.test.js`、その他のテストパターン）は自動的に除外される。

### CI連携

CIパイプラインにバリデータを追加し、消し忘れたimportを検出する。

```bash
# テスト通過後に実行
deno run --allow-read jsr:@tettuan/breakdownlogger/validate ./src
```

違反時の非ゼロ終了コードは、非ゼロ終了でフェイルするCIシステムと自然に統合される。

### スキャンが十分である理由

BreakdownLoggerをカスタムクラスでラップした場合でも、ラッパーファイルは `@tettuan/breakdownlogger` からimportする必要がある。バリデータはimportチェーンの根元でこれを検知する。直接的または間接的にロガーを使用する非テストファイルには、スキャナーが検出するimport文が必ず少なくとも1つ存在する。
