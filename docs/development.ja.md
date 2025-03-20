# 詳細設計書

## 1. システム概要

### 1.1 クラス図

```mermaid
classDiagram
    class LogLevel {
        <<enumeration>>
        DEBUG
        INFO
        WARN
        ERROR
    }

    class LogEntry {
        +timestamp: number
        +level: LogLevel
        +message: string
        +data?: unknown
    }

    class BreakdownLogger {
        -currentLogLevel: LogLevel
        +constructor()
        +setLogLevel(level: LogLevel): void
        +debug(message: string, data?: unknown): void
        +info(message: string, data?: unknown): void
        +warn(message: string, data?: unknown): void
        +error(message: string, data?: unknown): void
        -log(level: LogLevel, message: string, data?: unknown): void
        -shouldLog(level: LogLevel): boolean
        -formatLogEntry(entry: LogEntry): string
    }

    LogEntry -- LogLevel
    BreakdownLogger -- LogLevel
    BreakdownLogger -- LogEntry
```

### 1.2 ユースケース図

```mermaid
graph TB
    subgraph テストコード
        A[テストケース実行] --> B{ログレベル設定}
        B -->|DEBUG| C[デバッグログ出力]
        B -->|INFO| D[情報ログ出力]
        B -->|WARN| E[警告ログ出力]
        B -->|ERROR| F[エラーログ出力]
    end
    subgraph BreakdownLogger
        C --> G[ログエントリ生成]
        D --> G
        E --> G
        F --> G
        G --> H[標準出力]
    end
```

## 2. シーケンス図

### 2.1 基本的なログ出力フロー

```mermaid
sequenceDiagram
    participant Test as テストコード
    participant Logger as BreakdownLogger
    participant Console as 標準出力

    Test->>Logger: new BreakdownLogger()
    Test->>Logger: setLogLevel(LogLevel.DEBUG)
    
    Test->>Logger: debug("デバッグメッセージ", data)
    activate Logger
    Logger->>Logger: shouldLog(LogLevel.DEBUG)
    Logger->>Logger: formatLogEntry()
    Logger->>Console: console.log()
    deactivate Logger
```

### 2.2 ログレベルフィルタリング

```mermaid
sequenceDiagram
    participant Test as テストコード
    participant Logger as BreakdownLogger
    participant Console as 標準出力

    Test->>Logger: setLogLevel(LogLevel.WARN)
    
    Test->>Logger: debug("デバッグメッセージ")
    activate Logger
    Logger->>Logger: shouldLog(LogLevel.DEBUG)
    Note right of Logger: 出力されない（レベル不足）
    deactivate Logger
    
    Test->>Logger: warn("警告メッセージ")
    activate Logger
    Logger->>Logger: shouldLog(LogLevel.WARN)
    Logger->>Logger: formatLogEntry()
    Logger->>Console: console.log()
    deactivate Logger
```

## 3. 処理フロー

### 3.1 ログ出力の判断フロー

```mermaid
flowchart TD
    A[開始] --> B{環境変数<br>LOG_LEVELの確認}
    B -->|設定あり| C[ログレベル設定]
    B -->|設定なし| D[デフォルトレベル<br>設定]
    C --> E{ログ出力要求}
    D --> E
    E --> F{レベルチェック}
    F -->|基準以上| G[ログエントリ<br>生成]
    F -->|基準未満| H[処理終了]
    G --> I[標準出力]
    I --> J[終了]
    H --> J
```

## 4. 実装詳細

### 4.1 環境変数

- `LOG_LEVEL`: ログレベルの設定
  - 値: "debug" | "info" | "warn" | "error"
  - デフォルト: "info"

### 4.2 出力フォーマット

```typescript
// ログエントリのフォーマット例
{
  timestamp: 1710000000000,
  level: "DEBUG",
  message: "デバッグメッセージ",
  data: { optional: "データ" }
}

// 出力形式
// [2024-03-10T12:00:00.000Z] [DEBUG] デバッグメッセージ
// データ: { "optional": "データ" }
```

### 4.3 エラーハンドリング

```mermaid
flowchart TD
    A[ログ出力開始] --> B{データ型チェック}
    B -->|OK| C[フォーマット処理]
    B -->|NG| D[型エラー出力]
    C --> E{出力処理}
    E -->|成功| F[処理完了]
    E -->|失敗| G[エラー出力]
    D --> F
    G --> F
```

## 5. テスト戦略

### 5.1 テストケース

```mermaid
mindmap
    root((テスト計画))
        単体テスト
            ログレベル設定
            各ログメソッド
            フォーマット処理
        統合テスト
            環境変数との連携
            実際のユースケース
        エッジケース
            不正なログレベル
            異常データ
```

## 6. 制約事項と注意点

1. 実行環境
   - Deno実行環境のみをサポート
   - TypeScript/JavaScript互換性の維持

2. パフォーマンス
   - メモリ使用量の最小化
   - 不要なログ保持の回避

3. 拡張性
   - 将来的な機能追加を考慮したモジュール設計
   - インターフェースの安定性維持 