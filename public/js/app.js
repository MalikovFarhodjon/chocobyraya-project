// Choco_by_Raya - Interactive Application Logic

const state = {
  products: [],
  categories: [],
  reviews: [],
  settings: {},
  activeCategory: 'all',
  cart: JSON.parse(localStorage.getItem('choco_cart') || '[]'),
  wishlist: JSON.parse(localStorage.getItem('choco_wishlist') || '[]'),
};

// ================= DOM Elements =================
const elements = {
  headerBrandName: document.getElementById('headerBrandName'),
  heroBadge: document.getElementById('heroBadge'),
  heroTitle: document.getElementById('heroTitle'),
  heroSubtitle: document.getElementById('heroSubtitle'),
  promoBannerTitle: document.getElementById('promoBannerTitle'),
  promoBannerText: document.getElementById('promoBannerText'),
  footerPhone: document.getElementById('footerPhone'),
  footerInstaTag: document.getElementById('footerInstaTag'),
  footerTgTag: document.getElementById('footerTgTag'),
  footerAddress: document.getElementById('footerAddress'),
  footerInstagram: document.getElementById('footerInstagram'),
  footerTelegram: document.getElementById('footerTelegram'),
  categoriesGrid: document.getElementById('categoriesGrid'),
  productFilterBar: document.getElementById('productFilterBar'),
  productsGrid: document.getElementById('productsGrid'),
  testimonialsGrid: document.getElementById('testimonialsGrid'),
  cartBadge: document.getElementById('cartBadge'),
  cartBtn: document.getElementById('cartBtn'),
  cartDrawer: document.getElementById('cartDrawer'),
  drawerOverlay: document.getElementById('drawerOverlay'),
  closeCartBtn: document.getElementById('closeCartBtn'),
  cartItemsList: document.getElementById('cartItemsList'),
  cartTotalSum: document.getElementById('cartTotalSum'),
  openCheckoutBtn: document.getElementById('openCheckoutBtn'),
  checkoutModal: document.getElementById('checkoutModal'),
  closeCheckoutBtn: document.getElementById('closeCheckoutBtn'),
  checkoutForm: document.getElementById('checkoutForm'),
  quickViewModal: document.getElementById('quickViewModal'),
  closeQuickViewBtn: document.getElementById('closeQuickViewBtn'),
  quickViewContent: document.getElementById('quickViewContent'),
  searchBtn: document.getElementById('searchBtn'),
  searchModal: document.getElementById('searchModal'),
  closeSearchBtn: document.getElementById('closeSearchBtn'),
  searchInput: document.getElementById('searchInput'),
  searchResultsList: document.getElementById('searchResultsList'),
  openReviewModalBtn: document.getElementById('openReviewModalBtn'),
  reviewModal: document.getElementById('reviewModal'),
  closeReviewBtn: document.getElementById('closeReviewBtn'),
  reviewForm: document.getElementById('reviewForm'),
  toastContainer: document.getElementById('toastContainer'),
};

// Format currency
function formatSom(amount) {
  return Number(amount || 0).toLocaleString('uz-UZ') + " so'm";
}

// Toast Helper
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  const icon = type === 'success' ? '🍓' : '⚠️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ================= Fetch API Data =================
async function loadData() {
  try {
    const [settingsRes, categoriesRes, productsRes, reviewsRes] = await Promise.all([
      fetch('/api/settings').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
      fetch('/api/reviews').then(r => r.json()),
    ]);

    if (settingsRes.success) {
      state.settings = settingsRes.data;
      renderSettings();
    }
    if (categoriesRes.success) {
      state.categories = categoriesRes.data;
      renderCategories();
    }
    if (productsRes.success) {
      state.products = productsRes.data;
      renderProducts();
    }
    if (reviewsRes.success) {
      state.reviews = reviewsRes.data;
      renderReviews();
    }
  } catch (err) {
    console.error('Data load error:', err);
    showToast('Ma\'lumotlarni yuklashda xatolik yuz berdi', 'error');
  }
}

