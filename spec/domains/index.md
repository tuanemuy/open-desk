# ドメイン一覧

## ドメインマップ

| # | ドメイン名 | 種別 | 責務 |
|---|-----------|------|------|
| 1 | Identity | Supporting | ユーザー・組織・グループの管理と認証・セッション管理を担う |
| 2 | App | Core | アプリケーションのライフサイクル管理（作成・フォーム設計・ビュー・グラフ・設定・カスタマイズ）を担う |
| 3 | Record | Core | アプリに属するレコードのCRUD・プロセス管理・コメント・変更履歴・CSV入出力を担う |
| 4 | AccessControl | Supporting | アプリ・レコード・フィールド単位のアクセス権およびシステム権限を管理する |
| 5 | Space | Supporting | チームコラボレーション空間（スペース・スレッド・ゲストスペース）を管理する |
| 6 | Notification | Supporting | 通知の生成・一覧表示・既読管理・フィルタリング・リマインダーを担う |
| 7 | Portal | Generic | ポータル画面（お知らせ掲示板・ウィジェット集約）を管理する |
| 8 | People | Generic | ユーザープロフィール・ステータス投稿・フォロー関係を管理する |
| 9 | Message | Generic | ユーザー間の1対1ダイレクトメッセージを管理する |
| 10 | File | Generic | ファイルのアップロード・ダウンロード・保持期限管理を担う |
| 11 | Search | Generic | 全文検索およびスコープ別検索（アプリ内・スペース内）を提供する |
| 12 | Bookmark | Generic | ページのブックマーク（URL保存）を3カテゴリで管理する |
| 13 | SystemSettings | Supporting | システム全体の設定（ヘッダー色、機能選択、ログインセキュリティ、アクセス制限等）の読み書きを管理する |
| 14 | Audit | Supporting | 監査ログの記録・取得・フィルタリングとユーザーアクセス状況の追跡を管理する |

## 依存関係

```
Identity ← App（作成者・更新者の参照）
Identity ← Record（作成者・更新者の参照）
Identity ← Space（メンバーの参照）
Identity ← AccessControl（権限対象の参照）
Identity ← Notification（通知先の参照）
Identity ← People（プロフィール元の参照）
Identity ← Message（送受信者の参照）
Identity ← Bookmark（所有者の参照）
Identity ← File（アップロード者の参照）

App ← Record（レコードが属するアプリの参照）
App ← AccessControl（ACL設定対象のアプリの参照）

Space ← App（スペースに所属するアプリ）

Notification ← App（アプリ条件通知）
Notification ← Record（レコード条件通知）
Notification ← Space（スペース通知）

Search ← Record（レコード検索）
Search ← Space（スレッド検索）
Search ← People（ピープル検索）
Search ← Message（メッセージ検索）

Identity ← Audit（監査対象ユーザーの参照）
Identity ← SystemSettings（設定変更者の参照）
```

**循環依存なし** — すべての依存は上位ドメインから下位ドメインへの一方向。

## ドメイン間の参照ルール

- 他ドメインのエンティティは **ID（値オブジェクト）** でのみ参照する
- 他ドメインのエンティティを直接保持しない
- ドメイン間の連携が必要な場合はユースケース層でオーケストレーションする
