/**
 * 代購訂購頁面的後端 API（部署為 Web App）。
 * GET  → 回傳網頁設定、下單規則與商品列表（「定價試算」中上架與否為 Ｏ 的商品）
 * POST → 接收消費者訂單，寫入「訂單」（明細）與「訂單總覽」分頁
 */

const STATUS_DEFAULT = '待付款';

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return jsonOutput({
    settings: readSettings(ss),
    rules: readRules(ss),
    products: readProducts(ss)
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const body = JSON.parse(e.postData.contents);

    const name = (body.name || '').toString().trim();
    const phone = (body.phone || '').toString().trim();
    const lineId = (body.lineId || '').toString().trim();
    const note = (body.note || '').toString().trim();
    const items = Array.isArray(body.items) ? body.items : [];

    if (!name || !phone || items.length === 0) {
      return jsonOutput({ success: false, error: '缺少姓名、電話或訂購品項' });
    }

    // 以 Sheet 上的售價為準，不採用前台送來的價格
    const priceMap = {};
    readProducts(ss).forEach(function (p) { priceMap[p.name] = p.price; });

    const lines = [];
    for (let i = 0; i < items.length; i++) {
      const itemName = (items[i].name || '').toString();
      const qty = Math.floor(Number(items[i].qty) || 0);
      if (qty <= 0) continue;
      if (!(itemName in priceMap)) {
        return jsonOutput({ success: false, error: '「' + itemName + '」已下架，請重新整理頁面後再下單' });
      }
      lines.push({ name: itemName, price: priceMap[itemName], qty: qty });
    }
    if (!lines.length) {
      return jsonOutput({ success: false, error: '請至少選擇一項商品' });
    }

    const now = new Date();
    const orderId = 'ORD' + Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyMMddHHmmss')
      + Math.floor(Math.random() * 100).toString().padStart(2, '0');

    // 「訂單」：一個品項一列（統計採購用）
    const detailSheet = ss.getSheetByName('訂單');
    const detailRows = lines.map(function (l) {
      return [now, orderId, name, lineId, "'" + phone, l.name, l.price, l.qty, l.price * l.qty, note];
    });
    detailSheet.getRange(detailSheet.getLastRow() + 1, 1, detailRows.length, detailRows[0].length)
      .setValues(detailRows);

    // 「訂單總覽」：一筆訂單一列（收款、追進度用）
    const total = lines.reduce(function (sum, l) { return sum + l.price * l.qty; }, 0);
    const summary = lines.map(function (l) { return l.name + ' ×' + l.qty; }).join('、');
    const summarySheet = ss.getSheetByName('訂單總覽');
    summarySheet.appendRow([now, orderId, name, "'" + phone, lineId, summary, total, note, STATUS_DEFAULT]);

    return jsonOutput({ success: true, orderId: orderId, total: total });
  } catch (err) {
    return jsonOutput({ success: false, error: err.message });
  } finally {
    lock.releaseLock();
  }
}

// 「網頁設定」分頁：A 欄項目、B 欄內容；「公告」可以有很多列
function readSettings(ss) {
  const settings = { shopName: '', tagline: '', banner: '', announcements: [] };
  const sheet = ss.getSheetByName('網頁設定');
  if (!sheet || sheet.getLastRow() < 2) return settings;

  sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues().forEach(function (row) {
    const key = String(row[0]).trim();
    const value = String(row[1]).trim();
    if (!value) return;
    if (key === '店名') settings.shopName = value;
    else if (key === '標語') settings.tagline = value;
    else if (key === '橫幅圖片') settings.banner = toImageUrl(value);
    else if (key === '公告') settings.announcements.push(value);
  });
  return settings;
}

function readRules(ss) {
  const sheet = ss.getSheetByName('下單規則');
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat()
    .map(function (r) { return String(r).trim(); })
    .filter(String);
}

// 直接讀「定價試算」，依第一列的標題找欄位，插入或移動欄位都不影響
const LISTED_MARKS = ['是', 'O', 'Ｏ', '○', 'V', 'Ｖ', '✓', '✔', 'TRUE'];

function readProducts(ss) {
  const sheet = ss.getSheetByName('定價試算');
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(function (h) { return String(h).trim(); });
  const col = function (prefix) {
    return headers.findIndex(function (h) { return h.indexOf(prefix) === 0; });
  };
  const nameCol = col('商品名稱（中文）');
  const priceCol = col('實際售價');
  const listedCol = col('上架與否');
  const descCol = col('商品介紹');
  const imageCol = col('圖片網址');
  if (nameCol < 0 || priceCol < 0 || listedCol < 0) {
    throw new Error('「定價試算」找不到「商品名稱（中文）」「實際售價」「上架與否」其中一欄的標題');
  }

  return data.slice(1)
    .filter(function (row) {
      const listed = String(row[listedCol]).trim().toUpperCase();
      return row[nameCol] && Number(row[priceCol]) > 0 && LISTED_MARKS.indexOf(listed) >= 0;
    })
    .map(function (row) {
      return {
        name: String(row[nameCol]).trim(),
        price: Number(row[priceCol]),
        desc: descCol >= 0 && row[descCol] ? String(row[descCol]) : '',
        image: imageCol >= 0 ? toImageUrl(row[imageCol]) : ''
      };
    });
}

// 把 Google 雲端硬碟分享連結轉成網頁可顯示的圖片網址；其他網址原樣回傳
function toImageUrl(value) {
  const url = value ? String(value).trim() : '';
  const match = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]+)/);
  return match ? 'https://drive.google.com/thumbnail?id=' + match[1] + '&sz=w1000' : url;
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
