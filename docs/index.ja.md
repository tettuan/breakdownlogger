# ライブラリ概要

Denoで構築され、JSRへ公開されるデバッグ用ログ出力のライブラリである。
単体では動作せず、アプリケーションから呼ばれて利用される。

# 仕様

DebugLoggerは、アプリケーションの設定やパス解決のデバッグを支援するためのロギングシステムである。
ただしログファイルへの出力は行わず、テストコードから実行され標準出力（またはエラー出力）のみ行う。

## ユースケース

テストコード（ *_test.ts ） から呼び出される。
タイミングは任意だが、デバッグのために以下を重要なポイントとして想定する。

- 関数呼び出し前
- 引数の受け取り直後
- 返り値の直前
- 返り値の受け取り直後
- 重要な加工処理の前後

呼び出す時に、LOG_LEVEL だけでは情報が多すぎるため、以下の点に工夫する。

- 情報の量をコントロールできる
  - 未指定時は、1つの出力のログメッセージを先頭30文字以内に切る
  - 長さ指定時は、1つの出力のログメッセージを、それぞれの設定値に応じて切る
    - Short: 100文字
    - Long: 200文字
    - Whole: 全て
- ログ出力時にエラー箇所を指定できる「出力場所KEY」を持つ
  - ログを出力する箇所に固有のKEYを付与する（出力場所KEY）
    - ex. `new BreakdownLogger('hash1234')`
  - 出力に出力場所KEYを含めることで、問題の位置を特定できる

上記にによって、大量ログを出力記述しても、総出力量を抑えつつ、必要なときにピンポイントで情報量を増やして分析することができる。

- 例:
  - `LOG_LEVEL=debug deno test`
  - `LOG_LEVEL=debug LOG_LENGTH=S deno test tests/package/*` # S: Short
  - `LOG_LEVEL=debug LOG_LENGTH=L deno test tests/package/a_file_test.ts` # L:
    Long
  - `LOG_LEVEL=debug LOG_LENGTH=W LOG_KEY=hash1234 deno test tests/package/a_file_test.ts`
    # W: Whole

## 明確な要件

### 定義

#### ログレベル

1. DEBUG: 詳細なデバッグ情報
2. INFO: 一般的な情報
3. WARN: 警告
4. ERROR: エラー

#### ログ出力長

- Default: 30文字
- Short: 100文字
- Long: 200文字
- Whole: 全て

#### 出力項目

1. ログの出力項目
   - タイムスタンプ
   - ログレベル
   - 出力場所KEY
   - メッセージ内容
   - オブジェクトのダンプ（必要な場合）

### 実行時

ログの有効/無効切り替え

- テスト実行時に `LOG_LEVEL=debug deno test` のように指定
- `LOG_LENGTH`, `LOG_KEY` も指定可能

### 実行時の出力フィルター処理

1. ログレベルの制御
   - 設定されたレベル以上のログのみを出力
     - DEBUGがもっとも詳細
     - INFO,WARN,ERROR は、DEBUG指定時にも出力される
     - INFOはLOG_LEVEL指定なしで出力される
       - WARN,ERRORも出力される
     - WARNは警告時に出力される（警告的な分岐の中で使う）
     - ERRORはエラー時に出力される（エラーハンドリングの中で使う）

2. ログ出力長の制御

LOG_LENGTH=S LOG_LENGTH=L LOG_LENGTH=W LOG_LENGTH= # null, default

長さは、メッセージとデータを合わせた長さ。
「重要な情報をメッセージの先頭側へ置く」ことを重視するよう、利用者向け説明で強調する。短いときにも状態がわかるため。

3. 出力場所KEYの制御

- 渡されたKEYのみ出力する
- 区切り文字で複数指定可能
  - LOG_KEY=hash1234,hash2345
  - LOG_KEY=hash1234/hash2345
  - LOG_KEY=hash1234:hash2345
  - 区切り文字: ",/:" のいずれか

#### LOG_KEYの詳細なユースケース

##### 基本的な使い方

LOG_KEYは、複数のログ出力箇所から特定の箇所のみを選択的に表示するための機能です。大規模なアプリケーションのデバッグ時に、関心のある部分のログのみを見ることができます。

