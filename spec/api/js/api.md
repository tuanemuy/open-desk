# API実行メソッド

## 2.1 openDesk.api()

OpenDesk REST APIリクエストを送信します。

```javascript
openDesk.api(pathOrUrl, method, params, successCallback, failureCallback)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| pathOrUrl | 文字列 | ○ | APIのパスまたはURL（例: `/k/v1/records.json`、末尾の`.json`は省略可） |
| method | 文字列 | ○ | HTTPメソッド（`GET`、`POST`、`PUT`、`DELETE`） |
| params | オブジェクト | ○ | APIのリクエストパラメーター |
| successCallback | 関数 | × | 成功時コールバック。省略時はPromiseを返す |
| failureCallback | 関数 | × | 失敗時コールバック。省略時はPromiseで棄却 |

**戻り値**: コールバック指定時は戻り値なし。省略時はPromiseオブジェクト。

**使用可能画面**: 全体カスタマイズ適用画面、プラグイン設定画面

```javascript
// コールバック方式
openDesk.api('/k/v1/record.json', 'GET', { app: 1, id: 1 },
  (resp) => { console.log(resp); },
  (error) => { console.log(error); }
);

// async/await方式
const resp = await openDesk.api('/k/v1/record.json', 'GET', { app: 1, id: 1 });
console.log(resp);
```

## 2.2 openDesk.api.url()

APIのURLを取得します。

```javascript
openDesk.api.url(path, isGuestSpace)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| path | 文字列 | ○ | APIのパス（ベースURL省略、例: `/k/v1/records.json`） |
| isGuestSpace | 真偽値 | × | ゲストスペース用URL取得（デフォルト: `false`） |

**戻り値**: 文字列（ベースURLを含む完全なAPIのURL）

**制限**: 末尾が`.json`以外のAPIでは利用不可

## 2.3 openDesk.api.urlForGet()

クエリ文字列付きのAPIのURLを取得します。

```javascript
openDesk.api.urlForGet(path, params, isGuestSpace)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| path | 文字列 | ○ | APIのパス（末尾の`.json`は自動付与） |
| params | オブジェクト | × | APIリクエストパラメーター |
| isGuestSpace | 真偽値 | × | ゲストスペース用URL取得（デフォルト: `false`） |

**戻り値**: 文字列（クエリ文字列付きのURL、パラメーターはURLエンコード済み）

```javascript
const params = { app: 4, fields: ['recordId'] };
openDesk.api.urlForGet('/k/v1/records.json', params, false);
// => https://sample.cybozu.com/k/v1/records.json?app=4&fields[0]=recordId
```

**制限**: ファイルアップロードAPIおよび末尾が`.json`以外のUser APIでは利用不可

## 2.4 openDesk.getRequestToken()

CSRFトークンを取得します。

```javascript
openDesk.getRequestToken()
```

**パラメータ**: なし

**戻り値**: 文字列（CSRFトークン、有効期間は最終アクセスから86,400秒）

**使用可能画面**: 全体カスタマイズ適用画面、プラグイン設定画面

**使用が必要な場面**: Fetch APIやXMLHttpRequestでREST APIを実行する場合のPOST/PUT/DELETEメソッド

```javascript
const csrfToken = openDesk.getRequestToken();
const formData = new FormData();
formData.append('__REQUEST_TOKEN__', csrfToken);
formData.append('file', blob, 'test.txt');

const resp = await fetch('/k/v1/file.json', {
  method: 'POST',
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
  body: formData,
});
```

## 2.5 openDesk.api.getConcurrencyLimit()

OpenDesk REST APIの同時接続数を取得します。

```javascript
openDesk.api.getConcurrencyLimit()
```

**パラメータ**: なし

**戻り値**: Promiseオブジェクト。解決時に以下のオブジェクトを返す。

| プロパティ | 型 | 説明 |
|---|---|---|
| limit | 数値 | 同時接続数の上限値 |
| running | 数値 | 現在の同時接続数 |

```javascript
const result = await openDesk.api.getConcurrencyLimit();
console.log(`上限値: ${result.limit}, 現在: ${result.running}`);
```

---

## 3.1 openDesk.proxy()

外部のAPIを実行します。クロスドメイン制約を回避してリクエストを送信できます。

```javascript
openDesk.proxy(url, method, headers, data, successCallback, failureCallback)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| url | 文字列 | ○ | 実行するAPIのURL |
| method | 文字列 | ○ | HTTPメソッド（`GET`/`POST`/`PUT`/`DELETE`） |
| headers | オブジェクト | ○ | リクエストヘッダー（空の場合は`{}`） |
| data | オブジェクト/文字列 | ○ | リクエストボディ（POST/PUTのみ送信） |
| successCallback | 関数 | × | 成功時コールバック `(body, status, headers) => {}` |
| failureCallback | 関数 | × | 失敗時コールバック `(error) => {}` |

**戻り値**: コールバック指定時は戻り値なし。省略時はPromiseオブジェクト。

**制限**: レスポンスボディ上限10MB、レスポンスヘッダー100行（1行8,180bytes）、バイナリデータ取得不可、自己証明書通信不可

```javascript
// async/await方式
const [body, status, headers] = await openDesk.proxy(
  'https://api.example.com', 'GET', {}, {}
);
console.log(status, body, headers);
```

## 3.2 openDesk.proxy.upload()

外部にファイルをアップロードします。

```javascript
openDesk.proxy.upload(url, method, headers, data, successCallback, failureCallback)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| url | 文字列 | ○ | リクエストURL |
| method | 文字列 | ○ | `POST` または `PUT` |
| headers | オブジェクト | ○ | リクエストヘッダー |
| data | オブジェクト | ○ | アップロードファイルデータ |
| data.format | 文字列 | ○ | `RAW`のみ指定可能 |
| data.value | Blob/File | ○ | アップロードファイル（最大200MB） |
| successCallback | 関数 | × | 成功時コールバック |
| failureCallback | 関数 | × | 失敗時コールバック |

**戻り値**: コールバック指定時は戻り値なし。省略時はPromise（配列 `[body, status, headers]` で解決）

**制限**: レスポンスボディ上限10MB、レスポンスヘッダー100行（1行8,180bytes）、Content-LengthとTransfer-Encodingは自動付与

```javascript
const blob = new Blob(['テストファイルです'], { type: 'text/plain' });
const data = { format: 'RAW', value: blob };

const resp = await openDesk.proxy.upload('https://api.example.com', 'POST', {}, data);
console.log(resp);
```
