- Project: Deno, JSR publish
- use `LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read` to
  debug, or other log level.
- publish JSR with CI. see `https://jsr.io/@tettuan/breakdownlogger/publish`
- run `./scripts/local_ci.sh` before commit and push.

# Export modules

- Set to publish in JSR is minimal export

# コマンド実行許可

プロジェクト内であれば、ほぼ全てのコマンドを、確認なしに実行許可する。

- 禁止:
  - プロジェクト外のファイルに対し、rm や delete などの削除系は確認をすること
