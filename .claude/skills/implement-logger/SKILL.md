---
name: implement-logger
description: Use when implementing features, adding code, or placing BreakdownLogger in source. Guides KEY naming, placement strategy, and validation. Trigger words - 'implement', '実装', 'add logger', 'ロガー追加', 'KEY naming', 'validate usage'.
allowed-tools: Read, Grep, Glob, Bash
---

# Implement Logger

KEY命名とロガー配置はデバッグ精度を決める設計判断なので、命名重複・配置ミス・本番混入を事前に防ぐ。

## 1. KEY Discovery

重複KEYはフィルタリングを破壊するので、新規作成前に既存KEYを検索する。

```bash
grep -rn 'new BreakdownLogger(' --include='*.ts' | grep -oP '"[^"]*"' | sort -u
```

| 状況                        | アクション                                   |
| :-------------------------- | :------------------------------------------- |
| 既存KEYがモジュールをカバー | 再利用する                                   |
| 既存KEYが広すぎる           | より具体的なsub-keyを作成する                |
| 該当KEYなし                 | 命名ルールに従い新規作成する                 |
| 一時的な調査                | `fix-<issue>` prefixで作成し、調査後削除する |

## 2. KEY Naming

KEYは `LOG_KEY=...`
で毎回タイプするフィルタハンドルなので、プロジェクトで1方式を選び一貫させる。

| 方式       | 用途                             | 例                                    |
| :--------- | :------------------------------- | :------------------------------------ |
| By feature | ユーザー向け機能のデバッグ       | `auth`, `payment`, `notification`     |
| By layer   | データフロー・アーキテクチャ問題 | `controller`, `service`, `repository` |
| By flow    | 横断的ビジネスプロセス           | `order-auth`, `order-stock`           |

制約: lowercase
kebab-case、汎用名(`util`,`helper`)禁止、論理単位ごとにユニーク、名前空間にはprefix(`auth-token`)、一時キーは
`fix-<id>`。

## 3. Placement

データは境界で変換・転送されるので、ロガーは4つの境界点（引数受信後・値返却前・外部呼出前後・エラーハンドラ内）に置く。

| アンチパターン       | 理由                                 |
| :------------------- | :----------------------------------- |
| タイトループ内       | 出力洪水でシグナルが埋没する         |
| 全行の後             | デバッグではなくナレーションになる   |
| `data`パラム無し     | メッセージだけでは根本原因が見えない |
| 循環参照オブジェクト | `[Object]` にフォールバックする      |

## 4. Writing Style

`LOG_LENGTH`
は末尾から切り詰めるので、重要情報を先頭40字に置く。メッセージ=何が起きたか、data=証拠。

```typescript
logger.debug("Timeout: DB conn exceeded 30s", { host });
```

## 5. Validation

BreakdownLoggerはテスト専用なので、非テストファイルのimportを `validate`
で検出する。Pre-commitフック・CI・コードレビュー時に実行する。

```bash
deno run --allow-read jsr:@tettuan/breakdownlogger/validate [target-dir]
```

## 6. Docs

実戦パターン（関数トレース・マルチモジュール分離・動的KEY）は `docs/usage.md`
§4,§5,§6,§9 にある。外部プロジェクトには
`deno run -A jsr:@tettuan/breakdownlogger/docs [target-dir]`
でエクスポートする。

## Checklist

```
- [ ] 既存KEY検索済み — 重複なし
- [ ] プロジェクトの命名方式(feature/layer/flow)に準拠
- [ ] 境界点にロガー配置
- [ ] メッセージは重要情報を先頭に
- [ ] dataパラムで構造化された証拠を渡す
- [ ] 循環参照オブジェクトなし
- [ ] validate_cliで本番使用なし確認済み
- [ ] 調査完了した `fix-*` ロガーは削除済み
```
