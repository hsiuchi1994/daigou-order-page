const cart = {}; // { productName: { price, qty } }
let products = [];
const PROFILE_KEY = 'daigou-profile';

document.addEventListener('DOMContentLoaded', init);

async function init() {
  document.getElementById('order-form').addEventListener('submit', handleSubmit);
  loadProfile();

  try {
    const res = await fetch(CONFIG.API_URL);
    const data = await res.json();
    renderSettings(data.settings || {});
    renderRules(data.rules || []);
    products = data.products || [];
    renderProducts(products);
  } catch (err) {
    document.getElementById('rules-list').innerHTML = '<li>載入失敗，請稍後再試</li>';
    document.getElementById('products-list').innerHTML = '<p class="loading">商品載入失敗，請重新整理頁面</p>';
  }
}

function renderSettings(settings) {
  if (settings.shopName) {
    document.getElementById('shop-name').textContent = settings.shopName;
    document.title = settings.shopName;
  }
  document.getElementById('shop-tagline').textContent = settings.tagline || '';

  if (settings.banner) {
    const banner = document.getElementById('banner');
    banner.src = settings.banner;
    banner.hidden = false;
    banner.addEventListener('error', function () { banner.hidden = true; });
  }

  const announcements = settings.announcements || [];
  if (announcements.length) {
    document.getElementById('announcement-list').innerHTML = announcements
      .map(function (a) { return `<li>${escapeHtml(a)}</li>`; }).join('');
    document.getElementById('announcements').hidden = false;
  }
}

function renderRules(rules) {
  const list = document.getElementById('rules-list');
  if (!rules.length) {
    list.innerHTML = '<li>目前尚未設定下單規則</li>';
    return;
  }
  list.innerHTML = rules.map(function (r) { return `<li>${escapeHtml(r)}</li>`; }).join('');
}

function renderProducts(items) {
  const container = document.getElementById('products-list');
  if (!items.length) {
    container.innerHTML = '<p class="loading">目前尚無上架商品</p>';
    return;
  }

  container.innerHTML = items.map(function (p, i) {
    const img = p.image
      ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}">`
      : `<div style="width:84px;height:84px;border-radius:8px;background:var(--border);flex-shrink:0;"></div>`;
    return `
      <div class="product-card">
        ${img}
        <div class="product-info">
          <div class="name">${escapeHtml(p.name)}</div>
          ${p.desc ? `<div class="desc">${escapeHtml(p.desc)}</div>` : ''}
          <div class="price">NT$ ${p.price}</div>
          <div class="qty-control">
            <button type="button" data-action="dec" data-index="${i}">−</button>
            <input type="number" min="0" value="0" data-index="${i}" inputmode="numeric">
            <button type="button" data-action="inc" data-index="${i}">＋</button>
          </div>
        </div>
      </div>`;
  }).join('');

  container.querySelectorAll('button[data-action]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const idx = Number(btn.dataset.index);
      const input = container.querySelector(`input[data-index="${idx}"]`);
      let qty = Number(input.value) || 0;
      qty = btn.dataset.action === 'inc' ? qty + 1 : Math.max(0, qty - 1);
      input.value = qty;
      updateCartItem(idx, qty);
    });
  });

  container.querySelectorAll('input[data-index]').forEach(function (input) {
    input.addEventListener('change', function () {
      const idx = Number(input.dataset.index);
      const qty = Math.max(0, Number(input.value) || 0);
      input.value = qty;
      updateCartItem(idx, qty);
    });
  });
}

function updateCartItem(idx, qty) {
  const product = products[idx];
  if (qty > 0) {
    cart[product.name] = { price: product.price, qty: qty };
  } else {
    delete cart[product.name];
  }
  renderCart();
}

function renderCart() {
  const list = document.getElementById('cart-items');
  const empty = document.getElementById('cart-empty');
  const totalRow = document.getElementById('cart-total');
  const entries = Object.entries(cart);

  if (!entries.length) {
    list.innerHTML = '';
    empty.style.display = 'block';
    totalRow.style.display = 'none';
    return;
  }

  empty.style.display = 'none';
  totalRow.style.display = 'flex';

  let total = 0;
  list.innerHTML = entries.map(function ([name, item]) {
    const subtotal = item.price * item.qty;
    total += subtotal;
    return `<li><span>${escapeHtml(name)} × ${item.qty}</span><span>NT$ ${subtotal}</span></li>`;
  }).join('');

  document.getElementById('cart-total-amount').textContent = `NT$ ${total}`;
}

async function handleSubmit(e) {
  e.preventDefault();
  const messageEl = document.getElementById('form-message');
  messageEl.className = 'message';

  const name = document.getElementById('field-name').value.trim();
  const phone = document.getElementById('field-phone').value.trim();
  const lineId = document.getElementById('field-line').value.trim();
  const note = document.getElementById('field-note').value.trim();
  const items = Object.entries(cart).map(function ([name, item]) {
    return { name: name, price: item.price, qty: item.qty };
  });

  if (!name) {
    showMessage('請填寫姓名', 'error');
    return;
  }
  if (!/^[0-9+\-\s()]{8,}$/.test(phone)) {
    showMessage('請填寫正確的電話號碼', 'error');
    return;
  }
  if (!items.length) {
    showMessage('請至少選擇一項商品', 'error');
    return;
  }

  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = '送出中...';

  try {
    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ name, phone, lineId, note, items })
    });
    const result = await res.json();

    if (result.success) {
      showMessage(`感謝訂購！您的訂單編號為 ${result.orderId}，總金額 NT$ ${result.total}，我們會盡快與您確認訂單內容。`, 'success');
      saveProfile({ name, phone, lineId });
      Object.keys(cart).forEach(function (k) { delete cart[k]; });
      renderCart();
      document.getElementById('field-note').value = '';
      document.querySelectorAll('#products-list input[data-index]').forEach(function (input) {
        input.value = 0;
      });
    } else {
      showMessage(result.error || '送出失敗，請稍後再試', 'error');
    }
  } catch (err) {
    showMessage('送出失敗，請確認網路連線後再試一次', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '送出訂單';
  }
}

// 「記住我的資料」只存在客人自己的瀏覽器，不需要登入
function loadProfile() {
  let profile = null;
  try {
    profile = JSON.parse(localStorage.getItem(PROFILE_KEY));
  } catch (err) {}
  if (!profile) return;
  document.getElementById('field-name').value = profile.name || '';
  document.getElementById('field-phone').value = profile.phone || '';
  document.getElementById('field-line').value = profile.lineId || '';
}

function saveProfile(profile) {
  const remember = document.getElementById('field-remember').checked;
  try {
    if (remember) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(PROFILE_KEY);
      ['field-name', 'field-phone', 'field-line'].forEach(function (id) {
        document.getElementById(id).value = '';
      });
    }
  } catch (err) {}
}

function showMessage(text, type) {
  const el = document.getElementById('form-message');
  el.textContent = text;
  el.className = `message show ${type}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
