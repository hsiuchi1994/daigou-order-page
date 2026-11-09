// 頁面：#/ 主頁、#/c/分類名稱 分類頁、#/cart 購物車、#/checkout 結帳
const CART_KEY = 'daigou-cart';
const PROFILE_KEY = 'daigou-profile';
const IS_DEMO = new URLSearchParams(location.search).has('demo');

let store = { settings: {}, rules: [], categories: [], products: [] };
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
  else if (hash === '/cart') renderCart();
  else if (hash === '/checkout') renderCheckout();
  else if (hash === '/done') renderDone();
  else renderHome();
  updateCartIndicators(hash);
}

function categoryHref(name) {
  return '#/c/' + encodeURIComponent(name);
}

// ===== 主頁 =====

function renderHome() {
  const s = store.settings;
  const banner = s.banner
    ? `<img class="banner" src="${escapeHtml(s.banner)}" alt="" onerror="this.remove()">`
    : '';
  const announcements = (s.announcements || []).length
    ? `<ul class="announcements">${s.announcements.map(function (a) { return `<li>${a}</li>`; }).join('')}</ul>`
    : '';
  const rules = store.rules.length
    ? `<details class="rules">
         <summary>下單規則<span class="summary-hint"></span></summary>
         <ol>${store.rules.map(function (r) { return `<li>${r}</li>`; }).join('')}</ol>
       </details>`
    : '';
  const categories = store.categories.length
    ? `<div class="category-grid">${store.categories.map(function (c) {
        return `<a class="category-card" href="${categoryHref(c.name)}">
                  <span class="category-name">${escapeHtml(c.name)}</span>
                  <span class="category-count">${c.count} 件商品 →</span>
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
      ${rules}
      <section>
        <h2>代購種類</h2>
        ${categories}
      </section>
    </div>`;
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
      <p>訂單編號 <strong>${escapeHtml(lastOrder.orderId)}</strong></p>
      <p>總金額 <strong>NT$ ${formatPrice(lastOrder.total)}</strong></p>
      <p class="muted">我們會盡快與您確認訂單內容。</p>
      <a class="btn-secondary" href="#/">回首頁</a>
    </div>`;
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
