# プラグインAPI

## 10.1 openDesk.plugin.app.getConfig()

プラグインの設定情報を取得します。

```javascript
openDesk.plugin.app.getConfig(pluginId)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| pluginId | 文字列 | ○ | プラグインID |

**戻り値**: キーバリューペアのオブジェクト。対応外画面では`null`。

**使用可能画面（PC）**: レコード一覧、詳細、追加、編集、印刷、グラフ画面、プラグイン設定画面

**使用可能画面（モバイル）**: レコード一覧、詳細、追加、編集画面

## 10.2 openDesk.plugin.app.setConfig()

プラグインの設定情報を保存します。

```javascript
openDesk.plugin.app.setConfig(config, successCallback)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| config | オブジェクト | ○ | 設定オブジェクト（キーはASCII文字、値は文字列） |
| successCallback | 関数 | × | 保存完了時コールバック（省略時はプラグイン一覧画面に遷移） |

**戻り値**: なし

**使用可能画面**: プラグイン設定画面

**制限**: 値ごとの最大文字数65,535、プラグインごとの合計データサイズ上限256KB

```javascript
const config = { key1: 'value1', key2: 'value2' };
await new Promise((resolve) => {
  openDesk.plugin.app.setConfig(config, () => { resolve(); });
});
```

## 10.3 openDesk.plugin.app.getProxyConfig()

外部APIの実行に必要な情報を取得します。

```javascript
openDesk.plugin.app.getProxyConfig(url, method)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| url | 文字列 | ○ | 実行するAPIのURL |
| method | 文字列 | ○ | HTTPメソッド（`GET`/`POST`/`PUT`/`DELETE`） |

**戻り値**: `{ headers: Object, data: Object }`。一致する設定がない/対応外画面では`null`。

**注意**: 取得した値は常に文字列型（数値や真偽値も文字列化される）

## 10.4 openDesk.plugin.app.setProxyConfig()

外部APIの実行に必要な情報をプラグインへ保存します。

```javascript
openDesk.plugin.app.setProxyConfig(url, method, headers, data, successCallback)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| url | 文字列 | ○ | 実行するAPIのURL |
| method | 文字列 | ○ | HTTPメソッド（`GET`/`POST`/`PUT`/`DELETE`） |
| headers | オブジェクト | ○ | リクエストヘッダー（重複時はこちらが優先） |
| data | オブジェクト | ○ | リクエストボディ（プロパティ値にオブジェクト形式は不可） |
| successCallback | 関数 | × | 保存完了時コールバック（省略時は設定完了画面に遷移） |

**戻り値**: なし

**使用可能画面**: プラグイン設定画面（アプリ管理者のみ）

## 10.5 openDesk.plugin.app.proxy()

プラグインから外部APIを実行します。

```javascript
openDesk.plugin.app.proxy(pluginId, url, method, headers, data, successCallback, failureCallback)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| pluginId | 文字列 | ○ | プラグインID |
| url | 文字列 | ○ | APIのURL |
| method | 文字列 | ○ | HTTPメソッド（`GET`/`POST`/`PUT`/`DELETE`） |
| headers | オブジェクト | ○ | リクエストヘッダー（空の場合は`{}`） |
| data | オブジェクト/文字列 | ○ | リクエストボディ（POST/PUTのみ） |
| successCallback | 関数 | × | 成功時コールバック `(body, status, headers) => {}` |
| failureCallback | 関数 | × | 失敗時コールバック `(error) => {}` |

**戻り値**: コールバック指定時は戻り値なし。省略時はPromiseオブジェクト。

**使用可能画面（PC）**: レコード一覧、詳細、追加、編集、印刷、グラフ画面

**使用可能画面（モバイル）**: レコード一覧、詳細、追加、編集、グラフ画面

```javascript
const resp = await openDesk.plugin.app.proxy(
  'mjjfipoklghomcgafnajfibfgllhpocm',
  'https://api.example.com', 'GET', {}, {}
);
console.log(resp);
```

## 10.6 openDesk.plugin.app.proxy.upload()

プラグインから外部にファイルをアップロードします。

```javascript
openDesk.plugin.app.proxy.upload(pluginId, url, method, headers, data, successCallback, failureCallback)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| pluginId | 文字列 | ○ | プラグインID |
| url | 文字列 | ○ | リクエストURL |
| method | 文字列 | ○ | `POST` または `PUT` |
| headers | オブジェクト | ○ | リクエストヘッダー |
| data | オブジェクト | ○ | `{ format: 'RAW', value: Blob/File }` |
| successCallback | 関数 | × | 成功時コールバック |
| failureCallback | 関数 | × | 失敗時コールバック |

**戻り値**: コールバック指定時は戻り値なし。省略時はPromise（配列 `[body, status, headers]` で解決）

**使用可能画面（PC）**: レコード一覧、詳細、追加、編集、印刷、グラフ画面

**使用可能画面（モバイル）**: レコード一覧、詳細、追加、編集画面