```typescript
// テストコード内での使用例
const authLogger = new BreakdownLogger("auth");
const dbLogger = new BreakdownLogger("database");
const apiLogger = new BreakdownLogger("api");
const cacheLogger = new BreakdownLogger("cache");

// 各ロガーで異なる処理をログ出力
authLogger.debug("認証トークンの検証中", { userId: 12345 });
dbLogger.debug("クエリ実行", { query: "SELECT * FROM users" });
apiLogger.warn("レート制限に近づいています", { remaining: 10 });
cacheLogger.debug("キャッシュから取得", { key: "user:12345" });
```

##### 環境変数での制御

```bash
# 認証関連のログのみ表示
LOG_KEY=auth deno test

# データベースとキャッシュのログのみ表示（カンマ区切り）
LOG_KEY=database,cache deno test

# 複数のキーを異なる区切り文字で指定
LOG_KEY=auth:database:api deno test  # コロン区切り
LOG_KEY=auth/database/cache deno test # スラッシュ区切り
```

##### 実践的なシナリオ

1. **問題の切り分け**
   ```bash
   # APIエラーの調査時、API関連のログのみ表示
   LOG_LEVEL=debug LOG_KEY=api deno test

   # データベース接続問題の調査
   LOG_LEVEL=debug LOG_KEY=database LOG_LENGTH=W deno test
   ```

2. **段階的なデバッグ**
   ```bash
   # ステップ1: エラーレベルのみ確認
   LOG_LEVEL=error deno test

   # ステップ2: 問題のあるモジュールを特定
   LOG_LEVEL=warn deno test

   # ステップ3: 特定モジュールの詳細ログ
   LOG_LEVEL=debug LOG_KEY=auth,api deno test
   ```

3. **パフォーマンス分析**
   ```bash
   # キャッシュヒット率の確認
   LOG_KEY=cache LOG_LENGTH=W deno test

   # データベースクエリの分析
   LOG_KEY=database LOG_LENGTH=L deno test
   ```

##### 命名規則のベストプラクティス

- **機能別**: `auth`, `api`, `database`, `cache`
- **レイヤー別**: `controller`, `service`, `repository`
- **処理フロー別**: `request`, `process`, `response`
- **一意性を保つ**: 同じキーを複数箇所で使わない

##### デフォルトキーの活用

```typescript
// キーを指定しない場合、"default"キーが使用される
const logger = new BreakdownLogger();
logger.info("汎用的なログメッセージ");

// デフォルトキーのみ表示
LOG_KEY=default deno test
```

##### 複雑なデバッグでの活用例

```typescript
// ユーザー処理の追跡
function processUser(userId: number) {
  const logger = new BreakdownLogger("user-processor");

  logger.debug("processUser開始", { userId });

  // 認証チェック
  const authLogger = new BreakdownLogger("user-auth");
  authLogger.debug("認証チェック開始");

  // データ取得
  const dbLogger = new BreakdownLogger("user-db");
  dbLogger.debug("ユーザーデータ取得", { table: "users", userId });

  // 処理完了
  logger.debug("処理完了", { status: "success" });
}

// 特定の処理フローのみ追跡
// LOG_KEY=user-processor,user-auth,user-db deno test
```

### 呼び出し元判定

- テストコードでのみ呼び出される。
- テストコードではない場所で呼び出された場合は、何もしない。
  - どうやって判定するのか？は、考えて欲しい

## 配布方法

- JSR へ公開するので、適した方法で構築すること。

### その他

- カスタムフォーマッターのサポート：不要
- 国際化対応：不要、英語。AIが理解すればよい。
- タイムゾーン処理：不要
- パフォーマンス：不要
- セキュリティ：不要

### 6. エラー処理

- ロガー自体のエラー処理方針：エラー出力のみ
- ログ書き込み失敗時の挙動：不要
- エラー通知メカニズム：不要

## 今後の拡張検討事項

不要

## 制約事項

1. 依存関係
   - 外部ライブラリへの依存を最小限に
   - Denoの標準ライブラリのみを使用

2. 互換性
   - TypeScript/JavaScript互換性の維持
   - Denoバージョンの互換性要件

3. サイズ
   - バンドルサイズの制限：できる限り最小化
   - メモリフットプリントの制限 ：できる限り最小化

4. export
   - 最小限の数
