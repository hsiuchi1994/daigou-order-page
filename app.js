// 頁面：#/ 主頁、#/c/分類名稱 分類頁、#/terms 購物須知、#/cart 購物車、#/checkout 結帳、#/order 查詢訂單
const CART_KEY = 'daigou-cart';
const PROFILE_KEY = 'daigou-profile';
const ORDERS_KEY = 'daigou-orders'; // 這台裝置下過的訂單，查詢頁可以直接點
const ORDER_STEPS = ['待付款', '已付款', '已訂購', '已出貨', '完成'];
const IS_DEMO = new URLSearchParams(location.search).has('demo');

let store = { settings: {}, content: {}, categories: [], products: [] };
let cart = loadJson(CART_KEY) || {}; // { productName: qty }
let lastOrder = null;

const app = document.getElementById('app');

document.addEventListener('DOMContentLoaded', init);
app.addEventListener('click', handleQtyClick);
window.addEventListener('hashchange', function () {
  render();
  window.scrollTo(0, 0);
});

async function init() {
  try {
    store = IS_DEMO ? await loadDemoData() : await (await fetch(CONFIG.API_URL)).json();
  } catch (err) {
    app.innerHTML = '<p class="loading">載入失敗，請重新整理頁面</p>';
    return;
  }

  document.getElementById('demo-ribbon').hidden = !IS_DEMO;
  const shopName = store.settings.shopName || '代購商店';
  document.getElementById('topbar-name').textContent = shopName;
  document.title = shopName;

  store.content = store.content || {};
  ['about', 'area', 'service', 'terms'].forEach(function (k) { store.content[k] = store.content[k] || []; });

  // 舊版 API 沒有分類時，全部歸到「其他」
  store.products.forEach(function (p) { p.category = p.category || '其他'; });
  if (!store.categories) {
    store.categories = [{ name: '其他', count: store.products.length }].filter(function (c) { return c.count; });
  }

  // 移除已下架的商品
  Object.keys(cart).forEach(function (name) {
    if (!findProduct(name)) delete cart[name];
  });
  saveCart();
  render();
}

