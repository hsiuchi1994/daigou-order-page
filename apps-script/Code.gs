/**
 * 代購訂購頁面的後端 API（部署為 Web App）。
 * GET  → 回傳下單規則與商品列表
 * POST → 接收消費者訂單，寫入「訂單」分頁
 */

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const rulesSheet = ss.getSheetByName('下單規則');
  const lastRulesRow = rulesSheet.getLastRow();
  const rules = lastRulesRow > 1
    ? rulesSheet.getRange(2, 1, lastRulesRow - 1, 1).getValues().flat().filter(String)
    : [];

  const productsSheet = ss.getSheetByName('上架商品');
  const data = productsSheet.getDataRange().getValues();
  const products = data.slice(1)
    .filter(function (row) { return row[0]; })
    .map(function (row) {
      return {
        name: row[0],
        price: Number(row[1]) || 0,
        desc: row[2] || '',
        image: row[3] || ''
      };
    });

  return ContentService.createTextOutput(JSON.stringify({ rules: rules, products: products }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const orderSheet = ss.getSheetByName('訂單');
    const body = JSON.parse(e.postData.contents);

    const name = (body.name || '').toString().trim();
    const lineId = (body.lineId || '').toString().trim();
    const phone = (body.phone || '').toString().trim();
    const note = (body.note || '').toString().trim();
    const items = Array.isArray(body.items) ? body.items : [];

    if (!name || items.length === 0) {
      return jsonOutput({ success: false, error: '缺少姓名或訂購品項' });
    }

    const now = new Date();
    const orderId = 'ORD' + Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMddHHmmss');

    const rows = items.map(function (item) {
      const qty = Number(item.qty) || 0;
      const price = Number(item.price) || 0;
      return [now, orderId, name, lineId, phone, item.name, price, qty, price * qty, note];
    });

    orderSheet.getRange(orderSheet.getLastRow() + 1, 1, rows.length, 10).setValues(rows);

    return jsonOutput({ success: true, orderId: orderId });
  } catch (err) {
    return jsonOutput({ success: false, error: err.message });
  } finally {
    lock.releaseLock();
  }
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
