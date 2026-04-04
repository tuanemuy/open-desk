# イベント

## 1.1 イベントハンドラー管理

### openDesk.events.on(type, handler)

イベントハンドラーを登録します。

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| type | 文字列 / 文字列配列 | ○ | イベントタイプ |
| handler | 関数 | ○ | イベント発生時に実行されるハンドラー |

```javascript
// 単一イベント
openDesk.events.on('app.record.index.show', (event) => {
  console.log(event);
});

// 複数イベントに同じハンドラーを登録
openDesk.events.on(['app.record.create.show', 'app.record.edit.show'], (event) => {
  console.log(event);
});
```

### openDesk.events.off(type, handler)

イベントハンドラーを削除します。

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| type | 文字列 / 文字列配列 | × | イベントタイプ |
| handler | 関数 | × | 削除するハンドラー |

**戻り値**: `true`（削除成功）/ `false`（ハンドラーが見つからない）

```javascript
const handler = (event) => { console.log(event); };
openDesk.events.on('app.record.index.show', handler);

// 特定ハンドラーを削除
openDesk.events.off('app.record.index.show', handler);

// イベントタイプのすべてのハンドラーを削除
openDesk.events.off('app.record.index.show');

// すべてのハンドラーを削除
openDesk.events.off();
```

## 1.2 イベントオブジェクトで実行できる操作

イベントハンドラー内でeventオブジェクトを操作し、returnすることで以下の制御が可能です。

| 操作 | 方法 | 対応イベント |
|---|---|---|
| フィールド値の書き換え | `event.record.フィールドコード.value = 値` | create/edit系 |
| フィールドの編集可否制御 | `event.record.フィールドコード.disabled = true/false` | show系 |
| フィールドエラー表示 | `event.record.フィールドコード.error = "メッセージ"` | submit系、show系 |
| 画面上部エラー表示 | `event.error = "メッセージ"` | submit系 |
| 保存キャンセル | `return false` | submit系、delete.submit系 |
| URL遷移 | `event.url = "遷移先URL"` | submit.success系 |
| ルックアップ自動取得 | `event.record.フィールドコード.lookup = "UPDATE"` | show系、change系 |
| ルックアップクリア | `event.record.フィールドコード.lookup = "CLEAR"` | show系、change系 |
| 非同期処理 | Promiseをreturn | 全イベント |

## 1.3 レコード一覧画面イベント

### app.record.index.show

レコード一覧画面を表示した後のイベント。

| 項目 | 値 |
|---|---|
| PC | `app.record.index.show` |
| モバイル | `mobile.app.record.index.show` |
| 発火タイミング | 一覧画面表示時、ページ送り時、絞り込み変更時、カテゴリー変更時、ソート時（表形式）、年月変更時（カレンダー形式） |

**eventオブジェクトのプロパティ**:

| プロパティ | 型 | 説明 |
|---|---|---|
| type | 文字列 | イベントタイプ |
| appId | 数値 | アプリID |
| viewId | 数値 | 一覧ID |
| viewName | 文字列 | 一覧名 |
| viewType | 文字列 | `list`（表形式）、`calendar`（カレンダー）、`custom`（カスタマイズ） |
| records | 配列/オブジェクト | レコード情報（viewTypeにより形式が異なる） |
| date | 文字列 | カレンダー形式時の表示月（例: `2013-06`） |
| offset | 数値 | 一覧のオフセット数 |
| size | 数値 | レコード数 |

### app.record.index.edit.show

レコード一覧画面のインライン編集を開始したときのイベント。**PCのみ**。

| 項目 | 値 |
|---|---|
| PC | `app.record.index.edit.show` |
| 発火タイミング | インライン編集を開始したとき |

**eventオブジェクトのプロパティ**:

| プロパティ | 型 | 説明 |
|---|---|---|
| type | 文字列 | イベントタイプ |
| appId | 数値 | アプリID |
| recordId | 文字列 | レコードID |
| record | オブジェクト | インライン編集開始時のレコード情報 |

**returnで制御可能**: フィールドの編集可/不可設定、Promise対応

### app.record.index.edit.submit

レコード一覧画面のインライン編集で保存するときのイベント。**PCのみ**。

| 項目 | 値 |
|---|---|
| PC | `app.record.index.edit.submit` |
| 発火タイミング | インライン編集で保存ボタンクリック時（サーバー保存前） |