function loadDemoData() {
  return new Promise(function (resolve, reject) {
    const script = document.createElement('script');
    script.src = 'demo-data.js';
    script.onload = function () { resolve(window.DEMO_DATA); };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// ===== 路由 =====

function render() {
  const hash = decodeURIComponent(location.hash.replace(/^#/, '')) || '/';
  if (hash.indexOf('/c/') === 0) renderCategory(hash.slice(3));
  else if (hash === '/terms') renderTerms();
  else if (hash === '/cart') renderCart();
  else if (hash === '/checkout') renderCheckout();
  else if (hash === '/done') renderDone();
  else if (hash === '/order' || hash.indexOf('/order/') === 0) renderOrderLookup(hash.slice(7));
  else renderHome();
  updateCartIndicators(hash);
}

function categoryHref(name) {
  return '#/c/' + encodeURIComponent(name);
}

// ===== 主頁 =====

function renderHome() {
  const s = store.settings;
  const c = store.content;
  const banner = s.banner
    ? `<img class="banner" src="${escapeHtml(s.banner)}" alt="" onerror="this.remove()">`
    : '';
  const announcements = (s.announcements || []).length
    ? `<ul class="announcements">${s.announcements.map(function (a) { return `<li>${a}</li>`; }).join('')}</ul>`
    : '';
  const categories = store.categories.length
    ? `<div class="category-grid">${store.categories.map(function (cat) {
        return `<a class="category-card" href="${categoryHref(cat.name)}">
                  <span class="category-name">${escapeHtml(cat.name)}</span>
                  <span class="category-count">${cat.count} 件商品 →</span>
                </a>`;
      }).join('')}</div>`
    : '<p class="empty">目前尚無上架商品</p>';

  app.innerHTML = `
    ${banner}
    <div class="page">
      <section class="hero">
        <h1>${escapeHtml(s.shopName || '代購商店')}</h1>
        ${s.tagline ? `<p>${escapeHtml(s.tagline)}</p>` : ''}
      </section>
      ${announcements}
      <section>
        <h2>代購種類</h2>
        ${categories}
      </section>
      ${c.area.length ? `
        <section>
          <h2>服務範圍</h2>
          <div class="card area content">${c.area.map(function (b) { return formatBlock(b.body); }).join('')}</div>
        </section>` : ''}
      ${c.service.length ? `
        <section>
          <h2>服務說明</h2>
          ${c.service.map(collapsibleHtml).join('')}
        </section>` : ''}
      ${c.terms.length ? `
        <a class="terms-card" href="#/terms">
          <span><strong>📝 購物須知</strong><span class="muted">下單前請先閱讀</span></span>
          <span>→</span>
        </a>` : ''}
      <a class="terms-card" href="#/order">
        <span><strong>🔎 查詢訂單</strong><span class="muted">輸入訂單編號和電話，查看處理進度</span></span>
        <span>→</span>
      </a>
      ${c.about.length ? `
        <section>
          <h2>關於我們</h2>
          <div class="card">${c.about.map(blockWithTitleHtml).join('')}</div>
        </section>` : ''}
    </div>`;
}

// ===== 購物須知 =====

function renderTerms() {
  app.innerHTML = `
    <div class="page">
      <a class="back-link" href="#/">← 回首頁</a>
      <h2 class="page-title">購物須知</h2>
      ${store.content.terms.length
        ? store.content.terms.map(function (b) { return `<div class="card terms-block">${blockWithTitleHtml(b)}</div>`; }).join('')
        : '<p class="empty">尚未設定購物須知</p>'}
    </div>`;
}

// ===== 頁面內容排版 =====

function collapsibleHtml(b) {
  return `<details class="collapsible"><summary>${escapeHtml(b.title || '詳細說明')}</summary><div class="content">${formatBlock(b.body)}</div></details>`;
}

function blockWithTitleHtml(b) {
  return (b.title ? `<h3 class="block-title">${escapeHtml(b.title)}</h3>` : '') + `<div class="content">${formatBlock(b.body)}</div>`;
}

// 內容一行一行排版：「・」開頭是項目、「1.」開頭是步驟、整行【】是小標題，其他是段落
// body 是後台轉好的 HTML（已跳脫、只含連結），所以可以直接放進頁面
function formatBlock(body) {
  let html = '';
  let listType = null;
  const closeList = function () {
    if (listType) html += `</${listType}>`;
    listType = null;
  };
  const openList = function (type) {
    if (listType !== type) {
      closeList();
      html += `<${type}>`;
      listType = type;
    }
  };

  String(body).split('\n').forEach(function (raw) {
    const line = raw.trim();
    if (!line) return closeList();
    if (/^[・•‧·]/.test(line)) {
      openList('ul');
      html += `<li>${line.replace(/^[・•‧·]\s*/, '')}</li>`;
    } else if (/^\d+[.、．]\s*/.test(line)) {
      openList('ol');
      html += `<li>${line.replace(/^\d+[.、．]\s*/, '')}</li>`;
    } else if (/^【.*】$/.test(line)) {
      closeList();
      html += `<h4>${line.slice(1, -1)}</h4>`;
    } else {
      closeList();
      html += `<p>${line}</p>`;
    }
  });
  closeList();
  return html;
}

// ===== 分類頁 =====

function renderCategory(name) {
  const items = store.products.filter(function (p) { return p.category === name; });
  app.innerHTML = `
    <div class="page">
      <a class="back-link" href="#/">← 所有分類</a>
      <h2 class="page-title">${escapeHtml(name)}</h2>
      ${items.length
        ? `<div class="product-grid">${items.map(productCardHtml).join('')}</div>`
        : '<p class="empty">這個分類目前沒有商品</p>'}
    </div>`;
}

function productCardHtml(p) {
  const image = p.image
    ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'img-placeholder'}))">`
    : '<div class="img-placeholder"></div>';
  return `
    <article class="product-card">
      ${image}
      <div class="product-body">
        <h3>${escapeHtml(p.name)}</h3>
        <div class="price">NT$ ${formatPrice(p.price)}</div>
        ${p.desc ? `<p class="desc">${escapeHtml(p.desc)}</p>` : ''}
        ${p.note ? `<details class="note"><summary>商品備註</summary><div>${p.note}</div></details>` : ''}
        <div class="product-action" data-name="${escapeHtml(p.name)}">${qtyControlHtml(p.name)}</div>
      </div>
    </article>`;
}

function qtyControlHtml(name) {
  const qty = cart[name] || 0;
  if (!qty) return '<button type="button" class="btn-add" data-action="add">加入購物車</button>';
  return `
    <div class="qty-control">
      <button type="button" data-action="dec" aria-label="減少">−</button>
      <span>${qty}</span>
      <button type="button" data-action="inc" aria-label="增加">＋</button>
    </div>`;
}

// 加入購物車與數量按鈕；分類頁只更新該商品的按鈕，購物車頁整頁重畫
function handleQtyClick(e) {
  const btn = e.target.closest('button[data-action]');
  const holder = btn && btn.closest('[data-name]');
  if (!holder) return;
  const name = holder.dataset.name;
  const action = btn.dataset.action;
  const qty = cart[name] || 0;

  if (action === 'add' || action === 'inc') cart[name] = qty + 1;
  else if (action === 'dec') cart[name] = qty - 1;
  else if (action === 'remove') cart[name] = 0;
  if (cart[name] <= 0) delete cart[name];
  saveCart();

  if (location.hash === '#/cart') renderCart();
  else holder.innerHTML = qtyControlHtml(name);
  updateCartIndicators();
}

// ===== 購物車 =====

function renderCart() {
  const lines = cartLines();
  if (!lines.length) {
    app.innerHTML = `
      <div class="page">
        <h2 class="page-title">購物車</h2>
        <p class="empty">購物車是空的</p>
        <a class="btn-secondary" href="#/">去逛逛</a>
      </div>`;
    return;
  }

  app.innerHTML = `
    <div class="page">
      <h2 class="page-title">購物車</h2>
      <div class="card">
        <ul class="cart-list">
          ${lines.map(function (l) {
            const thumb = l.product.image
              ? `<img src="${escapeHtml(l.product.image)}" alt="" onerror="this.style.visibility='hidden'">`
              : '<div class="img-placeholder"></div>';
            return `
              <li data-name="${escapeHtml(l.product.name)}">
                ${thumb}
                <div class="cart-item">
                  <div class="cart-item-name">${escapeHtml(l.product.name)}</div>
                  <div class="cart-item-price">NT$ ${formatPrice(l.product.price)}</div>
                  <div class="cart-item-row">
                    <div class="qty-control">
                      <button type="button" data-action="dec" aria-label="減少">−</button>
                      <span>${l.qty}</span>
                      <button type="button" data-action="inc" aria-label="增加">＋</button>
                    </div>
                    <button type="button" class="link-btn" data-action="remove">移除</button>
                  </div>
                </div>
                <div class="cart-item-subtotal">NT$ ${formatPrice(l.subtotal)}</div>
              </li>`;
          }).join('')}
        </ul>
        <div class="total-row"><span>總計</span><span>NT$ ${formatPrice(cartTotal(lines))}</span></div>
      </div>
      <a class="btn-primary" href="#/checkout">前往結帳</a>
      <a class="btn-secondary" href="#/">繼續選購</a>
    </div>`;
}

// ===== 結帳 =====

function renderCheckout() {
  const lines = cartLines();
  if (!lines.length) {
    location.hash = '#/cart';
    return;
  }
  const profile = loadJson(PROFILE_KEY) || {};

  app.innerHTML = `
    <div class="page">
      <a class="back-link" href="#/cart">← 回購物車</a>
      <h2 class="page-title">結帳</h2>

      <section>
        <h3 class="section-label">訂購明細</h3>
        <div class="card">
          <ul class="summary-list">
            ${lines.map(function (l) {
              return `<li><span>${escapeHtml(l.product.name)} × ${l.qty}</span><span>NT$ ${formatPrice(l.subtotal)}</span></li>`;
            }).join('')}
          </ul>
          <div class="total-row"><span>總計</span><span>NT$ ${formatPrice(cartTotal(lines))}</span></div>
        </div>
      </section>

      <section>
        <h3 class="section-label">訂購人資訊</h3>
        <div class="card">
          <form id="order-form" novalidate>
            <label for="field-name">姓名 *</label>
            <input type="text" id="field-name" autocomplete="name" value="${escapeHtml(profile.name || '')}">

            <label for="field-phone">電話 *</label>
            <input type="tel" id="field-phone" autocomplete="tel" inputmode="tel" value="${escapeHtml(profile.phone || '')}">

            <label for="field-line">LINE ID（選填）</label>
            <input type="text" id="field-line" value="${escapeHtml(profile.lineId || '')}">

            <label for="field-note">備註（選填）</label>
            <textarea id="field-note" placeholder="有其他需求可以在這裡說明"></textarea>

            <label class="remember">
              <input type="checkbox" id="field-remember" checked>
              記住我的資料，下次自動帶入
            </label>
            ${store.content.terms.length ? `
              <label class="remember">
                <input type="checkbox" id="field-agree">
                <span>我已閱讀並同意 <a href="#/terms" target="_blank">購物須知</a></span>
              </label>` : ''}

            <button type="submit" class="btn-primary" id="submit-btn">送出訂單</button>
            <div class="message" id="form-message"></div>
          </form>
        </div>
      </section>
    </div>`;

  document.getElementById('order-form').addEventListener('submit', handleSubmit);
}

async function handleSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('field-name').value.trim();
  const phone = document.getElementById('field-phone').value.trim();
  const lineId = document.getElementById('field-line').value.trim();
  const note = document.getElementById('field-note').value.trim();
  const remember = document.getElementById('field-remember').checked;
  const items = cartLines().map(function (l) { return { name: l.product.name, qty: l.qty }; });

  if (!name) return showMessage('請填寫姓名', 'error');
  if (!/^[0-9+\-\s()]{8,}$/.test(phone)) return showMessage('請填寫正確的電話號碼', 'error');
  const agree = document.getElementById('field-agree');
  if (agree && !agree.checked) return showMessage('請先閱讀並勾選同意購物須知', 'error');

  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = '送出中...';

  try {
    const result = IS_DEMO
      ? { success: true, orderId: 'DEMO0001', total: cartTotal(cartLines()) }
      : await (await fetch(CONFIG.API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ name, phone, lineId, note, items })
        })).json();

    if (!result.success) {
      showMessage(result.error || '送出失敗，請稍後再試', 'error');
      return;
    }
    try {
      if (remember) localStorage.setItem(PROFILE_KEY, JSON.stringify({ name, phone, lineId }));
      else localStorage.removeItem(PROFILE_KEY);
    } catch (err) {}
    cart = {};
    saveCart();
    rememberOrder(result.orderId, phone);
    lastOrder = result;
    location.hash = '#/done';
  } catch (err) {
    showMessage('送出失敗，請確認網路連線後再試一次', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '送出訂單';
  }
}

