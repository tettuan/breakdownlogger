# BreakdownLogger 使用例

このディレクトリには、BreakdownLogger の使用例を示すサンプルコードが含まれています。
JSR経由でインポートしたユーザーが、実際に利用する使い方を例示するとともに、実際の使い方に沿って動作確認する目的です。

## 重要な制約

**BreakdownLoggerはテスト環境でのみ動作します。** 通常のアプリケーションコードでは何も出力されません。これは設計上の制約であり、デバッグ目的でテストコード内でのみ使用することを想定しています。

## サンプル一覧

### 1. 基本的な使用例 (`basic_usage.ts`)

基本的な機能をデモンストレーションします：

- デフォルトのログレベル（INFO）での動作
- 環境変数によるログレベルの設定
- 構造化データの出力
- ログレベルの動的変更

実行方法：

```bash
# 注意: 通常の実行では動作しません（テスト環境でのみ動作）
deno run -A example/basic_usage.ts

# テストファイルとして実行する必要があります
deno test --allow-env example/basic_usage.ts
```

### 2. テスト環境での使用例 (`test_environment.ts`)

テスト環境での使用例を示します：

- 環境変数によるログレベルの設定
- テストケースでのログ出力
- エラーケースのログ出力
- パフォーマンス計測のログ出力

実行方法：

```bash
# デフォルトのログレベル（INFO）で実行
deno test --allow-env example/test_environment.ts

# DEBUGレベルで実行
LOG_LEVEL=debug deno test --allow-env example/test_environment.ts

# WARNレベルで実行
LOG_LEVEL=warn deno test --allow-env example/test_environment.ts
```

## 実行結果の例

### デフォルトのログレベル（INFO）での実行

```
=== テスト環境での使用例 ===
環境変数 LOG_LEVEL の設定: 未設定
テストスイートを開始します...

[2024-03-20T12:34:56.789Z] [INFO] テストケース1: 正常系のテストを開始
[2024-03-20T12:34:56.890Z] [INFO] テストケース1: 成功
[2024-03-20T12:34:56.891Z] [INFO] テストケース2: 異常系のテストを開始
[2024-03-20T12:34:56.992Z] [ERROR] テストケース2: 失敗
データ: Error: 意図的なエラー
[2024-03-20T12:34:56.993Z] [INFO] テストケース3: パフォーマンステストを開始
[2024-03-20T12:34:57.493Z] [INFO] テストケース3: 完了
```

### DEBUGレベルでの実行

```
=== テスト環境での使用例 ===
環境変数 LOG_LEVEL の設定: debug
テストスイートを開始します...

[2024-03-20T12:34:56.789Z] [INFO] テストケース1: 正常系のテストを開始
[2024-03-20T12:34:56.890Z] [DEBUG] 処理結果
データ: {
  "status": "success",
  "data": "テストデータ"
}
[2024-03-20T12:34:56.891Z] [INFO] テストケース1: 成功
[2024-03-20T12:34:56.892Z] [INFO] テストケース2: 異常系のテストを開始
[2024-03-20T12:34:56.993Z] [ERROR] テストケース2: 失敗
データ: Error: 意図的なエラー
[2024-03-20T12:34:56.994Z] [INFO] テストケース3: パフォーマンステストを開始
[2024-03-20T12:34:57.494Z] [DEBUG] パフォーマンス計測結果
データ: {
  "duration": "500ms",
  "timestamp": "2024-03-20T12:34:57.494Z"
}
[2024-03-20T12:34:57.495Z] [INFO] テストケース3: 完了
```

## 高度な使用例

### 3. ログ出力長の制御 (`LOG_LENGTH`)

ログメッセージの長さを環境変数で制御できます：

```bash
# デフォルト（30文字）で実行
deno test --allow-env example/test_environment.ts

# Short（100文字）で実行
LOG_LENGTH=S deno test --allow-env example/test_environment.ts

# Long（200文字）で実行
LOG_LENGTH=L deno test --allow-env example/test_environment.ts

# Whole（全文表示）で実行
LOG_LENGTH=W deno test --allow-env example/test_environment.ts
```

### 4. キーによるフィルタリング (`LOG_KEY`)

特定のロガーインスタンスのみ出力するようフィルタリングできます：

```typescript
// テストコード内で
const authLogger = new BreakdownLogger("auth");
const dbLogger = new BreakdownLogger("database");
const apiLogger = new BreakdownLogger("api");

authLogger.info("認証処理開始");
dbLogger.debug("データベース接続");
apiLogger.error("API呼び出しエラー");
```

実行時のフィルタリング：

```bash
# authのみ出力
LOG_KEY=auth deno test --allow-env your_test.ts

# authとdatabaseのみ出力（カンマ区切り）
LOG_KEY=auth,database deno test --allow-env your_test.ts

# コロン区切りも可能
LOG_KEY=auth:database:api deno test --allow-env your_test.ts

# スラッシュ区切りも可能
LOG_KEY=auth/database deno test --allow-env your_test.ts
```

### 5. デフォルトキーの使用

キーを指定せずにインスタンスを作成すると、デフォルトキー"default"が使用されます：

```typescript
// キーを指定しない場合
const logger = new BreakdownLogger();
logger.info("デフォルトキーでのログ");  // [default] が表示される

// 明示的にキーを指定
const namedLogger = new BreakdownLogger("myapp");
namedLogger.info("名前付きログ");  // [myapp] が表示される
```

### 6. 複数の環境変数の組み合わせ

環境変数は組み合わせて使用できます：

```bash
# DEBUGレベル、全文表示、特定キーのみ
LOG_LEVEL=debug LOG_LENGTH=W LOG_KEY=auth,database deno test --allow-env your_test.ts

# WARNレベル以上、100文字制限、apiキーのみ
LOG_LEVEL=warn LOG_LENGTH=S LOG_KEY=api deno test --allow-env your_test.ts
```

## 注意点

1. **テスト環境専用**
   - BreakdownLoggerはテスト環境でのみ動作します
   - 通常のスクリプトやアプリケーションでは何も出力されません
   - 必ず `deno test` コマンドで実行するか、テストファイル内で使用してください

2. **環境変数の設定**
   - `LOG_LEVEL`: ログレベルの制御（`debug`, `info`, `warn`, `error`）
   - `LOG_LENGTH`: メッセージ長の制御（`S`, `L`, `W`、または未設定）
   - `LOG_KEY`: キーによるフィルタリング（カンマ、コロン、スラッシュ区切り）

3. **メッセージの切り詰め**
   - デフォルトでは30文字で切り詰められ、末尾に`...`が付きます
   - 重要な情報はメッセージの先頭に配置することを推奨します

4. **パーミッション**
   - 環境変数の読み取りに `--allow-env` フラグが必要です

5. **エラーレベルの特別な扱い**
   - ERRORレベルのログは `console.error()` に出力されます
   - その他のレベルは `console.log()` に出力されます