// Render Settings
function renderSettings() {
  const s = state.settings;
  if (!s) return;
  if (s.brandName && elements.headerBrandName) elements.headerBrandName.textContent = s.brandName;
  if (s.heroBadge && elements.heroBadge) elements.heroBadge.textContent = s.heroBadge;
  if (s.slogan && elements.heroTitle) {
    elements.heroTitle.innerHTML = `${s.slogan} <span class="heart">♡</span>`;
  }
  if (s.subSlogan && elements.heroSubtitle) elements.heroSubtitle.textContent = s.subSlogan;
  if (s.promoBannerTitle && elements.promoBannerTitle) elements.promoBannerTitle.textContent = s.promoBannerTitle;
  if (s.promoBannerText && elements.promoBannerText) elements.promoBannerText.textContent = s.promoBannerText;
  if (s.phone && elements.footerPhone) elements.footerPhone.textContent = s.phone;
  if (s.instagram && elements.footerInstaTag) {
    elements.footerInstaTag.textContent = '@' + s.instagram;
    if (elements.footerInstagram) elements.footerInstagram.href = `https://instagram.com/${s.instagram}`;
  }
  if (s.telegram && elements.footerTgTag) {
    elements.footerTgTag.textContent = `t.me/${s.telegram}`;
    if (elements.footerTelegram) elements.footerTelegram.href = `https://t.me/${s.telegram}`;
  }
  if (s.address && elements.footerAddress) elements.footerAddress.textContent = s.address;
}

// Render Categories
function renderCategories() {
  if (!elements.categoriesGrid) return;
  elements.categoriesGrid.innerHTML = state.categories.map(cat => `
    <div class="category-card ${state.activeCategory === cat.slug ? 'active' : ''}" onclick="selectCategory('${cat.slug}')">
      <div class="category-img-box">
        <img src="${cat.image || '/images/cat_qulupnay.jpg'}" alt="${cat.name}">
      </div>
      <div class="category-info">
        <div>
          <h3 class="category-name">${cat.name}</h3>
          <p class="category-count">${cat.badge || '10+ mahsulot'}</p>
        </div>
        <div class="category-arrow">➔</div>
      </div>
    </div>
  `).join('');

  // Also render filter chips
  if (elements.productFilterBar) {
    let chipsHtml = `<button class="filter-chip ${state.activeCategory === 'all' ? 'active' : ''}" onclick="selectCategory('all')">Barchasi</button>`;
    state.categories.forEach(cat => {
      chipsHtml += `<button class="filter-chip ${state.activeCategory === cat.slug ? 'active' : ''}" onclick="selectCategory('${cat.slug}')">${cat.name}</button>`;
    });
    elements.productFilterBar.innerHTML = chipsHtml;
  }
}

// Category selection
window.selectCategory = function(slug) {
  state.activeCategory = slug;
  renderCategories();
  renderProducts();
  const prodSec = document.getElementById('products');
  if (prodSec) {
    prodSec.scrollIntoView({ behavior: 'smooth' });
  }
};

