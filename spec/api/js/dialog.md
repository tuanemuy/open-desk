# ダイアログ・通知・ユーティリティ

## 8.1 openDesk.showConfirmDialog()

確認ダイアログを表示します。**PCのみ**。

```javascript
openDesk.showConfirmDialog(config)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| config | オブジェクト | ○ | ダイアログ設定 |
| config.title | 文字列 | × | タイトル（省略時は非表示） |
| config.body | 文字列 | × | 本文テキスト（`\n`で改行） |
| config.showOkButton | 真偽値 | × | OKボタン表示（デフォルト: `true`） |
| config.okButtonText | 文字列 | × | OKボタンテキスト（省略時はユーザー言語に従う） |
| config.showCancelButton | 真偽値 | × | キャンセルボタン表示（デフォルト: `false`） |
| config.cancelButtonText | 文字列 | × | キャンセルボタンテキスト |
| config.showCloseButton | 真偽値 | × | 閉じるボタン表示（非表示時はEscキーも無効） |

**戻り値**: `Promise<string>`。解決値: `"OK"` / `"CANCEL"` / `"CLOSE"`

**使用可能画面**: 全体カスタマイズ適用画面（検索画面・アプリストア除外）

```javascript
const result = await openDesk.showConfirmDialog({
  title: '確認',
  body: 'このレコードを削除しますか？',
  showOkButton: true,
  showCancelButton: true,
  okButtonText: '削除',
  cancelButtonText: 'キャンセル',
  showCloseButton: true
});

if (result === 'OK') {
  console.log('削除を実行します');
}
```

## 8.2 openDesk.createDialog()

カスタムダイアログを作成します。**PCのみ**。

```javascript
openDesk.createDialog(config)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| config | オブジェクト | ○ | ダイアログ設定 |
| config.title | 文字列 | × | タイトル（省略時は非表示） |
| config.body | Element | × | 本文要素（DOM Element） |
| config.showOkButton | 真偽値 | × | OKボタン表示（デフォルト: `true`） |
| config.okButtonText | 文字列 | × | OKボタンテキスト |
| config.showCancelButton | 真偽値 | × | キャンセルボタン表示（デフォルト: `false`） |
| config.cancelButtonText | 文字列 | × | キャンセルボタンテキスト |
| config.showCloseButton | 真偽値 | × | 閉じるボタン表示（デフォルト: `false`） |
| config.beforeClose | 関数 | × | 閉じる前に実行されるコールバック（引数: `"OK"`/`"CANCEL"`/`"CLOSE"`） |

**戻り値**: Promiseオブジェクト。解決時に以下のメソッドを持つオブジェクト:

| メソッド | 説明 |
|---|---|
| show() | ダイアログを表示（Promiseを返す。解決値: `"OK"`/`"CANCEL"`/`"CLOSE"`/`"FUNCTION"`） |
| close() | ダイアログを閉じる |

**使用可能画面**: 全体カスタマイズ適用画面（検索画面・アプリストア除外）

```javascript
const wrapper = document.createElement('div');
const input = document.createElement('input');
input.type = 'text';
wrapper.appendChild(input);

const dialog = await openDesk.createDialog({
  title: 'フィードバック送信',
  body: wrapper,
  okButtonText: '送信',
  showCancelButton: true,
  showCloseButton: true,
  beforeClose: (action) => {
    if (action === 'OK') {
      console.log('送信:', input.value);
    }
  }
});

const result = await dialog.show();
```

## 8.3 openDesk.showNotification()

画面上部にメッセージを表示します。

```javascript
// PC
openDesk.showNotification(type, message)
// モバイル
openDesk.mobile.showNotification(type, message)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| type | 文字列 | ○ | `ERROR`（赤）、`SUCCESS`（緑）、`INFO`（青） |
| message | 文字列 | ○ | 通知メッセージテキスト |

**戻り値**: Promiseオブジェクト（解決時に値なし）

**使用可能画面（PC）**: 全体カスタマイズ適用画面（検索画面・アプリストア除外）

**使用可能画面（モバイル）**: 全体カスタマイズ適用画面

**注意**: メッセージは自動的に消えない。同時に1つしか表示できず、最後に呼び出したものが表示される。

```javascript
openDesk.showNotification('SUCCESS', 'データが正常に保存されました。');
openDesk.showNotification('ERROR', 'データの保存に失敗しました。');
openDesk.showNotification('INFO', '処理を開始しました。');
```

## 8.4 openDesk.showLoading()

ローディング表示の表示/非表示を切り替えます。

```javascript
// PC
openDesk.showLoading(state)
// モバイル
openDesk.mobile.showLoading(state)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| state | 文字列 | ○ | `VISIBLE`（表示）/ `HIDDEN`（非表示） |

