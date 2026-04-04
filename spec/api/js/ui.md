# UI要素制御・要素取得

## 6.1 openDesk.app.showAddRecordButton()

レコード追加ボタンの表示/非表示を切り替えます。

```javascript
// PC
openDesk.app.showAddRecordButton(state)
// モバイル
openDesk.mobile.app.showAddRecordButton(state)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| state | 文字列 | ○ | `VISIBLE`（表示）/ `HIDDEN`（非表示） |

**戻り値**: Promiseオブジェクト（解決時に値なし）

**使用可能画面（PC）**: レコード一覧、レコード詳細、グラフ画面

**使用可能画面（モバイル）**: レコード一覧画面

## 6.2 openDesk.app.showReportButton()

集計ボタンの表示/非表示を切り替えます。**PCのみ**。

```javascript
openDesk.app.showReportButton(state)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| state | 文字列 | ○ | `VISIBLE`（表示）/ `HIDDEN`（非表示） |

**戻り値**: Promiseオブジェクト（解決時に値なし）

**使用可能画面**: レコード一覧画面、グラフ画面

---

## 7.1 openDesk.app.record.getFieldElement()

フィールド要素を取得します。

```javascript
// PC
openDesk.app.record.getFieldElement(fieldCode)
// モバイル
openDesk.mobile.app.record.getFieldElement(fieldCode)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| fieldCode | 文字列 | ○ | フィールドコード |

**戻り値**: Elementオブジェクト。ステータス/作業者/テーブル内/関連レコード一覧フィールド等では`null`。

**使用可能画面（PC）**: レコード詳細画面、レコード印刷画面

**使用可能画面（モバイル）**: レコード詳細画面

**注意**: 取得したDOMの内部構造を変更すると、OpenDeskのバージョンアップ後に動作しなくなる可能性あり。

```javascript
const element = openDesk.app.record.getFieldElement('文字列_0');
element.style.color = 'red';
```

## 7.2 openDesk.app.record.getSpaceElement()

スペースフィールドの要素を取得します。

```javascript
// PC
openDesk.app.record.getSpaceElement(id)
// モバイル
openDesk.mobile.app.record.getSpaceElement(id)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| id | 文字列 | ○ | スペースフィールドの要素ID |

**戻り値**: Elementオブジェクト。指定IDが存在しない/対応外画面では`null`。

**使用可能画面（PC）**: レコード詳細、追加、編集、印刷画面

**使用可能画面（モバイル）**: レコード詳細、追加、編集画面

```javascript
const divElement = document.createElement('div');
divElement.textContent = 'Hello World';
const element = openDesk.app.record.getSpaceElement('Space_0');
element.appendChild(divElement);
```

## 7.3 openDesk.app.record.getHeaderMenuSpaceElement()

レコード画面のメニュー上側の要素を取得します。**PCのみ**。

```javascript
openDesk.app.record.getHeaderMenuSpaceElement()
```

**パラメータ**: なし

**戻り値**: Elementオブジェクト（パンくずリストとレコード操作メニューの間の要素）。対応外画面では`null`。

**使用可能画面**: レコード詳細、追加、編集画面

## 7.4 openDesk.app.getHeaderMenuSpaceElement()

レコード一覧画面のメニュー右側の要素を取得します。**PCのみ**。

```javascript
openDesk.app.getHeaderMenuSpaceElement()
```

**パラメータ**: なし

**戻り値**: Elementオブジェクト（集計アイコンの右側の要素）。対応外画面では`null`。

**使用可能画面**: レコード一覧画面

```javascript
openDesk.events.on('app.record.index.show', (event) => {
  const menuElement = openDesk.app.getHeaderMenuSpaceElement();
  const button = document.createElement('button');
  button.textContent = 'カスタムボタン';
  menuElement.appendChild(button);
});
```

## 7.5 openDesk.app.getFieldElements()

レコード一覧のフィールド要素を取得します。

```javascript
// PC
openDesk.app.getFieldElements(fieldCode)
// モバイル
openDesk.mobile.app.getFieldElements(fieldCode)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| fieldCode | 文字列 | ○ | フィールドコード |

**戻り値**: 配列（Elementオブジェクト）。レコードなしの場合は空配列。対応フィールドなし/テーブル指定/対応外画面では`null`。

**使用可能画面**: レコード一覧画面（表形式）

## 7.6 openDesk.mobile.app.getHeaderSpaceElement()

モバイルのヘッダーとコンテンツの間の要素を取得します。**モバイルのみ**。

```javascript
openDesk.mobile.app.getHeaderSpaceElement()
```

**パラメータ**: なし

**戻り値**: Elementオブジェクト。対応外画面では`null`。

**使用可能画面（モバイル）**: レコード一覧、詳細、追加、編集画面

```javascript
const divElement = document.createElement('div');
divElement.textContent = 'Hello World';
const element = openDesk.mobile.app.getHeaderSpaceElement();
element.appendChild(divElement);
```

## 7.7 ポータル画面の要素取得

### openDesk.portal.getContentSpaceElement()

ポータル画面の上側の要素を取得します。

```javascript
// PC
openDesk.portal.getContentSpaceElement()
// モバイル
openDesk.mobile.portal.getContentSpaceElement()
```

**パラメータ**: なし

**戻り値**: Elementオブジェクト。ゲストユーザー/2ページ目以降/対応外画面では`null`。

**使用可能画面**: ポータル画面

## 7.8 スペース画面の要素取得

### openDesk.space.portal.getContentSpaceElement()

スペースのポータル画面上側の要素を取得します。

```javascript
// PC
openDesk.space.portal.getContentSpaceElement()
// モバイル
openDesk.mobile.space.portal.getContentSpaceElement()
```

**パラメータ**: なし

**戻り値**: Elementオブジェクト。ゲストスペース/対応外画面では`null`。

**使用可能画面**: スペースのポータル画面

**制限**: 「スペースのポータルと複数のスレッドを使用する」が有効なスペースのみ

```javascript
const divElement = document.createElement('div');
divElement.textContent = 'Hello World';
const element = openDesk.space.portal.getContentSpaceElement();
element.appendChild(divElement);
```
