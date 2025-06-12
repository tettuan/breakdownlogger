# BreakdownLogger 開発設計書

## 1. 概要設計

### 1.1 システム構成

BreakdownLoggerは、テストコードのデバッグを支援するための軽量なロギングライブラリである。

#### 主要コンポーネント

1. **BreakdownLogger クラス**
   - ログ出力の中核となるクラス
   - 出力場所KEY（インスタンス識別子）を持つ
   - 環境変数に基づいたフィルタリング機能

2. **環境変数制御**
   - `LOG_LEVEL`: ログレベル制御
   - `LOG_LENGTH`: 出力文字数制御
   - `LOG_KEY`: 出力場所フィルタリング

3. **呼び出し元判定機能**
   - テストコード（*_test.ts）からの呼び出しのみ有効
   - 通常のコードからは動作しない

### 1.2 クラス設計

```mermaid
classDiagram
    class LogLevel {
        <<enumeration>>
        DEBUG
        INFO
        WARN
        ERROR
    }

    class LogLength {
        <<enumeration>>
        DEFAULT = 30
        SHORT = 100
        LONG = 200
        WHOLE = -1
    }

    class LogEntry {
        +timestamp: Date
        +level: LogLevel
        +key: string
        +message: string
        +data?: unknown
    }

    class BreakdownLogger {
        -key: string
        -isTestEnvironment: boolean
        +constructor(key: string)
        +debug(message: string, data?: unknown): void
        +info(message: string, data?: unknown): void
        +warn(message: string, data?: unknown): void
        +error(message: string, data?: unknown): void
        -log(level: LogLevel, message: string, data?: unknown): void
        -shouldLog(level: LogLevel): boolean
        -shouldOutputKey(): boolean
        -getMaxLength(): number
        -truncateMessage(message: string): string
        -formatLogEntry(entry: LogEntry): string
        -checkTestEnvironment(): boolean
    }

    class EnvironmentConfig {
        <<static>>
        +getLogLevel(): LogLevel
        +getLogLength(): LogLength
        +getLogKeys(): string[]
    }

    LogEntry -- LogLevel
    BreakdownLogger -- LogLevel
    BreakdownLogger -- LogLength
    BreakdownLogger -- LogEntry
    BreakdownLogger -- EnvironmentConfig
```

### 1.3 アーキテクチャ概要

```mermaid
flowchart TB
    subgraph TestCode[テストコード環境]
        Test[テストケース]
    end
    
    subgraph EnvVars[環境変数]
        LogLevel[LOG_LEVEL]
        LogLength[LOG_LENGTH]
        LogKey[LOG_KEY]
    end
    
    subgraph Library[BreakdownLogger]
        Instance[Logger Instance<br/>key: 'hash1234']
        Filter[フィルタリング処理]
        Format[フォーマット処理]
    end
    
    subgraph Output[出力]
        Stdout[標準出力]
        Stderr[エラー出力]
    end
    
    Test -->|new BreakdownLogger('hash1234')| Instance
    EnvVars --> Filter
    Instance --> Filter
    Filter -->|条件一致| Format
    Format --> Stdout
    Format -->|ERROR| Stderr
```

## 2. 詳細設計

### 2.1 基本的なログ出力フロー

```mermaid
sequenceDiagram
    participant Test as テストコード
    participant Logger as BreakdownLogger
    participant Env as 環境変数
    participant Console as 標準出力

    Test->>Logger: new BreakdownLogger('hash1234')
    activate Logger
    Logger->>Logger: checkTestEnvironment()
    Note right of Logger: 呼び出し元がテストかチェック
    deactivate Logger
    
    Test->>Logger: debug("デバッグメッセージ", data)
    activate Logger
    Logger->>Env: getLogLevel()
    Env-->>Logger: "debug"
    Logger->>Logger: shouldLog(LogLevel.DEBUG)
    
    Logger->>Env: getLogKeys()
    Env-->>Logger: ["hash1234", "hash2345"]
    Logger->>Logger: shouldOutputKey()
    Note right of Logger: key='hash1234'は含まれる
    
    Logger->>Env: getLogLength()
    Env-->>Logger: "S" (Short)
    Logger->>Logger: truncateMessage(message, 100)
    
    Logger->>Logger: formatLogEntry()
    Logger->>Console: console.log()
    deactivate Logger
```