**eventオブジェクトのプロパティ**:

| プロパティ | 型 | 説明 |
|---|---|---|
| type | 文字列 | イベントタイプ |
| appId | 文字列 | アプリID |
| recordId | 文字列 | レコードID |
| record | オブジェクト | 保存対象のレコードデータ |

**returnで制御可能**: `false`で保存キャンセル、フィールド値の書き換え、エラー表示、Promise対応

### app.record.index.edit.submit.success

レコード一覧画面のインライン編集に成功したときのイベント。**PCのみ**。

| 項目 | 値 |
|---|---|
| PC | `app.record.index.edit.submit.success` |
| 発火タイミング | インライン編集でサーバー保存成功後 |

**eventオブジェクトのプロパティ**:

| プロパティ | 型 | 説明 |
|---|---|---|
| type | 文字列 | イベントタイプ |
| appId | 数値 | アプリID |
| recordId | 文字列 | レコードID |
| record | オブジェクト | 保存したレコードデータ |

**returnで制御可能**: 指定URLへの遷移、Promise対応

### app.record.index.delete.submit

レコード一覧画面でレコードを削除する前のイベント。**PCのみ**。

| 項目 | 値 |
|---|---|
| PC | `app.record.index.delete.submit` |
| 発火タイミング | 削除ボタンクリック後、確認ダイアログで「削除する」を押した直後（サーバー保存前） |

**eventオブジェクトのプロパティ**:

| プロパティ | 型 | 説明 |
|---|---|---|
| type | 文字列 | イベントタイプ |
| appId | 数値 | アプリID |
| recordId | 数値 | レコードID |
| record | オブジェクト | 削除対象のレコードデータ |

**returnで制御可能**: `false`で削除キャンセル、画面上部エラー表示、Promise対応

## 1.4 レコード詳細画面イベント

### app.record.detail.show

レコード詳細画面を表示した後のイベント。

| 項目 | 値 |
|---|---|
| PC | `app.record.detail.show` |
| モバイル | `mobile.app.record.detail.show` |
| 発火タイミング | 詳細画面表示時、ページ送り時、編集画面からの保存/キャンセル時、プロセスのアクション実行後 |

**eventオブジェクトのプロパティ**:

| プロパティ | 型 | 説明 |
|---|---|---|
| type | 文字列 | イベントタイプ |
| appId | 数値 | アプリID |
| recordId | 数値 | レコードID |
| record | オブジェクト | 表示したレコードデータ |

**returnで制御可能**: Promise対応

### app.record.detail.delete.submit

レコード詳細画面でレコードを削除する前のイベント。

| 項目 | 値 |
|---|---|
| PC | `app.record.detail.delete.submit` |
| モバイル | `mobile.app.record.detail.delete.submit` |
| 発火タイミング | 削除ボタンクリック後、確認ダイアログで「削除する」を押した直後 |

**eventオブジェクトのプロパティ**:

| プロパティ | 型 | 説明 |
|---|---|---|
| type | 文字列 | イベントタイプ |
| appId | 数値 | アプリID |
| recordId | 数値 | レコードID |
| record | オブジェクト | 削除対象のレコードデータ |

**returnで制御可能**: `false`で削除キャンセル、画面上部エラー表示、Promise対応

### app.record.detail.process.proceed

プロセス管理でアクションを実行するときのイベント。

| 項目 | 値 |
|---|---|
| PC | `app.record.detail.process.proceed` |
| モバイル | `mobile.app.record.detail.process.proceed` |
| 発火タイミング | プロセス管理でアクションを実行する前 |

**eventオブジェクトのプロパティ**:

| プロパティ | 型 | 説明 |
|---|---|---|
| type | 文字列 | イベントタイプ |
| record | オブジェクト | アクション実行時のレコードデータ |
| action | オブジェクト | `{ "value": "アクション名" }` |
| status | オブジェクト | `{ "value": "現在のステータス名" }` |
| nextStatus | オブジェクト | `{ "value": "変更後のステータス名" }` |

**returnで制御可能**: `false`で実行キャンセル、エラー表示、Promise対応。何もreturnしない場合はステータスのみが更新される。

## 1.5 レコード追加画面イベント

### app.record.create.show

レコード追加画面を表示した後のイベント。

| 項目 | 値 |
|---|---|
| PC | `app.record.create.show` |
| モバイル | `mobile.app.record.create.show` |
| 発火タイミング | レコード追加画面または再利用画面を表示したとき |

