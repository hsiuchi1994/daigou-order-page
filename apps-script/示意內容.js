/**
 * 把 Sheet 填成跟示意版（?demo）一樣的內容，方便預覽正式網頁的樣子。
 * 用法：Apps Script 新增一個檔案，貼上這段 → 執行 fillDemoContent() → 執行完可以刪掉這個檔案
 * 不會動到：店名、標語、橫幅圖片、訂單。重複執行不會重複新增商品。
 */
function fillDemoContent() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const PC = 'https://www.pokemoncenter-online.com/';
  const EMS = 'https://www.post.japanpost.jp/int/ems/index.html';
  const W = 'https://upload.wikimedia.org/wikipedia/commons/thumb/';
  const img = function (path) { return W + path + '/500px-' + path.split('/').pop(); };

  // 文字中 [[連結文字]] 的部分會變成超連結
  const linked = function (text, url) {
    const start = text.indexOf('[[');
    if (start < 0) return SpreadsheetApp.newRichTextValue().setText(text).build();
    const end = text.indexOf(']]') - 2;
    const plain = text.replace('[[', '').replace(']]', '');
    return SpreadsheetApp.newRichTextValue().setText(plain).setLinkUrl(start, end, url).build();
  };

  // ===== 公告：清掉原本的公告列，換成示意公告 =====
  const settings = ss.getSheetByName('網頁設定');
  for (let r = settings.getLastRow(); r >= 2; r--) {
    if (String(settings.getRange(r, 1).getValue()).trim() === '公告') settings.deleteRow(r);
  }
  const announcements = [
    linked('本週 11/16（日）晚上 10 點截單，11/19 統一下單'),
    linked('寶可夢中心新品情報請看 [[官方網站]]', PC)
  ];
  announcements.forEach(function (rich) {
    const row = settings.getLastRow() + 1;
    settings.getRange(row, 1).setValue('公告');
    settings.getRange(row, 2).setRichTextValue(rich);
  });

  // ===== 商品 =====
  const sheet = ss.getSheetByName('定價試算');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(function (h) { return String(h).trim(); });
  const col = function (prefix) {
    return headers.findIndex(function (h) { return h.indexOf(prefix) === 0; }) + 1;
  };
  const C = {
    jp: col('商品名稱（日文）'), name: col('商品名稱（中文）'), price: col('實際售價'),
    listed: col('上架與否'), desc: col('商品介紹'), image: col('圖片網址'),
    category: col('分類'), note: col('商品備註')
  };

  const products = [
    { name: '沼王凳子', price: 9000, category: 'Pokemon', desc: '可以坐的沼王',
      note: linked('大型商品，需另外報價運費。'),
      image: img('1/1c/Pok%C3%A9mon_Center_Kyoto_%282024%29.jpg') },
    { name: '皮卡丘', price: 572, category: 'Pokemon', desc: '寶可夢中心常規款，約 20 公分',
      note: linked('每人限購 2 個。實際顏色以官方照片為準。'),
      image: img('7/7a/Mega_Tokyo_Pok%C3%A9mon_Center_wares_2.jpg') },
    { name: '伊布 馬克杯', price: 650, category: 'Pokemon', desc: '陶瓷材質，容量 300ml',
      note: linked('易碎品會加強包裝，包材費已含在售價。'),
      image: img('a/a5/Mega_Tokyo_Pok%C3%A9mon_Center_wares_3.jpg') },
    { name: '耿鬼 抱枕', price: 1580, category: 'Pokemon', desc: '超大尺寸，約 45 公分',
      note: linked('體積較大，運費另計。詳見 [[EMS 運費表]]', EMS),
      image: img('f/fa/Mega_Tokyo_Pok%C3%A9mon_Center_wares_4.jpg') },
    { name: '寶可夢中心限定 托特包', price: 890, category: 'Pokemon', desc: '帆布材質，A4 可放',
      note: null,
      image: img('4/46/Pok%C3%A9mon_Center_Shibuya_%2852506444865%29.jpg') },
    { name: '卡牌收納盒', price: 720, category: 'Pokemon', desc: '可收納約 400 張卡牌',
      note: linked('熱門商品，可能需排隊購買，無法保證一定買到。'),
      image: img('1/11/Pok%C3%A9mon_Center_Shibuya_%2852506520378%29.jpg') },
    { name: 'NO MUSIC, NO LIFE. 托特包', price: 760, category: 'Tower Records', desc: 'Tower Records 經典款',
      note: null,
      image: img('5/5d/Pok%C3%A9mon_Center_am_Tokio_Skytree_%282024%29.jpg') },
    { name: '澀谷店限定 T-shirt', price: 1200, category: 'Tower Records', desc: '尺寸 S / M / L / XL',
      note: linked('下單時請在備註寫尺寸。'),
      image: img('2/2a/Osaka_Pok%C3%A9mon_Center.jpg') }
  ];

  const names = sheet.getRange(1, C.name, sheet.getLastRow(), 1).getValues()
    .map(function (r) { return String(r[0]).trim(); });

  products.forEach(function (p) {
    let row = names.indexOf(p.name) + 1;
    if (!row) {
      // 新增的示意商品：售價直接填，日文名稱標記方便之後刪除
      row = sheet.getLastRow() + 1;
      names[row - 1] = p.name;
      sheet.getRange(row, C.jp).setValue('【示意商品】');
      sheet.getRange(row, C.name).setValue(p.name);
      sheet.getRange(row, C.price).setValue(p.price);
    }
    sheet.getRange(row, C.listed).setValue('Ｏ');
    sheet.getRange(row, C.category).setValue(p.category);
    sheet.getRange(row, C.desc).setValue(p.desc);
    sheet.getRange(row, C.image).setValue(p.image);
    if (p.note) sheet.getRange(row, C.note).setRichTextValue(p.note);
  });

  console.log('✅ 示意內容已填入，重新整理網頁就能看到');
}
