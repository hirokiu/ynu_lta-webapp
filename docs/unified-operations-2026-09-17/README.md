# 管理画面の取得処理・共通配備

APIとWebの分離を維持し、APIリポジトリの`webapp` submoduleでこのWebの版を固定する。
共通Compose・バックアップ・再起動・初回移行の説明は[API運用文書](https://github.com/hirokiu/ynu_lta-webapi/blob/refactor/unified-operations/docs/unified-operations-2026-09-17/README.md)を参照。

- Survey/Assignment一覧、Survey詳細の配信一覧を50件ずつ取得。
- 検索と日付条件を同時適用。APIの`/admin/surveys`・`/admin/assignments`が必要なのでWebだけを旧APIへ配備しない。
- 回答エクスポートに期間指定・エラー表示を追加。CSV仕様は稼働版を維持。Blob URLでダウンロード。
- 接続先は同じサイトの`/api`。必要な検証環境のみ`VUE_APP_API_BASE_URL`でビルド時に変更可能。
- npmロックファイルを保存。Dockerビルドを再現可能にし、実行時にNodeは不要（nginxで静的配信）。
- `node test/paging.test.js`で応答競合と出力失敗を検証。ビルド済み。既存Vue 2/CLI 4の全面更新は別段階で行う。

本番反映はまだ実施していない。稼働版はタグ`production-baseline-2026-09-17`で保持する。

エクスポートは表示ページに依存せずSurvey全体が対象（期間指定時はその期間内、1万回答超は期間分割が必要）。生成中はスピナーと日本語メッセージを表示し、重複操作を抑止する。成功・失敗のいずれでも生成中表示を解除する。