// Render Products Grid
function renderProducts() {
  if (!elements.productsGrid) return;
  let list = state.products;
  if (state.activeCategory !== 'all') {
    list = list.filter(p => p.category === state.activeCategory);
  }

  if (list.length === 0) {
    elements.productsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
        <p style="font-size: 1.1rem;">Ushbu toifada hozircha mahsulotlar mavjud emas.</p>
      </div>
    `;
    return;
  }

  elements.productsGrid.innerHTML = list.map(prod => {
    const isFav = state.wishlist.includes(prod.id);
    return `
      <div class="product-card">
        <div class="product-thumb-wrap">
          <img src="${prod.image || '/images/prod_classic.jpg'}" alt="${prod.name}" loading="lazy" onclick="openQuickView('${prod.id}')" style="cursor:pointer;">
          ${prod.badge ? `<span class="product-tag">${prod.badge}</span>` : ''}
          <button class="product-fav-btn ${isFav ? 'active' : ''}" onclick="toggleWishlist('${prod.id}')" title="Saralanganlarga qo'shish">
            ♥
          </button>
        </div>
        <div class="product-body">
          <h3 class="product-title" onclick="openQuickView('${prod.id}')">${prod.name}</h3>
          <p class="product-desc-snippet">${prod.description || ''}</p>
          <div class="product-price-row">
            <span class="product-price">${formatSom(prod.price)}</span>
            ${prod.oldPrice ? `<span class="product-old-price">${formatSom(prod.oldPrice)}</span>` : ''}
          </div>
          <button class="btn-add-cart" onclick="addToCart('${prod.id}')">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            <span>Savatga qo'shish</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Render Reviews
function renderReviews() {
  if (!elements.testimonialsGrid) return;
  elements.testimonialsGrid.innerHTML = state.reviews.map(rev => `
    <div class="testimonial-card">
      <div class="testimonial-quote-icon">“</div>
      <p class="testimonial-text">"${rev.comment}"</p>
      <div class="testimonial-stars">
        ${'★'.repeat(rev.rating || 5)}${'☆'.repeat(5 - (rev.rating || 5))}
      </div>
      <div class="testimonial-author">${rev.author}</div>
    </div>
  `).join('');
}

// ================= Wishlist Logic =================
window.toggleWishlist = function(productId) {
  const index = state.wishlist.indexOf(productId);
  if (index > -1) {
    state.wishlist.splice(index, 1);
    showToast('Saralanganlardan o\'chirildi');
  } else {
    state.wishlist.push(productId);
    showToast('Saralanganlarga qo\'shildi ♡');
  }
  localStorage.setItem('choco_wishlist', JSON.stringify(state.wishlist));
  renderProducts();
};

// ================= Cart Logic =================
window.addToCart = function(productId, quantity = 1) {
  const prod = state.products.find(p => p.id === productId);
  if (!prod) return;

  const existing = state.cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    state.cart.push({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      image: prod.image,
      quantity: quantity
    });
  }

  saveCart();
  showToast(`"${prod.name}" savatga qo'shildi!`);
};

function saveCart() {
  localStorage.setItem('choco_cart', JSON.stringify(state.cart));
  updateCartUI();
}

function updateCartUI() {
  const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  if (elements.cartBadge) {
    elements.cartBadge.textContent = totalCount;
    elements.cartBadge.style.transform = 'scale(1.3)';
    setTimeout(() => elements.cartBadge.style.transform = 'scale(1)', 200);
  }

  const totalSum = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  if (elements.cartTotalSum) {
    elements.cartTotalSum.textContent = formatSom(totalSum);
  }

  if (!elements.cartItemsList) return;
  if (state.cart.length === 0) {
    elements.cartItemsList.innerHTML = `
      <div class="empty-cart-state">
        <div class="empty-cart-icon">🛍️</div>
        <h4>Savatchangiz bo'sh</h4>
        <p>Shirinliklarimizdan tanlab savatga qo'shing</p>
      </div>
    `;
    return;
  }

  elements.cartItemsList.innerHTML = state.cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">
        <img src="${item.image || '/images/prod_classic.jpg'}" alt="${item.name}">
      </div>
      <div class="cart-item-details">
        <h4 class="cart-item-title">${item.name}</h4>
        <div class="cart-item-price">${formatSom(item.price)}</div>
        <div class="cart-qty-ctrls">
          <button class="qty-btn" onclick="changeQuantity('${item.id}', -1)">-</button>
          <span class="qty-val">${item.quantity}</span>
          <button class="qty-btn" onclick="changeQuantity('${item.id}', 1)">+</button>
        </div>
      </div>
      <button class="cart-remove-btn" onclick="removeFromCart('${item.id}')" title="O'chirish">&times;</button>
    </div>
  `).join('');
}

window.changeQuantity = function(id, delta) {
  const item = state.cart.find(i => i.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter(i => i.id !== id);
  }
  saveCart();
};

window.removeFromCart = function(id) {
  state.cart = state.cart.filter(i => i.id !== id);
  saveCart();
  showToast('Mahsulot savatchadan olib tashlandi');
};

// Cart Drawer open/close
function openCart() {
  updateCartUI();
  elements.cartDrawer.classList.add('active');
  elements.drawerOverlay.classList.add('active');
}

function closeCart() {
  elements.cartDrawer.classList.remove('active');
  elements.drawerOverlay.classList.remove('active');
}

if (elements.cartBtn) elements.cartBtn.addEventListener('click', openCart);
if (elements.closeCartBtn) elements.closeCartBtn.addEventListener('click', closeCart);
if (elements.drawerOverlay) elements.drawerOverlay.addEventListener('click', closeCart);

// ================= Quick View Modal =================
window.openQuickView = function(productId) {
  const prod = state.products.find(p => p.id === productId);
  if (!prod) return;

  elements.quickViewContent.innerHTML = `
    <div class="quick-view-img">
      <img src="${prod.image || '/images/prod_classic.jpg'}" alt="${prod.name}">
    </div>
    <div class="quick-view-details">
      <h3>${prod.name}</h3>
      <div class="quick-view-price">${formatSom(prod.price)}</div>
      <p class="quick-view-desc">${prod.description || ''}</p>
      ${prod.details ? `<div class="quick-view-meta"><strong>Tarkibi:</strong> ${prod.details}</div>` : ''}
      ${prod.weight ? `<div class="quick-view-meta"><strong>Vazni:</strong> ${prod.weight}</div>` : ''}
      <button class="btn-primary" style="width: 100%; margin-top: 10px;" onclick="addToCart('${prod.id}'); closeQuickView();">
        <span>Savatga qo'shish</span>
      </button>
    </div>
  `;

  elements.quickViewModal.classList.add('active');
};

function closeQuickView() {
  elements.quickViewModal.classList.remove('active');
}
if (elements.closeQuickViewBtn) elements.closeQuickViewBtn.addEventListener('click', closeQuickView);

// ================= Checkout Modal & Submit =================
if (elements.openCheckoutBtn) {
  elements.openCheckoutBtn.addEventListener('click', () => {
    if (state.cart.length === 0) {
      showToast('Savatchangiz bo\'sh. Iltimos, mahsulot tanlang.', 'error');
      return;
    }
    closeCart();
    elements.checkoutModal.classList.add('active');
  });
}

if (elements.closeCheckoutBtn) {
  elements.closeCheckoutBtn.addEventListener('click', () => {
    elements.checkoutModal.classList.remove('active');
  });
}

if (elements.checkoutForm) {
  elements.checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const customerName = document.getElementById('custName').value.trim();
    const customerPhone = document.getElementById('custPhone').value.trim();
    const district = document.getElementById('custDistrict').value;
    const address = document.getElementById('custAddress').value.trim();
    const deliveryTime = document.getElementById('custDeliveryTime').value;
    const giftNote = document.getElementById('custGiftNote').value.trim();
    const paymentMethod = document.querySelector('input[name="payMethod"]:checked')?.value || 'Naqd';

    const totalAmount = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderPayload = {
      customerName,
      customerPhone,
      district,
      address,
      deliveryDate: new Date().toISOString().split('T')[0],
      deliveryTime,
      giftNote,
      paymentMethod,
      items: state.cart,
      totalAmount
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();

      if (data.success) {
        state.cart = [];
        saveCart();
        elements.checkoutModal.classList.remove('active');
        elements.checkoutForm.reset();

        showToast(`Rahmat! Buyurtmangiz #${data.data.orderNumber} qabul qilindi!`);
      } else {
        showToast(data.message || 'Xatolik yuz berdi', 'error');
      }
    } catch (err) {
      console.error('Order submit error:', err);
      showToast('Buyurtma yuborishda xatolik yuz berdi', 'error');
    }
  });
}

