# フィールド制御

## 5.1 openDesk.app.record.setFieldShown()

フィールドの表示/非表示を切り替えます。

```javascript
// PC
openDesk.app.record.setFieldShown(fieldCode, isShown)
// モバイル
openDesk.mobile.app.record.setFieldShown(fieldCode, isShown)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| fieldCode | 文字列 | ○ | フィールドコードまたは要素ID |
| isShown | 真偽値 | ○ | `true`: 表示、`false`: 非表示 |

**戻り値**: なし

**使用可能画面（PC）**: レコード詳細、追加、編集、印刷画面

**使用可能画面（モバイル）**: レコード詳細、追加、編集画面

**制限**: モバイルでは罫線の表示/非表示切り替え不可

```javascript
openDesk.app.record.setFieldShown('fieldCode', false); // 非表示
openDesk.app.record.setFieldShown('fieldCode', true);  // 表示
```

## 5.2 openDesk.app.record.setGroupFieldOpen()

グループフィールドを開閉します。

```javascript
// PC
openDesk.app.record.setGroupFieldOpen(fieldCode, isOpen)
// モバイル
openDesk.mobile.app.record.setGroupFieldOpen(fieldCode, isOpen)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| fieldCode | 文字列 | ○ | グループフィールドのフィールドコード |
| isOpen | 真偽値 | ○ | `true`: 開く、`false`: 閉じる |

**戻り値**: なし

**使用可能画面（PC）**: レコード詳細、追加、編集、印刷画面

**使用可能画面（モバイル）**: レコード詳細、追加、編集画面

## 5.3 openDesk.app.record.setFieldStyle()

フィールドのスタイルを設定します。

```javascript
// PC
openDesk.app.record.setFieldStyle(fieldCode, config)
// モバイル
openDesk.mobile.app.record.setFieldStyle(fieldCode, config)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| fieldCode | 文字列 | ○ | フィールドコード |
| config | オブジェクト/文字列 | ○ | スタイル設定。`"DEFAULT"`でリセット |

**configオブジェクトの構造**:

```javascript
{
  content: {
    backgroundColor: '#95d542',  // 背景色（16進数6桁）
    color: '#000000',            // 文字色
    fontWeight: 'bold',          // 'normal' | 'bold'
    textDecoration: 'underline', // 'none' | 'underline' | 'line-through'
    borderColor: '#ff8f00'       // 枠線色
  },
  background: {
    backgroundColor: '#ffbf00'   // フィールド背景色
  },
  label: {
    color: '#ff4949',            // フィールド名文字色
    fontWeight: 'bold',          // 'normal' | 'bold'
    textDecoration: 'underline'  // 'none' | 'underline' | 'line-through'
  }
}
```

**戻り値**: Promiseオブジェクト（解決時に値なし）

**使用可能画面**: レコード追加画面、レコード編集画面

**非対応フィールド**: ステータス、作業者、テーブル、関連レコード一覧、グループ、罫線、ラベル、スペース

```javascript
await openDesk.app.record.setFieldStyle('文字列__1行_', {
  content: { backgroundColor: '#95d542', fontWeight: 'bold' },
  background: { backgroundColor: '#ffbf00' },
  label: { color: '#ff4949', textDecoration: 'underline' }
});

// リセット
await openDesk.app.record.setFieldStyle('文字列__1行_', 'DEFAULT');
```

## 5.4 openDesk.app.record.getFieldStyle()

フィールドのスタイルを取得します。

```javascript
// PC
openDesk.app.record.getFieldStyle(fieldCode)
// モバイル
openDesk.mobile.app.record.getFieldStyle(fieldCode)
```

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| fieldCode | 文字列 | ○ | フィールドコード |

**戻り値**: Promiseオブジェクト。解決時にスタイル情報オブジェクト（`setFieldStyle`と同構造、未設定のプロパティは`"DEFAULT"`）。

**使用可能画面**: レコード追加画面、レコード編集画面
