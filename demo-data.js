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
    content: {
      "about": [],
      "area": [
        {
          "title": "",
          "body": "【澀谷】\n・Pokémon Center SHIBUYA\n・Nintendo TOKYO\n・JUMP SHOP\n・CAPCOM STORE\n・Tower Records\n【原宿】\n・Kiddy Land 原宿店"
        }
      ],
      "service": [
        {
          "title": "🌟 新品代購",
          "body": "我們會不定期在 LINE 社群分享日本官方新品、限定及熱門商品，可以直接在本網站下單，或依社群公告方式下單。\n1. 下單\n2. 確認商品報價及付款資訊\n3. 完成付款\n4. 依商品販售日期或行程安排購買"
        },
        {
          "title": "🔍 商品代尋",
          "body": "服務範圍內店鋪販售的商品，都可以私訊委託我們代尋。\n【費用】\n・3 件內：免費代尋\n・4 件以上：依數量及需求酌收代尋服務費，報價時一併告知\n・同款不同角色／款式算不同商品；同款只是數量不同算同一件\n【流程】\n1. 私訊提供商品圖片、名稱或官方商品資訊\n2. 確認是否為服務範圍內店鋪的商品\n3. 回覆報價及購買可行性\n4. 確認委託並完成付款\n5. 依行程至日本店鋪尋找及購買\n【注意】\n・代尋不保證購得，依店鋪實際庫存及販售狀況為準"
        }
      ],
      "terms": [
        {
          "title": "📝 購買須知",
          "body": "・商品依日本店鋪實際庫存為準，無法保證一定購得；熱門商品可能提前完售或延後補貨\n・遇限購、整理券、抽選等特殊販售方式，依店鋪規定辦理，無法保證購得數量\n・皆為日本官方正版商品；外盒、吊牌可能因陳列或運送有輕微壓痕、刮痕，不影響商品本體，完美主義者請審慎評估\n・盲盒、盲包、隨機卡片等商品無法指定款式"
        },
        {
          "title": "💰 報價與付款",
          "body": "・售價已含代購服務費及日本至台灣國際運費，台灣境內運費依寄送方式另計\n・採「無二次補款」：報價確認後不再加收服務費、國際運費及包材費（買家新增商品除外）\n・請於通知期限內完成付款，逾期視同取消；未付款前不保留商品\n・限量、活動商品若有不同付款規範，會在下單時另行說明\n・訂單須經本賣場確認並完成付款後才正式成立"
        },
        {
          "title": "🚚 出貨與售後",
          "body": "・商品抵台整理後，依訂單順序出貨\n・付款確認後恕不接受個人因素取消；若因缺貨、停售等原因無法購得，將全額退款\n・代購屬客製化委託服務，不適用七日鑑賞期\n・除重大瑕疵、寄錯商品或運送重大損壞外，恕不退換貨；外包裝輕微壓痕及原廠塗裝、印刷差異不在退換範圍"
        },
        {
          "title": "📦 開箱與取貨",
          "body": "・收到商品請全程錄影開箱\n・如有短缺、寄錯或損壞，請於取貨後 24 小時內提供完整開箱影片及照片聯繫我們；沒有完整影片恕無法受理\n・請於期限內取貨，逾期退回的重新寄送運費由買家負擔"
        },
        {
          "title": "📢 其他",
          "body": "・下單即視為已閱讀並同意本購物須知\n・本賣場保留接受訂單及修改公告內容之權利"
        }
      ]
    },
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