### 2.2 フィルタリング処理の詳細

```mermaid
flowchart TD
    A[ログ出力要求] --> B{テスト環境？}
    B -->|No| END[出力しない]
    B -->|Yes| C{LOG_LEVEL<br/>チェック}
    
    C -->|レベル不足| END
    C -->|レベル十分| D{LOG_KEY<br/>指定あり？}
    
    D -->|No| E[文字数制限処理]
    D -->|Yes| F{KEYマッチ？}
    
    F -->|No| END
    F -->|Yes| E
    
    E --> G{LOG_LENGTH<br/>取得}
    G -->|Default| H[30文字に切り詰め]
    G -->|S| I[100文字に切り詰め]
    G -->|L| J[200文字に切り詰め]
    G -->|W| K[全文表示]
    
    H --> OUTPUT[フォーマット&出力]
    I --> OUTPUT
    J --> OUTPUT
    K --> OUTPUT
```

### 2.3 環境変数の解析処理

```mermaid
flowchart LR
    subgraph LOG_LEVEL
        LV["環境変数値"] --> LVP{値の解析}
        LVP -->|"debug"| DEBUG
        LVP -->|"info"| INFO
        LVP -->|"warn"| WARN
        LVP -->|"error"| ERROR
        LVP -->|未設定| INFO
    end
    
    subgraph LOG_LENGTH
        LL["環境変数値"] --> LLP{値の解析}
        LLP -->|"S"| SHORT[100文字]
        LLP -->|"L"| LONG[200文字]
        LLP -->|"W"| WHOLE[全文]
        LLP -->|未設定| DEFAULT[30文字]
    end
    
    subgraph LOG_KEY
        LK["環境変数値"] --> LKP{区切り文字で分割}
        LKP -->|"hash1234,hash2345"| KEYS1["['hash1234', 'hash2345']"]
        LKP -->|"hash1234:hash2345"| KEYS2["['hash1234', 'hash2345']"]
        LKP -->|"hash1234/hash2345"| KEYS3["['hash1234', 'hash2345']"]
    end
```

### 2.4 実装詳細

#### 環境変数の仕様

| 環境変数   | 値                                        | デフォルト | 説明                     |
| ---------- | ----------------------------------------- | ---------- | ------------------------ |
| LOG_LEVEL  | "debug" \| "info" \| "warn" \| "error"    | "info"     | ログレベルの制御         |
| LOG_LENGTH | "S" \| "L" \| "W"                         | (未設定)   | 出力文字数の制御         |
| LOG_KEY    | "key1,key2" \| "key1:key2" \| "key1/key2" | (未設定)   | 出力場所のフィルタリング |

#### 出力フォーマット

```typescript
// 基本フォーマット
[timestamp] [LEVEL] [key] message

// 実例
[2024-03-10T12:00:00.000Z] [DEBUG] [hash1234] デバッグメッセージ（最大30文字まで...

// dataがある場合
[2024-03-10T12:00:00.000Z] [DEBUG] [hash1234] デバッグメッセージ
Data: { "optional": "データ" }
```

#### テスト環境の判定ロジック

```typescript
function checkTestEnvironment(): boolean {
  // 方法1: スタックトレースから呼び出し元のファイル名を取得
  const stack = new Error().stack;
  return stack?.includes("_test.ts") || stack?.includes("_test.js") || false;

  // 方法2: Deno.testが定義されているかチェック（代替案）
  // return typeof Deno !== 'undefined' && typeof Deno.test === 'function';
}
```

### 2.5 メッセージ切り詰め処理

