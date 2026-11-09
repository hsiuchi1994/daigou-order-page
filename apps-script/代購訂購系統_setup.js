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

  // ===== 4. 新增「頁面內容」分頁（關於我們、服務範圍、服務說明、購物須知）=====
  if (!ss.getSheetByName('頁面內容')) {
    const s = ss.insertSheet('頁面內容');
    s.getRange('A1:C1').setValues([['區塊', '標題', '內容']]);
    styleHeader(s.getRange('A1:C1'));
    const rows = [
      ["關於我們", "", ""],
      ["服務範圍", "", "【澀谷】\n・Pokémon Center SHIBUYA\n・Nintendo TOKYO\n・JUMP SHOP\n・CAPCOM STORE\n・Tower Records\n【原宿】\n・Kiddy Land 原宿店"],
      ["服務說明", "🌟 新品代購", "我們會不定期在 LINE 社群分享日本官方新品、限定及熱門商品，可以直接在本網站下單，或依社群公告方式下單。\n1. 下單\n2. 確認商品報價及付款資訊\n3. 完成付款\n4. 依商品販售日期或行程安排購買"],
      ["服務說明", "🔍 商品代尋", "服務範圍內店鋪販售的商品，都可以私訊委託我們代尋。\n【費用】\n・3 件內：免費代尋\n・4 件以上：依數量及需求酌收代尋服務費，報價時一併告知\n・同款不同角色／款式算不同商品；同款只是數量不同算同一件\n【流程】\n1. 私訊提供商品圖片、名稱或官方商品資訊\n2. 確認是否為服務範圍內店鋪的商品\n3. 回覆報價及購買可行性\n4. 確認委託並完成付款\n5. 依行程至日本店鋪尋找及購買\n【注意】\n・代尋不保證購得，依店鋪實際庫存及販售狀況為準"],
      ["購物須知", "📝 購買須知", "・商品依日本店鋪實際庫存為準，無法保證一定購得；熱門商品可能提前完售或延後補貨\n・遇限購、整理券、抽選等特殊販售方式，依店鋪規定辦理，無法保證購得數量\n・皆為日本官方正版商品；外盒、吊牌可能因陳列或運送有輕微壓痕、刮痕，不影響商品本體，完美主義者請審慎評估\n・盲盒、盲包、隨機卡片等商品無法指定款式"],
      ["購物須知", "💰 報價與付款", "・售價已含代購服務費及日本至台灣國際運費，台灣境內運費依寄送方式另計\n・採「無二次補款」：報價確認後不再加收服務費、國際運費及包材費（買家新增商品除外）\n・請於通知期限內完成付款，逾期視同取消；未付款前不保留商品\n・限量、活動商品若有不同付款規範，會在下單時另行說明\n・訂單須經本賣場確認並完成付款後才正式成立"],
      ["購物須知", "🚚 出貨與售後", "・商品抵台整理後，依訂單順序出貨\n・付款確認後恕不接受個人因素取消；若因缺貨、停售等原因無法購得，將全額退款\n・代購屬客製化委託服務，不適用七日鑑賞期\n・除重大瑕疵、寄錯商品或運送重大損壞外，恕不退換貨；外包裝輕微壓痕及原廠塗裝、印刷差異不在退換範圍"],
      ["購物須知", "📦 開箱與取貨", "・收到商品請全程錄影開箱\n・如有短缺、寄錯或損壞，請於取貨後 24 小時內提供完整開箱影片及照片聯繫我們；沒有完整影片恕無法受理\n・請於期限內取貨，逾期退回的重新寄送運費由買家負擔"],
      ["購物須知", "📢 其他", "・下單即視為已閱讀並同意本購物須知\n・本賣場保留接受訂單及修改公告內容之權利"]
    ];
    s.getRange(2, 1, rows.length, 3).setValues(rows);
    s.getRange('A2:A').setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(['關於我們', '服務範圍', '服務說明', '購物須知'], true).build()
    );
    s.getRange('C:C').setWrap(true);
    s.getRange('A:C').setVerticalAlignment('top');
    s.getRange('E1').setValue(
      '說明：\n' +
      '・一列是一個段落，同一個區塊可以有很多列，順序就是網頁上的順序\n' +
      '・「服務說明」「購物須知」的標題會變成可以點開的項目\n' +
      '・內容在儲存格裡換行：Mac 按 ⌘ + Enter\n' +
      '・「・」開頭 → 項目符號\n' +
      '・「1.」「2.」開頭 → 步驟\n' +
      '・整行是【】→ 小標題\n' +
      '・選取文字按 ⌘K 可以加連結\n' +
      '・內容留空的列不會顯示'
    ).setWrap(true);
    s.setColumnWidth(1, 90);
    s.setColumnWidth(2, 140);
    s.setColumnWidth(3, 520);
    s.setColumnWidth(5, 300);
    s.setFrozenRows(1);
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
    '4. 到「頁面內容」編輯關於我們、服務範圍、服務說明、購物須知\n\n' +
    '接下來請部署 Code.gs 為 Web App。';
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