**eventオブジェクトのプロパティ**:

| プロパティ | 型 | 説明 |
|---|---|---|
| type | 文字列 | イベントタイプ |
| appId | 数値 | アプリID |
| record | オブジェクト | レコード追加画面のレコードデータ |
| reuse | 真偽値 | `true`: 再利用、`false`: 新規作成 |

**returnで制御可能**: フィールド値の上書き、フィールドの編集可否制御、エラー表示、ルックアップ自動取得/クリア、Promise対応

### app.record.create.change.{フィールドコード}

レコード追加画面でフィールドの値を変更したときのイベント。

| 項目 | 値 |
|---|---|
| PC | `app.record.create.change.フィールドコード` |
| モバイル | `mobile.app.record.create.change.フィールドコード` |
| 発火タイミング | フィールド値変更時、アプリアクション実行後の変更時、レコードに値をセットするAPIでの書き換え時 |

**対象フィールドタイプ**: ラジオボタン、ドロップダウン、チェックボックス、複数選択、ユーザー選択、組織選択、グループ選択、日付、時刻、日時、文字列1行、数値、テーブル

**eventオブジェクトのプロパティ**:

| プロパティ | 型 | 説明 |
|---|---|---|
| type | 文字列 | イベントタイプ |
| appId | 数値 | アプリID |
| record | オブジェクト | 変更後のレコードデータ |
| changes.field | オブジェクト | 変更したフィールドのデータ |
| changes.row | オブジェクト | テーブル行データ（テーブル行追加時は行データ、削除時はnull） |

**returnで制御可能**: フィールド値の書き換え、編集可/不可設定、エラー表示、ルックアップ自動取得/クリア

### app.record.create.submit

レコード追加画面で保存するときのイベント。

| 項目 | 値 |
|---|---|
| PC | `app.record.create.submit` |
| モバイル | `mobile.app.record.create.submit` |
| 発火タイミング | 保存ボタンクリック時（サーバー保存前） |

**eventオブジェクトのプロパティ**:

| プロパティ | 型 | 説明 |
|---|---|---|
| type | 文字列 | イベントタイプ |
| appId | 数値 | アプリID |
| record | オブジェクト | 保存前のレコードデータ |

**returnで制御可能**: `false`で保存キャンセル、フィールド値の書き換え、エラー表示、Promise対応

**制限**: 添付ファイルフィールドの情報は取得不可

### app.record.create.submit.success

レコード追加画面で保存に成功した後のイベント。

| 項目 | 値 |
|---|---|
| PC | `app.record.create.submit.success` |
| モバイル | `mobile.app.record.create.submit.success` |
| 発火タイミング | サーバーへの保存が成功したとき |

**eventオブジェクトのプロパティ**:

| プロパティ | 型 | 説明 |
|---|---|---|
| type | 文字列 | イベントタイプ |
| appId | 数値 | アプリID |
| recordId | 文字列 | レコードID |
| record | オブジェクト | 保存されたレコードデータ（閲覧権限なしの場合はnull） |

**returnで制御可能**: 指定URLへの遷移、Promise対応

## 1.6 レコード編集画面イベント

### app.record.edit.show

レコード編集画面を表示した後のイベント。

| 項目 | 値 |
|---|---|
| PC | `app.record.edit.show` |
| モバイル | `mobile.app.record.edit.show` |
| 発火タイミング | レコード編集画面を表示したとき |

**eventオブジェクトのプロパティ**:

| プロパティ | 型 | 説明 |
|---|---|---|
| type | 文字列 | イベントタイプ |
| appId | 数値 | アプリID |
| recordId | 数値 | レコードID |
| record | オブジェクト | レコード編集画面の表示前のレコードデータ |

**returnで制御可能**: フィールド値の書き換え、編集可/不可設定、エラー表示、ルックアップ自動取得/クリア、Promise対応

**制限**: モバイル環境では添付ファイルフィールド情報の取得不可

### app.record.edit.change.{フィールドコード}

レコード編集画面でフィールドの値を変更したときのイベント。

| 項目 | 値 |
|---|---|
| PC | `app.record.edit.change.フィールドコード` |
| モバイル | `mobile.app.record.edit.change.フィールドコード` |
| 発火タイミング | フィールド値変更時、レコードに値をセットするAPIでの書き換え時 |