function renderDone() {
  if (!lastOrder) {
    location.hash = '#/';
    return;
  }
  app.innerHTML = `
    <div class="page done">
      <div class="done-icon">✓</div>
      <h2>感謝訂購！</h2>
      <div class="order-id-box">
        <span class="muted">訂單編號</span>
        <strong id="done-order-id">${escapeHtml(lastOrder.orderId)}</strong>
        <button type="button" class="btn-copy" id="copy-order-id">複製</button>
      </div>
      <p>總金額 <strong>NT$ ${formatPrice(lastOrder.total)}</strong></p>
      <p class="save-hint">📸 請<strong>截圖保存</strong>此頁，之後用訂單編號＋電話查詢進度</p>
      <p class="muted">我們會盡快與您確認訂單內容。</p>
      <a class="btn-primary" href="#/order/${encodeURIComponent(lastOrder.orderId)}">查詢訂單狀態</a>
      <a class="btn-secondary" href="#/">回首頁</a>
    </div>`;

  document.getElementById('copy-order-id').addEventListener('click', copyOrderId);
}

async function copyOrderId(e) {
  const btn = e.currentTarget;
  const text = document.getElementById('done-order-id').textContent;
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // 舊瀏覽器或 LINE 內建瀏覽器不支援時，改用選取文字複製
    const input = document.createElement('textarea');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    input.remove();
  }
  btn.textContent = '已複製 ✓';
  setTimeout(function () { btn.textContent = '複製'; }, 2000);
}