```typescript
function truncateMessage(message: string, maxLength: number): string {
  if (maxLength === -1) return message; // WHOLE

  if (message.length <= maxLength) {
    return message;
  }

  // 最後の3文字を"..."に置換
  return message.substring(0, maxLength - 3) + "...";
}

// 使用例
truncateMessage("これは非常に長いメッセージです", 30);
// => "これは非常に長いメッセージ..."
```

### 2.6 ログレベルの優先順位

```mermaid
graph TD
    ERROR[ERROR<br/>常に出力] --> WARN[WARN<br/>WARN以上で出力]
    WARN --> INFO[INFO<br/>INFO以上で出力]
    INFO --> DEBUG[DEBUG<br/>DEBUG以上で出力]
    
    style ERROR fill:#f96,stroke:#333,stroke-width:2px
    style WARN fill:#fc6,stroke:#333,stroke-width:2px
    style INFO fill:#6cf,stroke:#333,stroke-width:2px
    style DEBUG fill:#cfc,stroke:#333,stroke-width:2px
```

## 3. 実装方針

### 3.1 ディレクトリ構造

```
breakdownlogger/
├── mod.ts              # エントリーポイント
├── src/
│   ├── logger.ts       # BreakdownLoggerクラス
│   └── types.ts        # 型定義
├── tests/
│   └── logger_test.ts  # テストコード
└── deno.json          # Deno設定
```

### 3.2 エクスポート設計

```typescript
// mod.ts
export { BreakdownLogger } from "./src/logger.ts";
export type { LogLevel } from "./src/types.ts";
// 最小限のエクスポートのみ
```

### 3.3 使用例

```typescript
// テストコード内での使用
import { BreakdownLogger } from "@scope/breakdownlogger";

Deno.test("設定の読み込みテスト", () => {
  const logger = new BreakdownLogger("config-loader-001");

  // 関数呼び出し前
  logger.debug("loadConfig開始", { path: configPath });

  const config = loadConfig(configPath);

  // 返り値の受け取り直後
  logger.debug("loadConfig完了", config);

  // 重要な加工処理の前
  logger.debug("パス解決処理開始", { basePath, relativePath });
  const resolvedPath = resolvePath(basePath, relativePath);
  // 重要な加工処理の後
  logger.debug("パス解決完了", { resolvedPath });
});
```

## 4. テスト計画

### 4.1 テストケース一覧

| カテゴリ     | テスト内容                 | 期待結果               |
| ------------ | -------------------------- | ---------------------- |
| 基本機能     | 各ログレベルメソッドの動作 | 正しくログが出力される |
| 環境変数     | LOG_LEVEL制御              | 指定レベル以上のみ出力 |
| 環境変数     | LOG_LENGTH制御             | 指定文字数で切り詰め   |
| 環境変数     | LOG_KEY制御                | 指定KEYのみ出力        |
| 呼び出し元   | テストコードから呼び出し   | ログ出力される         |
| 呼び出し元   | 通常コードから呼び出し     | ログ出力されない       |
| 区切り文字   | カンマ区切りKEY            | 正しく解析             |
| 区切り文字   | コロン区切りKEY            | 正しく解析             |
| 区切り文字   | スラッシュ区切りKEY        | 正しく解析             |
| エッジケース | 空文字列                   | エラーなく処理         |
| エッジケース | 巨大オブジェクト           | メモリ効率的に処理     |

### 4.2 パフォーマンス考慮事項

1. **メモリ効率**
   - ログエントリは即座に出力し、保持しない
   - 巨大なオブジェクトは文字列化前に切り詰め

2. **実行速度**
   - 環境変数は初回読み込み時にキャッシュ
   - 出力判定は早期リターンで最適化

## 5. 制約事項

1. **依存関係**
   - Deno標準ライブラリのみ使用
   - 外部ライブラリへの依存なし

2. **互換性**
   - Deno 1.x以上をサポート
   - TypeScript/JavaScript両対応

3. **セキュリティ**
   - ログ出力時の機密情報は呼び出し側の責任
   - ファイル出力は行わない（標準出力のみ）

4. **バンドルサイズ**
   - 最小限の実装で10KB以下を目標