**eventオブジェクトのプロパティ**:

| プロパティ | 型 | 説明 |
|---|---|---|
| type | 文字列 | イベントタイプ |
| appId | 数値 | アプリID |
| recordId | 数値 | レコードID |
| record | オブジェクト | 変更後のレコード全体データ |
| changes.field | オブジェクト | 変更されたフィールドのデータ |
| changes.row | オブジェクト | テーブル行データ（行追加時は行データ、削除時はnull） |

**returnで制御可能**: フィールド値の上書き、編集可/不可設定、エラー表示、ルックアップ自動取得/クリア

### app.record.edit.submit

レコード編集画面で保存するときのイベント。

| 項目 | 値 |
|---|---|
| PC | `app.record.edit.submit` |
| モバイル | `mobile.app.record.edit.submit` |
| 発火タイミング | 保存ボタンクリック時（サーバー保存前） |

**eventオブジェクトのプロパティ**:

| プロパティ | 型 | 説明 |
|---|---|---|
| type | 文字列 | イベントタイプ |
| appId | 数値 | アプリID |
| recordId | 数値 | レコードID |
| record | オブジェクト | 保存前のレコードデータ |

**returnで制御可能**: `false`で保存キャンセル、フィールド値の書き換え、エラー表示、Promise対応

**制限**: 添付ファイルフィールドの情報は取得不可

### app.record.edit.submit.success

レコード編集画面で保存に成功した後のイベント。

| 項目 | 値 |
|---|---|
| PC | `app.record.edit.submit.success` |
| モバイル | `mobile.app.record.edit.submit.success` |
| 発火タイミング | サーバーへの保存が成功したとき |

**eventオブジェクトのプロパティ**:

| プロパティ | 型 | 説明 |
|---|---|---|
| type | 文字列 | イベントタイプ |
| appId | 数値 | アプリID |
| recordId | 文字列 | レコードID |
| record | オブジェクト | 保存したレコードデータ |

**returnで制御可能**: 指定URLへの遷移、Promise対応

## 1.7 印刷画面イベント

### app.record.print.show

レコード印刷画面を表示した後のイベント。**PCのみ**。

| 項目 | 値 |
|---|---|
| PC | `app.record.print.show` |
| 発火タイミング | レコード印刷画面を表示したとき |

**eventオブジェクトのプロパティ**:

| プロパティ | 型 | 説明 |
|---|---|---|
| type | 文字列 | `app.record.print.show` |
| appId | 数値 | アプリID |
| recordId | 数値 | レコードID |
| record | オブジェクト | レコードデータ |

**returnで制御可能**: Promise対応

## 1.8 グラフ画面イベント

### app.report.show

グラフ画面を表示した後のイベント。

| 項目 | 値 |
|---|---|
| PC | `app.report.show` |
| モバイル | `mobile.app.report.show` |
| 発火タイミング | グラフ画面を表示したとき |

**eventオブジェクトのプロパティ**:

| プロパティ | 型 | 説明 |
|---|---|---|
| type | 文字列 | イベントタイプ |
| appId | 数値 | アプリID |

**制限**: スペースに貼り付けたアプリでは利用不可

## 1.9 ポータル画面イベント

### portal.show

ポータル画面を表示した後のイベント。

| 項目 | 値 |
|---|---|
| PC | `portal.show` |
| モバイル | `mobile.portal.show` |
| 発火タイミング | 表示対象のウィジェットがすべて描画された後 |

**eventオブジェクトのプロパティ**:

| プロパティ | 型 | 説明 |
|---|---|---|
| type | 文字列 | イベントタイプ |

**制限**: ゲストユーザーのポータル画面では発生しない。2ページ目以降のポータル画面では発生しない。

## 1.10 スペース画面イベント

### space.portal.show

スペースのポータル画面を表示した後のイベント。

| 項目 | 値 |
|---|---|
| PC | `space.portal.show` |
| モバイル | `mobile.space.portal.show` |
| 発火タイミング | 表示対象のウィジェットがすべて描画された後 |

**eventオブジェクトのプロパティ**:

| プロパティ | 型 | 説明 |
|---|---|---|
| type | 文字列 | イベントタイプ |
| spaceId | 文字列 | スペースID |

**制限**: 「スペースのポータルと複数のスレッドを使用する」機能が有効なスペースのみ。ゲストスペースでは発生しない。