// ===== 查詢訂單 =====

function renderOrderLookup(orderId) {
  const recent = loadJson(ORDERS_KEY) || [];
  const known = recent.find(function (o) { return o.orderId === orderId; });
  const phone = (known && known.phone) || (loadJson(PROFILE_KEY) || {}).phone || '';

  app.innerHTML = `
    <div class="page">
      <a class="back-link" href="#/">← 回首頁</a>
      <h2 class="page-title">查詢訂單</h2>

      ${recent.length ? `
        <section>
          <h3 class="section-label">這台裝置的訂單</h3>
          <div class="recent-orders">
            ${recent.map(function (o) {
              return `<a class="chip${o.orderId === orderId ? ' active' : ''}" href="#/order/${encodeURIComponent(o.orderId)}">${escapeHtml(o.orderId)}</a>`;
            }).join('')}
          </div>
        </section>` : ''}

      <section>
        <div class="card">
          <form id="lookup-form" class="form" novalidate>
            <label for="lookup-id">訂單編號</label>
            <input type="text" id="lookup-id" autocapitalize="characters" placeholder="例如 ORD2611101530xx" value="${escapeHtml(orderId)}">

            <label for="lookup-phone">下單時填的電話</label>
            <input type="tel" id="lookup-phone" inputmode="tel" autocomplete="tel" value="${escapeHtml(phone)}">

            <button type="submit" class="btn-primary" id="lookup-btn">查詢</button>
            <div class="message" id="form-message"></div>
          </form>
        </div>
      </section>

      <div id="lookup-result"></div>
    </div>`;

  document.getElementById('lookup-form').addEventListener('submit', handleLookup);
  if (orderId && phone) handleLookup();
}

