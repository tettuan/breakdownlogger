---
name: debug-with-logger
description: Use when debugging test failures, investigating behavior, or running tests with BreakdownLogger output. Guides the 3-phase debugging workflow and environment controls. Trigger words - 'debug', 'デバッグ', 'test failure', 'テスト失敗', 'investigate', '調査', 'LOG_LEVEL', 'LOG_KEY'.
allowed-tools: Read, Grep, Glob, Bash
---

# Debug with Logger

3つの直交する制御次元（level × length × key）を体系的に組み合わせることで、根本原因を分単位で特定する。

## 1. Three Dimensions

各次元は異なる問いに答えるので、組み合わせにより精度が乗算される。

| 次元 | 変数 | 問い | 値 |
|:--|:--|:--|:--|
| Level | `LOG_LEVEL` | 深刻度は？ | `debug/info/warn/error` |
| Length | `LOG_LENGTH` | 詳細度は？ | (未設定)/`S`/`L`/`W` |
| Key | `LOG_KEY` | どのコンポーネント？ | カンマ区切りキー |

## 2. Three-Phase Workflow

全デバッグ出力から始めるとノイズにパターンが埋没するので、広い視野から段階的に絞り込む。

**Phase 1** — エラーのみで障害箇所を特定する:
```bash
LOG_LEVEL=error deno test --allow-env --allow-read --allow-write
```

**Phase 2** — Phase 1で判明したコンポーネントにKEYで絞り込む:
```bash
LOG_LEVEL=debug LOG_KEY=<key> LOG_LENGTH=S deno test --allow-env --allow-read --allow-write
```

**Phase 3** — 特定箇所のデータを切り詰めなしで全量確認する:
```bash
LOG_LEVEL=debug LOG_KEY=<key> LOG_LENGTH=W deno test --allow-env --allow-read --allow-write tests/<file>_test.ts
```

## 3. KEY Discovery

フィルタリングにはKEY名の把握が必要なので、grepで検索する。`LOG_KEY` は完全一致（`auth` は `auth-module` にマッチしない）。

```bash
grep -rn 'new BreakdownLogger(' --include='*.ts' | grep -oP '"[^"]*"' | sort -u
```

| LOG_KEY値 | マッチ対象 |
|:--|:--|
| `auth` | `"auth"` のみ |
| `auth,database` | `"auth"` OR `"database"` |
| (未設定) | 全キー |

## 4. Decision Guide

| 症状 | アクション |
|:--|:--|
| 出力なし | `LOG_LEVEL` を確認（デフォルト=`info`） |
| 出力過多 | `LOG_KEY=<component>` を追加する |
| メッセージ切り詰め(`...`) | `LOG_LENGTH` を上げる: 未設定→`S`→`L`→`W` |
| データオブジェクトを見たい | logger呼び出しで `data` パラムを渡す |
| 特定テストのみエラー | コマンドにテストファイルパスを追加する |
| どのKEYを使うか不明 | ソースで `new BreakdownLogger(` をgrep |
| モジュール横断トレース | `LOG_KEY=key1,key2,key3` を使う |

## 5. Stream Routing

ERRORはstderr、それ以外はstdoutに出力されるので、`2> stderr.log` でエラーだけを即時分離できる。全出力は `2>&1 | tee debug.log` で取得する。

## 6. Docs

実戦パターン（段階的絞り込み・関数トレース・マルチモジュール分離）は `docs/usage.md` §4,§7,§9 にある。外部プロジェクトには `deno run -A jsr:@tettuan/breakdownlogger/docs [target-dir]` でエクスポートする。

## 7. Validation

調査中に追加したロガーが本番コードに漏れるのを防ぐため、コミット前に検証する。一時調査ロガーは `fix-<id>` キーで作成し、調査後に削除する。

```bash
deno run --allow-read jsr:@tettuan/breakdownlogger/validate [target-dir]
```

## Quick Reference

```bash
# Phase 1
LOG_LEVEL=error deno test --allow-env --allow-read --allow-write
# Phase 2
LOG_LEVEL=debug LOG_KEY=<key> LOG_LENGTH=S deno test --allow-env --allow-read --allow-write
# Phase 3
LOG_LEVEL=debug LOG_KEY=<key> LOG_LENGTH=W deno test --allow-env --allow-read --allow-write tests/<file>_test.ts
# KEY検索
grep -rn 'new BreakdownLogger(' --include='*.ts' | grep -oP '"[^"]*"' | sort -u
# 本番使用検証
deno run --allow-read jsr:@tettuan/breakdownlogger/validate .
```
