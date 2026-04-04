# 情報取得メソッド

## 4.1 レコード関連

### openDesk.app.record.get()

現在開いているレコードの値を取得します。

```javascript
// PC
openDesk.app.record.get()
// モバイル
openDesk.mobile.app.record.get()
```

**パラメータ**: なし

**戻り値**: `{ record: Object }` 形式のオブジェクト。対応外の画面では`null`。

**使用可能画面**: レコード詳細画面、レコード追加画面、レコード編集画面、レコード印刷画面（PC）

**制限**:
- 追加/編集画面では添付ファイル情報は空配列
- `openDesk.events.on()`のイベントハンドラー内では実行不可（eventオブジェクトから取得すること）

```javascript
document.getElementById('myButton').onclick = function() {
  const record = openDesk.app.record.get();
  console.log(record);
};
```

### openDesk.app.record.set(record)

現在開いているレコードに値をセットします。

```javascript
// PC
openDesk.app.record.set(record)
// モバイル
openDesk.mobile.app.record.set(record)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| record | オブジェクト | ○ | セットするレコードデータ（`openDesk.app.record.get()`の戻り値と同形式） |

**戻り値**: なし

**使用可能画面**: レコード追加画面、レコード編集画面

**実行可能な操作**: フィールド値の書き換え、編集可/不可設定、フィールドエラー指定、ルックアップ自動取得/クリア

**制限**:
- 添付ファイルフィールドの値は書き換え不可
- `openDesk.events.on()`のイベントハンドラー内では実行不可（eventオブジェクトをreturnすること）

## 4.2 アプリ関連

### openDesk.app.getId()

現在開いているアプリのIDを取得します。

```javascript
// PC
openDesk.app.getId()
// モバイル
openDesk.mobile.app.getId()
```

**パラメータ**: なし

**戻り値**: 数値（アプリID）。対応外の画面では`null`。

**使用可能画面（PC）**: レコード一覧、詳細、編集、追加、印刷、グラフ画面、プラグイン設定画面

**使用可能画面（モバイル）**: レコード一覧、詳細、編集、追加、グラフ画面

### openDesk.app.getQueryCondition()

レコード一覧の絞り込み条件をクエリ文字列として取得します。

```javascript
// PC
openDesk.app.getQueryCondition()
// モバイル
openDesk.mobile.app.getQueryCondition()
```

**パラメータ**: なし

**戻り値**: 文字列（クエリ文字列）。フィルター未適用時は空文字列。対応外の画面では`null`。

**使用可能画面**: レコード一覧画面、グラフ画面

**注意**: 表示件数（limit）、オフセット、ソート順は取得されない。削除済みのユーザーや選択肢を含むクエリではエラーが発生する。

### openDesk.app.getLookupTargetAppId(fieldCode)

ルックアップフィールドの参照先アプリIDを取得します。

```javascript
// PC
openDesk.app.getLookupTargetAppId(fieldCode)
// モバイル
openDesk.mobile.app.getLookupTargetAppId(fieldCode)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| fieldCode | 文字列 | ○ | ルックアップフィールドのフィールドコード |

**戻り値**: 数値（参照先アプリID）。フィールドが存在しない/閲覧権限なし/ルックアップフィールドでない場合は`null`。

**使用可能画面**: レコード一覧、追加、編集、詳細、印刷、グラフ画面、プラグイン設定画面

## 4.3 ユーザー関連

### openDesk.getLoginUser()

ログインユーザーの情報を取得します。

```javascript
openDesk.getLoginUser()
```

**パラメータ**: なし

**戻り値**:

| プロパティ | 型 | 説明 |
|---|---|---|
| id | 文字列 | システム自動採番のユーザーID |
| code | 文字列 | ログイン名（ゲストユーザーはメールアドレス） |
| name | 文字列 | 表示名 |
| email | 文字列 | メールアドレス |
| url | 文字列 | URL（ゲストユーザーは空文字列） |
| employeeNumber | 文字列 | 社員番号（ゲストユーザーは空文字列） |
| phone | 文字列 | 電話番号 |
| mobilePhone | 文字列 | 携帯電話番号（ゲストユーザーは空文字列） |
| extensionNumber | 文字列 | 内線番号（ゲストユーザーは空文字列） |
| timezone | 文字列 | タイムゾーン設定 |
| isGuest | 真偽値 | ゲストユーザーの場合`true` |
| language | 文字列 | ユーザー言語（`ja`, `en`, `zh`, `zh-TW`, `es`, `pt-BR`, `th`, `ms`） |

**使用可能画面**: 全体カスタマイズ適用画面、プラグイン設定画面

```javascript
const user = openDesk.getLoginUser();
console.log(user.name, user.email, user.isGuest);
```

## 4.4 環境判定

### openDesk.getUiVersion()

現在の画面のデザインバージョンを取得します。

```javascript
openDesk.getUiVersion()
```

**パラメータ**: なし

**戻り値**: 数値
- `1`: PCの旧デザインおよびモバイル
- `2`: PCの新デザイン

**使用可能画面**: 全体カスタマイズ適用画面、プラグイン設定画面
