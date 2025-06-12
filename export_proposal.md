# Export整理提案

## 現状分析

現在、mod.tsから以下の2つのみがexportされています：

- `BreakdownLogger` クラス
- `LogLevel` 列挙型

## 提案する最小限のexport構成

### 1. 必須export（現状維持）

```typescript
export { BreakdownLogger } from "./src/logger.ts";
export { LogLevel } from "./src/types.ts";
```

### 2. 追加を検討すべきexport

#### Option A: 最小限アプローチ（推奨）

現状のままで十分。理由：

- ユーザーは`BreakdownLogger`と`LogLevel`だけで全機能を利用可能
- 環境変数による設定で柔軟性を確保
- APIサーフェスが小さく、後方互換性を保ちやすい

#### Option B: 型安全性向上アプローチ

```typescript
export { BreakdownLogger } from "./src/logger.ts";
export { type LogEntry, LogLength, LogLevel } from "./src/types.ts";
```

追加する理由：

- `LogLength`: LOG_LENGTH環境変数の値を型安全に扱える
- `LogEntry`: カスタムログ処理を実装する際の型定義として有用

#### Option C: 高度なカスタマイズアプローチ

```typescript
export { BreakdownLogger } from "./src/logger.ts";
export { type LogEntry, LogLength, LogLevel } from "./src/types.ts";
export { EnvironmentConfig } from "./src/environment_config.ts";
export { LogFormatter } from "./src/log_formatter.ts";
export { LogFilter } from "./src/log_filter.ts";
```

追加する理由：

- 上級ユーザーがカスタムロガーを構築可能
- 内部コンポーネントを再利用してカスタマイズ

## 推奨案：Option A（現状維持）

### 理由

1. **シンプルさ**: 2つのexportだけで全機能が利用可能
2. **環境変数による設定**: 追加のAPIなしで柔軟な設定が可能
3. **後方互換性**: 将来の変更が容易
4. **ドキュメントの明確さ**: 少ないAPIは学習が容易

### 使用例

```typescript
import { BreakdownLogger, LogLevel } from "@tettuan/breakdownlogger";

// 基本的な使用
const logger = new BreakdownLogger("my-app");
logger.info("Application started");
logger.debug("Debug info", { data: "value" });

// 環境変数での設定
// LOG_LEVEL=debug
// LOG_LENGTH=L
// LOG_KEY=my-app,db
```

## 結論

現在の最小限のexport構成は、ライブラリの目的（テスト環境でのデバッグログ）に対して適切です。追加のexportは必要に応じて将来的に検討すべきです。
