# 用語集 (Glossary)

BreakdownLoggerに関連する重要な用語とその定義をまとめた用語集です。

## A

### API

**Application Programming Interface**\
アプリケーションプログラミングインターface。BreakdownLoggerが提供するプログラムインターフェースのこと。

## B

### BreakdownLogger

**BreakdownLogger クラス**\
このライブラリの中核となるロガークラス。出力場所KEYを持ち、環境変数に基づいたフィルタリング機能を提供する。

### Bundle Size

**バンドルサイズ**\
ライブラリ全体のファイルサイズ。BreakdownLoggerでは10KB以下を目標としている。

## D

### DEBUG

**DEBUGレベル**\
最も詳細なログレベル。詳細なデバッグ情報を出力する際に使用する。

### Deno

**Deno ランタイム**\
TypeScript/JavaScriptのランタイム環境。BreakdownLoggerはDeno環境で動作し、JSRに公開される。

## E

### ERROR

**ERRORレベル**\
エラー情報を出力するログレベル。エラーハンドリングの中で使用され、常に出力される。

### Environment Variables

**環境変数**\
実行時にプログラムの動作を制御する変数群。BreakdownLoggerでは以下の環境変数を使用：

- `LOG_LEVEL`: ログレベル制御
- `LOG_LENGTH`: 出力文字数制御
- `LOG_KEY`: 出力場所フィルタリング

## F

### Filtering

**フィルタリング**\
ログ出力時に条件に基づいて出力するかどうかを判定する処理。ログレベル、出力場所KEY、文字数制限などの条件を組み合わせて制御する。

### Formatting

**フォーマット処理**\
ログエントリを出力用の文字列形式に変換する処理。タイムスタンプ、ログレベル、KEY、メッセージを含む。

## I

### INFO

**INFOレベル**\
一般的な情報を出力するログレベル。LOG_LEVEL未指定時のデフォルトレベル。

## J

### JSR

**JavaScript Registry**\
JavaScriptとTypeScriptのパッケージレジストリ。BreakdownLoggerの配布先として使用される。

## L

### Log Entry

**ログエントリ**\
単一のログ出力項目。タイムスタンプ、ログレベル、KEY、メッセージ、データを含む構造体。

### Log Level

**ログレベル**\
ログの重要度を示す階層。DEBUG < INFO < WARN < ERROR の優先順位を持つ。

### Log Length

**ログ出力長**\
ログメッセージの最大文字数制限：

- Default: 80文字
- Short (S): 160文字
- Long (L): 300文字
- Whole (W): 全文

### LOG_KEY

**出力場所KEY環境変数**\
特定の出力場所KEYを持つログのみを表示するための環境変数。カンマ(,)、コロン(:)、スラッシュ(/)で複数指定可能。

### LOG_LEVEL

**ログレベル環境変数**\
出力するログレベルを制御する環境変数。"debug", "info", "warn", "error"
のいずれかを指定。

### LOG_LENGTH

**ログ出力長環境変数**\
ログメッセージの文字数制限を制御する環境変数。"S", "L", "W" のいずれかを指定。

## M

### Message Truncation

**メッセージ切り詰め**\
指定された文字数制限に基づいてログメッセージを短縮する処理。制限を超える場合は末尾を"..."で置換する。

## O

### Output Location KEY

**出力場所KEY**\
ログ出力箇所を識別するための固有の文字列。BreakdownLoggerのコンストラクタで指定し、問題の位置特定に使用する。

## P

### Problem Matcher

**プロブレムマッチャー**\
VS Codeでタスクの出力からエラーや警告を解析するためのパターン定義。

## S

### Stack Trace

**スタックトレース**\
関数呼び出しの履歴情報。テストコードからの呼び出し判定に使用される。

### Standard Output

**標準出力**\
プログラムの通常の出力先。BreakdownLoggerは標準出力（INFO, DEBUG,
WARN）とエラー出力（ERROR）を使い分ける。

## T

### Test Code

**テストコード**\
`*_test.ts`、`*_test.js`パターンのファイル名を持つテストファイル。BreakdownLoggerはテストコードからの呼び出しでのみ動作する。

### Test Environment

**テスト環境**\
テストコードが実行される環境。BreakdownLoggerが動作する条件となる実行環境。

### Timestamp

**タイムスタンプ**\
ログ出力時刻を示すISO 8601形式の文字列。各ログエントリの先頭に付与される。

### TypeScript

**TypeScript**\
Microsoft開発の型付きJavaScript。BreakdownLoggerの開発言語として使用される。

## W

### WARN

**WARNレベル**\
警告情報を出力するログレベル。警告的な分岐処理で使用される。

### Workspace

**ワークスペース**\
VS Codeやその他の開発環境におけるプロジェクトのルートディレクトリ。

## 使用例における専門用語

### デバッグフロー関連

- **関数呼び出し前**: ログ出力の推奨タイミングの1つ
- **引数の受け取り直後**: ログ出力の推奨タイミングの1つ
- **返り値の直前**: ログ出力の推奨タイミングの1つ
- **返り値の受け取り直後**: ログ出力の推奨タイミングの1つ
- **重要な加工処理の前後**: ログ出力の推奨タイミングの1つ

### フィルタリング関連

- **早期リターン**: 条件に合わない場合に処理を即座に終了する最適化手法
- **区切り文字**:
  LOG_KEYで複数の値を指定する際に使用する文字（カンマ、コロン、スラッシュ）
- **キーマッチング**: 指定されたKEYがフィルタ条件に含まれるかの判定処理

### 実装関連

- **シングルトン**:
  単一のインスタンスのみを持つデザインパターン（BreakdownLoggerでは使用しない）
- **依存関係**: 外部ライブラリへの依存。BreakdownLoggerでは最小限に抑制
- **メモリフットプリント**: プログラムが使用するメモリ容量
- **エクスポート**: モジュールから外部に公開する要素の宣言

## 略語・記号

- **API**: Application Programming Interface
- **JSR**: JavaScript Registry
- **CLI**: Command Line Interface
- **CI**: Continuous Integration
- **S**: Short（LOG_LENGTH=S）
- **L**: Long（LOG_LENGTH=L）
- **W**: Whole（LOG_LENGTH=W）
- **UTC**: Coordinated Universal Time（タイムスタンプで使用）
- **ISO 8601**: 国際標準日時形式