// ================= Search Modal =================
if (elements.searchBtn) {
  elements.searchBtn.addEventListener('click', () => {
    elements.searchModal.classList.add('active');
    setTimeout(() => elements.searchInput.focus(), 100);
  });
}

if (elements.closeSearchBtn) {
  elements.closeSearchBtn.addEventListener('click', () => {
    elements.searchModal.classList.remove('active');
  });
}

if (elements.searchInput) {
  elements.searchInput.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      elements.searchResultsList.innerHTML = '';
      return;
    }
    const matched = state.products.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
    if (matched.length === 0) {
      elements.searchResultsList.innerHTML = '<p style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:10px;">Mahsulot topilmadi</p>';
      return;
    }
    elements.searchResultsList.innerHTML = matched.map(p => `
      <div style="display:flex; align-items:center; gap:12px; padding:8px; border-radius:8px; background:#FAF3F5; cursor:pointer;" onclick="openQuickView('${p.id}'); elements.searchModal.classList.remove('active');">
        <img src="${p.image || '/images/prod_classic.jpg'}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;">
        <div>
          <div style="font-weight:600; font-size:0.9rem; color:var(--chocolate);">${p.name}</div>
          <div style="font-size:0.8rem; color:var(--deep-rose); font-weight:700;">${formatSom(p.price)}</div>
        </div>
      </div>
    `).join('');
  });
}

// ================= Review Modal =================
if (elements.openReviewModalBtn) {
  elements.openReviewModalBtn.addEventListener('click', () => {
    elements.reviewModal.classList.add('active');
  });
}

if (elements.closeReviewBtn) {
  elements.closeReviewBtn.addEventListener('click', () => {
    elements.reviewModal.classList.remove('active');
  });
}

if (elements.reviewForm) {
  elements.reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const author = document.getElementById('revAuthor').value.trim();
    const rating = document.getElementById('revRating').value;
    const comment = document.getElementById('revComment').value.trim();

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, rating, comment })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Fikringiz muvaffaqiyatli qabul qilindi! Rahmat ♡');
        elements.reviewModal.classList.remove('active');
        elements.reviewForm.reset();
        state.reviews.unshift(data.data);
        renderReviews();
      }
    } catch (err) {
      showToast('Fikr yuborishda xatolik yuz berdi', 'error');
    }
  });
}

// Navbar scroll shadow
window.addEventListener('scroll', () => {
  const header = document.getElementById('siteHeader');
  if (window.scrollY > 40) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  updateCartUI();
});