async function handleLookup(e) {
  if (e) e.preventDefault();
  const orderId = document.getElementById('lookup-id').value.trim().toUpperCase();
  const phone = document.getElementById('lookup-phone').value.trim();
  const resultEl = document.getElementById('lookup-result');
  resultEl.innerHTML = '';
  if (!orderId || !phone) return showMessage('請填寫訂單編號和電話', 'error');
  document.getElementById('form-message').className = 'message';

  const btn = document.getElementById('lookup-btn');
  btn.disabled = true;
  btn.textContent = '查詢中...';
  try {
    const result = IS_DEMO
      ? { success: true, order: { orderId: orderId, date: '2026/11/10', items: '皮卡丘 絨毛娃娃（M） ×2、伊布 馬克杯 ×1', total: 2610, status: '已訂購' } }
      : await (await fetch(CONFIG.API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'lookup', orderId, phone })
        })).json();
    if (!result.success) return showMessage(result.error || '查詢失敗，請稍後再試', 'error');
    rememberOrder(result.order.orderId, phone);
    resultEl.innerHTML = orderResultHtml(result.order);
  } catch (err) {
    showMessage('查詢失敗，請確認網路連線後再試一次', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '查詢';
  }
}

function orderResultHtml(o) {
  const step = ORDER_STEPS.indexOf(o.status);
  const progress = step >= 0
    ? `<ol class="order-steps">${ORDER_STEPS.map(function (s, i) {
        return `<li class="${i < step ? 'passed' : i === step ? 'current' : ''}">${escapeHtml(s)}</li>`;
      }).join('')}</ol>`
    : `<p class="order-status${o.status === '取消' ? ' cancelled' : ''}">${escapeHtml(o.status)}</p>`;
  return `
    <section>
      <h3 class="section-label">訂單狀態</h3>
      <div class="card">
        ${progress}
        <ul class="summary-list order-info">
          <li><span class="muted">訂單編號</span><span>${escapeHtml(o.orderId)}</span></li>
          ${o.date ? `<li><span class="muted">下單日期</span><span>${escapeHtml(o.date)}</span></li>` : ''}
          <li><span class="muted">商品</span><span>${escapeHtml(o.items)}</span></li>
        </ul>
        <div class="total-row"><span>總金額</span><span>NT$ ${formatPrice(o.total)}</span></div>
      </div>
    </section>`;
}

function rememberOrder(orderId, phone) {
  const recent = (loadJson(ORDERS_KEY) || []).filter(function (o) { return o.orderId !== orderId; });
  recent.unshift({ orderId: orderId, phone: phone });
  try { localStorage.setItem(ORDERS_KEY, JSON.stringify(recent.slice(0, 10))); } catch (err) {}
}

// ===== 購物車資料 =====

function findProduct(name) {
  return store.products.find(function (p) { return p.name === name; });
}

function cartLines() {
  return Object.keys(cart)
    .map(function (name) {
      const product = findProduct(name);
      return product ? { product: product, qty: cart[name], subtotal: product.price * cart[name] } : null;
    })
    .filter(Boolean);
}

function cartTotal(lines) {
  return lines.reduce(function (sum, l) { return sum + l.subtotal; }, 0);
}

function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (err) {}
}

function updateCartIndicators(hash) {
  hash = hash || decodeURIComponent(location.hash.replace(/^#/, '')) || '/';
  const lines = cartLines();
  const count = lines.reduce(function (sum, l) { return sum + l.qty; }, 0);

  const badge = document.getElementById('cart-badge');
  badge.textContent = count;
  badge.hidden = !count;

  const bar = document.getElementById('cart-bar');
  const showBar = count > 0 && hash !== '/cart' && hash !== '/checkout';
  bar.hidden = !showBar;
  document.getElementById('cart-bar-text').textContent = `已選 ${count} 件・NT$ ${formatPrice(cartTotal(lines))}`;
  document.body.classList.toggle('has-cart-bar', showBar);
}

// ===== 工具 =====

function loadJson(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch (err) { return null; }
}

function showMessage(text, type) {
  const el = document.getElementById('form-message');
  el.textContent = text;
  el.className = `message show ${type}`;
}

function formatPrice(n) {
  return Number(n).toLocaleString('zh-TW');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
