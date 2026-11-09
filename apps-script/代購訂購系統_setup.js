/**
 * 一次性設定腳本：在既有代購試算表上擴充「訂購系統」所需的欄位與分頁。
 * 用法：開啟你的代購試算表 → 擴充功能 → Apps Script → 貼上這個檔案內容 → 執行 setupOrderSystem()
 * 重複執行不會重複建立或洗掉已填的資料。
 */
const HEADER_BG = '#2d4a6b';
const ORDER_STATUSES = ['待付款', '已付款', '已訂購', '已出貨', '完成', '取消'];

function setupOrderSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ===== 1. 定價試算：在最後面新增「商品介紹」「圖片網址」「分類」「商品備註」欄 =====
  const s1 = ss.getSheetByName('定價試算');
  if (!s1) throw new Error('找不到「定價試算」分頁，請確認是否為正確的代購試算表');

  ['商品介紹', '圖片網址', '分類', '商品備註'].forEach(function (title) {
    const lastCol = s1.getLastColumn();
    const headers = s1.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });
    let col = headers.indexOf(title) + 1;
    if (!col) {
      col = lastCol + 1;
      s1.getRange(1, col).setValue(title);
      s1.setColumnWidth(col, 240);
    }
    styleHeader(s1.getRange(1, col));
    if (title === '圖片網址') {
      s1.getRange(1, col).setNote('可以貼一般圖片網址，或 Google 雲端硬碟的分享連結（需設為「知道連結的任何人」都能查看）');
    }
    if (title === '分類') {
      s1.getRange(1, col).setNote('從下拉選單選，選項來自「分類」分頁；留空會歸到「其他」');
    }
    if (title === '商品備註') {
      s1.getRange(1, col).setNote('網頁上預設收起來，客人點了才會展開；選取文字按 ⌘K 可以加連結');
    }
  });

  // ===== 2. 新增「分類」分頁，並讓「定價試算」的分類欄變成下拉選單 =====
  let sCat = ss.getSheetByName('分類');
  if (!sCat) {
    sCat = ss.insertSheet('分類');
    sCat.getRange('A1:B1').setValues([['分類名稱', '顯示與否']]);
    styleHeader(sCat.getRange('A1:B1'));
    sCat.getRange(2, 1, 2, 2).setValues([['Pokemon', 'Ｏ'], ['Tower Records', 'Ｏ']]);
    sCat.getRange('D1').setValue(
      '說明：\n' +
      '・網頁主頁的分類順序 = 這裡由上到下的順序\n' +
      '・「顯示與否」填「否」就會隱藏整個分類\n' +
      '・分類裡沒有上架商品時不會顯示'
    ).setWrap(true).setVerticalAlignment('top');
    sCat.setColumnWidth(1, 200);
    sCat.setColumnWidth(4, 320);
    sCat.setFrozenRows(1);
  }
  const s1Headers = s1.getRange(1, 1, 1, s1.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); });
  const catCol = s1Headers.indexOf('分類') + 1;
  s1.getRange(2, catCol, s1.getMaxRows() - 1, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInRange(sCat.getRange('A2:A'), true).setAllowInvalid(true).build()
  );

  // ===== 3. 新增「網頁設定」分頁 =====
  if (!ss.getSheetByName('網頁設定')) {
    const s = ss.insertSheet('網頁設定');
    s.getRange('A1:B1').setValues([['項目', '內容']]);
    styleHeader(s.getRange('A1:B1'));
    s.getRange(2, 1, 5, 2).setValues([
      ['店名', '日本代購'],
      ['標語', '每週嚴選日本好物，代購直送台灣'],
      ['橫幅圖片', ''],
      ['公告', '範例公告：本週 11/10（日）晚上 10 點截單'],
      ['公告', '']
    ]);
    s.getRange('D1').setValue(
      '說明：\n' +
      '・A 欄的項目名稱請不要改\n' +
      '・「公告」可以新增很多列（A 欄填「公告」即可），內容留空就不會顯示\n' +
      '・「橫幅圖片」可貼圖片網址或雲端硬碟分享連結，留空就不顯示'
    ).setWrap(true).setVerticalAlignment('top');
    s.setColumnWidth(1, 100);
    s.setColumnWidth(2, 360);
    s.setColumnWidth(4, 320);
    s.setFrozenRows(1);
  }

  // ===== 4. 新增「下單規則」分頁 =====
  if (!ss.getSheetByName('下單規則')) {
    const s = ss.insertSheet('下單規則');
    s.getRange('A1').setValue('規則內容');
    styleHeader(s.getRange('A1'));
    s.getRange(2, 1, 3, 1).setValues([
      ['範例：付款方式為 LINE Pay / 銀行轉帳，訂單成立後 24 小時內請完成付款'],
      ['範例：每週三統一送出日本訂單，出貨後約 10-14 天送達'],
      ['範例：商品為預購性質，不接受任意取消或退換貨']
    ]);
    s.setFrozenRows(1);
    s.autoResizeColumn(1);
  }

  // ===== 5. 新增「訂單」分頁（一個品項一列）=====
  if (!ss.getSheetByName('訂單')) {
    const s = ss.insertSheet('訂單');
    const headers = ['時間戳記', '訂單編號', '姓名', 'LINE ID', '電話', '商品名稱', '單價', '數量', '小計', '備註'];
    s.getRange(1, 1, 1, headers.length).setValues([headers]);
    styleHeader(s.getRange(1, 1, 1, headers.length));
    s.setFrozenRows(1);
    s.autoResizeColumns(1, headers.length);
  }

  // ===== 6. 新增「訂單總覽」分頁（一筆訂單一列，含處理狀態）=====
  if (!ss.getSheetByName('訂單總覽')) {
    const s = ss.insertSheet('訂單總覽', 0);
    const headers = ['時間戳記', '訂單編號', '姓名', '電話', 'LINE ID', '品項', '總金額', '備註', '處理狀態'];
    s.getRange(1, 1, 1, headers.length).setValues([headers]);
    styleHeader(s.getRange(1, 1, 1, headers.length));
    s.setFrozenRows(1);
    s.setColumnWidth(6, 320);
    s.getRange('A:A').setNumberFormat('yyyy/mm/dd hh:mm');
    s.getRange('G:G').setNumberFormat('#,##0');

    const statusRange = s.getRange('I2:I');
    statusRange.setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(ORDER_STATUSES, true).build()
    );
    const colors = { '待付款': '#fde2e1', '已付款': '#fff2cc', '已訂購': '#dbe9f6', '已出貨': '#e1d5f0', '完成': '#d9ead3', '取消': '#eeeeee' };
    s.setConditionalFormatRules(Object.keys(colors).map(function (status) {
      return SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo(status).setBackground(colors[status]).setRanges([statusRange]).build();
    }));
  }

  const message =
    '✅ 訂購系統設定完成！\n\n' +
    '1. 到「網頁設定」修改店名、標語、公告\n' +
    '2. 到「分類」分頁設定代購種類\n' +
    '3. 到「定價試算」最右邊填商品介紹、圖片網址、分類、商品備註（上架與否填 Ｏ 才會出現在網頁）\n' +
    '4. 到「下單規則」編輯規則文字\n\n' +
    '接下來請部署 Code.gs 為 Web App。'
  ;
  // 從 Apps Script 編輯器執行、試算表沒開著時無法跳出提示框，改寫在執行記錄裡
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (err) {
    console.log(message);
  }
}

function styleHeader(range) {
  range.setBackground(HEADER_BG).setFontColor('#ffffff').setFontWeight('bold');
}
