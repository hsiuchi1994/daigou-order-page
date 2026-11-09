// 示意模式（網址加上 ?demo）用的範例資料，不會讀寫 Google Sheet
// 圖片：日本寶可夢中心實景照，來源 Wikimedia Commons（CC 授權）
(function () {
  const W = 'https://upload.wikimedia.org/wikipedia/commons/thumb/';
  const img = function (path, width) {
    return W + path + '/' + width + 'px-' + path.split('/').pop();
  };

  window.DEMO_DATA = {
    settings: {
      shopName: '日本代購',
      tagline: '每週嚴選日本好物，代購直送台灣',
      banner: img('3/3c/Pok%C3%A9mon_Center_Shibuya_%2852506444605%29.jpg', 1280),
      announcements: [
        '本週 11/16（日）晚上 10 點截單，11/19 統一下單',
        '寶可夢中心新品情報請看 <a href="https://www.pokemoncenter-online.com/" target="_blank" rel="noopener">官方網站</a>'
      ]
    },
    rules: [
      '付款方式為 LINE Pay / 銀行轉帳，訂單成立後 24 小時內請完成付款',
      '每週三統一送出日本訂單，出貨後約 10-14 天送達',
      '商品為預購性質，不接受任意取消或退換貨',
      '運費計算方式請參考 <a href="https://www.post.japanpost.jp/int/ems/index.html" target="_blank" rel="noopener">日本郵便 EMS</a>'
    ],
    categories: [
      { name: 'Pokemon', count: 6 },
      { name: 'Tower Records', count: 2 }
    ],
    products: [
      {
        name: '皮卡丘 絨毛娃娃（M）', price: 980, category: 'Pokemon',
        desc: '寶可夢中心常規款，約 20 公分',
        note: '每人限購 2 個。實際顏色以官方照片為準。',
        image: img('7/7a/Mega_Tokyo_Pok%C3%A9mon_Center_wares_2.jpg', 500)
      },
      {
        name: '伊布 馬克杯', price: 650, category: 'Pokemon',
        desc: '陶瓷材質，容量 300ml',
        note: '易碎品會加強包裝，包材費已含在售價。',
        image: img('a/a5/Mega_Tokyo_Pok%C3%A9mon_Center_wares_3.jpg', 500)
      },
      {
        name: '耿鬼 抱枕', price: 1580, category: 'Pokemon',
        desc: '超大尺寸，約 45 公分',
        note: '體積較大，運費另計。詳見 <a href="https://www.post.japanpost.jp/int/ems/index.html" target="_blank" rel="noopener">EMS 運費表</a>',
        image: img('f/fa/Mega_Tokyo_Pok%C3%A9mon_Center_wares_4.jpg', 500)
      },
      {
        name: '寶可夢中心限定 托特包', price: 890, category: 'Pokemon',
        desc: '帆布材質，A4 可放',
        note: '',
        image: img('4/46/Pok%C3%A9mon_Center_Shibuya_%2852506444865%29.jpg', 500)
      },
      {
        name: '卡牌收納盒', price: 720, category: 'Pokemon',
        desc: '可收納約 400 張卡牌',
        note: '熱門商品，可能需排隊購買，無法保證一定買到。',
        image: img('1/11/Pok%C3%A9mon_Center_Shibuya_%2852506520378%29.jpg', 500)
      },
      {
        name: '沼王凳子', price: 9000, category: 'Pokemon',
        desc: '可以坐的沼王',
        note: '大型商品，需另外報價運費。',
        image: img('1/1c/Pok%C3%A9mon_Center_Kyoto_%282024%29.jpg', 500)
      },
      {
        name: 'NO MUSIC, NO LIFE. 托特包', price: 760, category: 'Tower Records',
        desc: 'Tower Records 經典款',
        note: '',
        image: img('5/5d/Pok%C3%A9mon_Center_am_Tokio_Skytree_%282024%29.jpg', 500)
      },
      {
        name: '澀谷店限定 T-shirt', price: 1200, category: 'Tower Records',
        desc: '尺寸 S / M / L / XL',
        note: '下單時請在備註寫尺寸。',
        image: img('2/2a/Osaka_Pok%C3%A9mon_Center.jpg', 500)
      }
    ]
  };
})();
