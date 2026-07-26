/**
 * 一次性設定腳本：在既有代購試算表上擴充「訂購系統」所需的欄位與分頁。
 * 用法：開啟你的代購試算表 → 擴充功能 → Apps Script → 貼上這個檔案內容 → 執行 setupOrderSystem()
 * 執行一次即可，重複執行不會重複建立或洗掉已填的資料。
 */
function setupOrderSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ===== 1. 定價試算：新增「商品介紹」「圖片網址」兩欄 =====
  const s1 = ss.getSheetByName('定價試算');
  if (!s1) throw new Error('找不到「定價試算」分頁，請確認是否為正確的代購試算表');

  if (s1.getRange('M1').getValue() !== '商品介紹') {
    s1.getRange('M1').setValue('商品介紹');
  }
  if (s1.getRange('N1').getValue() !== '圖片網址') {
    s1.getRange('N1').setValue('圖片網址');
  }
  s1.getRange('M1:N1').setBackground('#2d4a6b').setFontColor('#ffffff').setFontWeight('bold');

  // ===== 2. 上架商品：QUERY 擴充抓出商品介紹、圖片網址 =====
  const s3 = ss.getSheetByName('上架商品');
  if (!s3) throw new Error('找不到「上架商品」分頁');
  s3.getRange('A1').setFormula(
    "=IFERROR(QUERY('定價試算'!A:N,\"SELECT B,G,M,N,L WHERE K='是'\",1),\"尚無上架商品\")"
  );

  // ===== 3. 新增「下單規則」分頁 =====
  let sRules = ss.getSheetByName('下單規則');
  if (!sRules) {
    sRules = ss.insertSheet('下單規則');
    sRules.getRange('A1').setValue('規則內容').setBackground('#2d4a6b').setFontColor('#ffffff').setFontWeight('bold');
    sRules.getRange(2, 1, 3, 1).setValues([
      ['範例：付款方式為 LINE Pay / 銀行轉帳，訂單成立後 24 小時內請完成付款'],
      ['範例：每週三統一送出日本訂單，出貨後約 10-14 天送達'],
      ['範例：商品為預購性質，不接受任意取消或退換貨']
    ]);
    sRules.setFrozenRows(1);
    sRules.autoResizeColumn(1);
  }

  // ===== 4. 新增「訂單」分頁 =====
  let sOrders = ss.getSheetByName('訂單');
  if (!sOrders) {
    sOrders = ss.insertSheet('訂單');
    const headers = ['時間戳記', '訂單編號', '姓名', 'LINE ID', '電話', '商品名稱', '單價', '數量', '小計', '備註'];
    sOrders.getRange(1, 1, 1, headers.length).setValues([headers])
      .setBackground('#2d4a6b').setFontColor('#ffffff').setFontWeight('bold');
    sOrders.setFrozenRows(1);
    sOrders.autoResizeColumns(1, headers.length);
  }

  SpreadsheetApp.getUi().alert('✅ 訂購系統設定完成！\n\n請到「定價試算」M、N 欄填寫商品介紹與圖片網址，\n並到「下單規則」分頁編輯你的下單規則文字。\n\n接下來請部署 Code.gs 為 Web App。');
}