**戻り値**: Promiseオブジェクト（解決時に値なし）

**使用可能画面（PC）**: 全体カスタマイズ適用画面（検索画面・アプリストア除外）

**使用可能画面（モバイル）**: 全体カスタマイズ適用画面

**注意**: ローディング表示中はユーザーの画面操作が不可。カスタマイズで同時に表示可能なローディングは1つのみ（OpenDesk本体のローディングとは独立）。

```javascript
openDesk.showLoading('VISIBLE');
// 処理実行
await someAsyncProcess();
openDesk.showLoading('HIDDEN');
```

---

## 9.1 openDesk.buildPageUrl()

OpenDesk内の画面のURLを組み立てます。

```javascript
openDesk.buildPageUrl(page, params)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| page | 文字列 | ○ | 画面タイプ（`APP_INDEX`、`APP_CREATE`等） |
| params | オブジェクト | ○ | URL組み立て用パラメーター |
| params.appId | 文字列 | 条件付き | アプリの各画面で必須 |
| params.recordId | 文字列 | 条件付き | レコード詳細/編集/印刷画面で必須 |
| params.viewId | 文字列 | × | 一覧ID |
| params.reportId | 文字列 | 条件付き | グラフ画面で必須 |
| params.spaceId | 文字列 | 条件付き | スペース画面で必須 |
| params.threadId | 文字列 | 条件付き | スレッドID |
| params.userCode | 文字列 | 条件付き | ユーザーコード |

**戻り値**: Promiseオブジェクト（文字列型の画面URL）

**対応画面タイプ**: アプリ系（APP_INDEX, APP_CREATE等）、ポータル、スペース、ピープル、メッセージ、検索、通知、アプリストア等

**注意**: 実行時にサーバーからデータを取得しキャッシュする。ユーザーごとに1分当たり50回を超えるとPromiseが拒否される。

## 9.2 openDesk.setKeyboardShortcuts()

ショートカットキーの有効/無効を切り替えます。

```javascript
openDesk.setKeyboardShortcuts(config)
```

| パラメータ | 型 | 説明 |
|---|---|---|
| config | 真偽値 | `true`: 全有効、`false`: 全無効 |
| config | オブジェクト | 個別のショートカットを有効/無効に設定 |

**画面ごとのショートカット名**:

| 画面 | ショートカット名 |
|---|---|
| レコード一覧 | `SHOW_RECORD`, `FOCUS_SEARCH_BOX`, `SHORTCUTS_HELP`, `CREATE_RECORD`, `EDIT_RECORD`, `NEXT_RECORD`, `PREVIOUS_RECORD`, `NEXT_PAGE`, `PREVIOUS_PAGE` |
| レコード詳細/編集 | `FOCUS_SEARCH_BOX`, `CANCEL_EDITING`, `SHORTCUTS_HELP`, `CREATE_RECORD`, `EDIT_RECORD`, `SHOW_VIEW`, `SHOW_FILTER`, `NEXT_RECORD`, `PREVIOUS_RECORD`, `SAVE_RECORD` |
| レコード追加/再利用 | `FOCUS_SEARCH_BOX`, `SHORTCUTS_HELP`, `SAVE_RECORD` |

**戻り値**: Promiseオブジェクト（解決時に値なし）

```javascript
// 全てのショートカットを無効化
openDesk.setKeyboardShortcuts(false);

// 個別に設定
openDesk.setKeyboardShortcuts({
  SAVE_RECORD: true,
  CANCEL_EDITING: false
});
```

## 9.3 openDesk.getKeyboardShortcuts()

ショートカットキーの有効/無効の状態を取得します。

```javascript
openDesk.getKeyboardShortcuts()
```

**パラメータ**: なし

**戻り値**: Promiseオブジェクト。解決時にショートカット名と状態（`true`/`false`）のオブジェクト。

**使用可能画面**: レコード一覧、詳細、編集、追加画面

```javascript
const shortcuts = await openDesk.getKeyboardShortcuts();
console.log(shortcuts);
// { SAVE_RECORD: true, CANCEL_EDITING: false, ... }
```
