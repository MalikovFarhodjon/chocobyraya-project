// Choco_by_Raya - Admin Panel Application Logic

const adminState = {
  token: localStorage.getItem('choco_admin_token') || 'demo-admin-token-12345',
  stats: null,
  products: [],
  categories: [],
  orders: [],
  reviews: [],
  settings: null,
  currentTab: 'dashboard'
};

// ================= Auth Helpers =================
function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminState.token}`
  };
}

async function checkAuth() {
  if (!adminState.token) {
    showLoginOverlay();
    return false;
  }
  try {
    const res = await fetch('/api/auth/check', {
      headers: { 'Authorization': `Bearer ${adminState.token}` }
    });
    const data = await res.json();
    if (data.success) {
      hideLoginOverlay();
      return true;
    } else {
      showLoginOverlay();
      return false;
    }
  } catch (err) {
    showLoginOverlay();
    return false;
  }
}

function showLoginOverlay() {
  const overlay = document.getElementById('loginOverlay');
  if (overlay) overlay.classList.remove('hidden');
}

function hideLoginOverlay() {
  const overlay = document.getElementById('loginOverlay');
  if (overlay) overlay.classList.add('hidden');
}

// Format Som
function formatSom(num) {
  return Number(num || 0).toLocaleString('uz-UZ') + " so'm";
}

// Format Date
function formatDate(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleDateString('uz-UZ') + ' ' + d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
}

// ================= Tab Navigation =================
window.switchTab = function(tabName) {
  adminState.currentTab = tabName;

  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('data-tab') === tabName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  document.querySelectorAll('.tab-pane').forEach(pane => {
    if (pane.id === `tab-${tabName}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  const titles = {
    dashboard: { title: 'Dashboard', sub: 'Tizim umumiy holati va statistika' },
    orders: { title: 'Buyurtmalar', sub: 'Mijozlar buyurtmalari va holatlar nazorati' },
    products: { title: 'Mahsulotlar', sub: 'Shirinliklar katalogi va narxlar' },
    categories: { title: 'Kategoriyalar', sub: 'Mahsulot toifalari va bo\'limlar' },
    reviews: { title: 'Mijozlar fikri', sub: 'Saytda ko\'rinadigan mijoz sharhlari' },
    settings: { title: 'Sayt Sozlamalari', sub: 'Kontent, kontaktlar va Telegram bot integratsiyasi' },
    security: { title: 'Xavfsizlik', sub: 'Admin paroli va xavfsizlik' }
  };

  const current = titles[tabName] || { title: 'Admin', sub: '' };
  document.getElementById('topbarTitle').textContent = current.title;
  document.getElementById('topbarSubtitle').textContent = current.sub;

  if (tabName === 'dashboard') loadStats();
  if (tabName === 'orders') loadOrders();
  if (tabName === 'products') loadProducts();
  if (tabName === 'categories') loadCategories();
  if (tabName === 'reviews') loadReviews();
  if (tabName === 'settings') loadSettings();
};

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const tab = item.getAttribute('data-tab');
    switchTab(tab);
  });
});

// ================= Data Loaders =================

// 1. Stats & Dashboard
async function loadStats() {
  try {
    const res = await fetch('/api/stats', { headers: getAuthHeaders() });
    const data = await res.json();
    if (data.success) {
      adminState.stats = data.data;
      document.getElementById('kpiTodayOrders').textContent = data.data.todayOrdersCount;
      document.getElementById('kpiTotalRevenue').textContent = formatSom(data.data.totalRevenue);
      document.getElementById('kpiTotalProducts').textContent = data.data.totalProducts;
      document.getElementById('kpiTotalReviews').textContent = data.data.totalReviews;

      renderRecentOrders(data.data.recentOrders || []);
    }
  } catch (err) {
    console.error('Stats error:', err);
  }
}

function renderRecentOrders(orders) {
  const tbody = document.getElementById('dashboardRecentOrdersTable');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">Hozircha buyurtmalar yo\'q</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><strong>${o.orderNumber}</strong></td>
      <td>${o.customerName}</td>
      <td>${o.customerPhone}</td>
      <td>${o.district || ''}</td>
      <td><strong>${formatSom(o.totalAmount)}</strong></td>
      <td><span class="status-badge status-${o.status.toLowerCase().replace(/\s+/g, '')}">${o.status}</span></td>
      <td>
        <button class="btn-admin-primary btn-admin-sm" onclick="viewOrderDetails('${o.id}')">Ko'rish</button>
      </td>
    </tr>
  `).join('');
}

// 2. Orders Tab
async function loadOrders() {
  const status = document.getElementById('orderStatusFilter')?.value || 'all';
  const search = document.getElementById('orderSearchInput')?.value.trim() || '';

  try {
    let url = `/api/orders?status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const res = await fetch(url, { headers: getAuthHeaders() });
    const data = await res.json();
    if (data.success) {
      adminState.orders = data.data;
      renderOrdersTable();
    }
  } catch (err) {
    console.error('Orders error:', err);
  }
}

function renderOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  if (adminState.orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 30px;">Buyurtmalar topilmadi</td></tr>';
    return;
  }

  tbody.innerHTML = adminState.orders.map(o => `
    <tr>
      <td><strong>${o.orderNumber}</strong></td>
      <td>${formatDate(o.createdAt)}</td>
      <td><strong>${o.customerName}</strong></td>
      <td>${o.customerPhone}</td>
      <td>${o.district}, ${o.address}</td>
      <td><strong>${formatSom(o.totalAmount)}</strong></td>
      <td>
        <select class="admin-select" style="padding: 4px 8px; font-size: 0.8rem;" onchange="updateOrderStatus('${o.id}', this.value)">
          <option value="Yangi" ${o.status === 'Yangi' ? 'selected' : ''}>🟡 Yangi</option>
          <option value="Tayyorlanmoqda" ${o.status === 'Tayyorlanmoqda' ? 'selected' : ''}>🔵 Tayyorlanmoqda</option>
          <option value="Yetkazilmoqda" ${o.status === 'Yetkazilmoqda' ? 'selected' : ''}>🟣 Yetkazilmoqda</option>
          <option value="Yetkazildi" ${o.status === 'Yetkazildi' ? 'selected' : ''}>🟢 Yetkazildi</option>
          <option value="Bekor qilindi" ${o.status === 'Bekor qilindi' ? 'selected' : ''}>🔴 Bekor qilindi</option>
        </select>
      </td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn-admin-edit btn-admin-sm" onclick="viewOrderDetails('${o.id}')">Batafsil</button>
          <button class="btn-admin-danger btn-admin-sm" onclick="deleteOrder('${o.id}')">O'chirish</button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.updateOrderStatus = async function(id, newStatus) {
  try {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      alert('Buyurtma holati yangilandi: ' + newStatus);
      loadOrders();
    }
  } catch (err) {
    alert('Statusni o\'zgartirishda xatolik');
  }
};

window.deleteOrder = async function(id) {
  if (!confirm('Haqiqatdan ham ushbu buyurtmani o\'chirmoqchimisiz?')) return;
  try {
    const res = await fetch(`/api/orders/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (data.success) {
      loadOrders();
    }
  } catch (err) {
    alert('O\'chirishda xatolik');
  }
};

window.viewOrderDetails = function(orderId) {
  const order = (adminState.orders.length ? adminState.orders : (adminState.stats?.recentOrders || [])).find(o => o.id === orderId);
  if (!order) return;

  const itemsHtml = (order.items || []).map(i => `
    <div style="display:flex; justify-content:space-between; margin-bottom:6px; padding-bottom:6px; border-bottom:1px dashed #eee;">
      <span>• ${i.name} <strong>x${i.quantity}</strong></span>
      <span>${formatSom(i.price * i.quantity)}</span>
    </div>
  `).join('');

  document.getElementById('orderDetailsContent').innerHTML = `
    <div style="background:#FDF8F9; padding:12px; border-radius:8px; margin-bottom:14px; border:1px solid #F6D6DC;">
      <div><strong>Buyurtma:</strong> ${order.orderNumber}</div>
      <div><strong>Sana:</strong> ${formatDate(order.createdAt)}</div>
      <div><strong>Holati:</strong> ${order.status}</div>
    </div>
    <div style="margin-bottom:14px;">
      <p>👤 <strong>Mijoz:</strong> ${order.customerName}</p>
      <p>📞 <strong>Telefon:</strong> ${order.customerPhone}</p>
      <p>📍 <strong>Manzil:</strong> ${order.district}, ${order.address}</p>
      <p>⏰ <strong>Yetkazish vaqti:</strong> ${order.deliveryDate} (${order.deliveryTime})</p>
      <p>💳 <strong>To'lov usuli:</strong> ${order.paymentMethod}</p>
      ${order.giftNote ? `<p style="margin-top:6px; background:#FFF4F6; padding:6px; border-radius:4px;">💌 <strong>Tabriknoma:</strong> "${order.giftNote}"</p>` : ''}
    </div>
    <h4 style="margin-bottom:8px; border-top:1px solid #eee; padding-top:10px;">Buyurtma tarkibi:</h4>
    ${itemsHtml}
    <div style="display:flex; justify-content:space-between; font-size:1.1rem; font-weight:700; margin-top:10px; color:var(--admin-primary);">
      <span>JAMI SUMMA:</span>
      <span>${formatSom(order.totalAmount)}</span>
    </div>
  `;

  document.getElementById('orderDetailsModal').classList.remove('hidden');
};

window.closeOrderModal = function() {
  document.getElementById('orderDetailsModal').classList.add('hidden');
};

// 3. Products Tab
async function loadProducts() {
  try {
    const [prodRes, catRes] = await Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/categories').then(r => r.json())
    ]);

    if (prodRes.success) adminState.products = prodRes.data;
    if (catRes.success) {
      adminState.categories = catRes.data;
      const select = document.getElementById('prodCategory');
      if (select) {
        select.innerHTML = adminState.categories.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');
      }
    }
    renderProductsTable();
  } catch (err) {
    console.error('Products error:', err);
  }
}

function renderProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  tbody.innerHTML = adminState.products.map(p => `
    <tr>
      <td>
        <img src="${p.image || '/images/prod_classic.jpg'}" style="width:48px; height:48px; border-radius:6px; object-fit:cover;">
      </td>
      <td><strong>${p.name}</strong><br><small style="color:var(--admin-text-muted);">${p.weight || ''}</small></td>
      <td><span style="background:#FCECEF; color:var(--admin-primary); padding:3px 8px; border-radius:4px; font-size:0.75rem; font-weight:600;">${p.category}</span></td>
      <td><strong>${formatSom(p.price)}</strong></td>
      <td>${p.oldPrice ? `<span style="text-decoration:line-through; color:#999;">${formatSom(p.oldPrice)}</span>` : '-'}</td>
      <td>${p.badge ? `<span style="background:#BA6475; color:#fff; padding:2px 6px; border-radius:4px; font-size:0.75rem;">${p.badge}</span>` : '-'}</td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn-admin-edit btn-admin-sm" onclick="editProduct('${p.id}')">Tahrirlash</button>
          <button class="btn-admin-danger btn-admin-sm" onclick="deleteProduct('${p.id}')">O'chirish</button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.openAddProductModal = function() {
  document.getElementById('productForm').reset();
  document.getElementById('prodId').value = '';
  document.getElementById('productModalTitle').textContent = 'Yangi Mahsulot Qo\'shish';
  document.getElementById('prodImagePreview').src = '/images/prod_classic.jpg';
  document.getElementById('prodImage').value = '/images/prod_classic.jpg';
  document.getElementById('productModal').classList.remove('hidden');
};

window.closeProductModal = function() {
  document.getElementById('productModal').classList.add('hidden');
};

window.editProduct = function(id) {
  const prod = adminState.products.find(p => p.id === id);
  if (!prod) return;

  document.getElementById('prodId').value = prod.id;
  document.getElementById('prodName').value = prod.name;
  document.getElementById('prodCategory').value = prod.category;
  document.getElementById('prodBadge').value = prod.badge || '';
  document.getElementById('prodPrice').value = prod.price;
  document.getElementById('prodOldPrice').value = prod.oldPrice || '';
  document.getElementById('prodWeight').value = prod.weight || '';
  document.getElementById('prodRating').value = prod.rating || 5;
  document.getElementById('prodDescription').value = prod.description || '';
  document.getElementById('prodImage').value = prod.image || '/images/prod_classic.jpg';
  document.getElementById('prodImagePreview').src = prod.image || '/images/prod_classic.jpg';

  document.getElementById('productModalTitle').textContent = 'Mahsulotni Tahrirlash';
  document.getElementById('productModal').classList.remove('hidden');
};

window.deleteProduct = async function(id) {
  if (!confirm('Haqiqatdan ham bu mahsulotni o\'chirmoqchimisiz?')) return;
  try {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (data.success) {
      loadProducts();
    }
  } catch (err) {
    alert('O\'chirishda xatolik yuz berdi');
  }
};

// Image file upload listener
const prodImageFileInput = document.getElementById('prodImageFile');
if (prodImageFileInput) {
  prodImageFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminState.token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('prodImage').value = data.url;
        document.getElementById('prodImagePreview').src = data.url;
      } else {
        alert(data.message || 'Rasm yuklashda xatolik');
      }
    } catch (err) {
      alert('Rasm yuklash server xatosi');
    }
  });
}

// Product Form Submit
const productForm = document.getElementById('productForm');
if (productForm) {
  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prodId').value;
    const payload = {
      name: document.getElementById('prodName').value.trim(),
      category: document.getElementById('prodCategory').value,
      badge: document.getElementById('prodBadge').value.trim(),
      price: document.getElementById('prodPrice').value,
      oldPrice: document.getElementById('prodOldPrice').value || null,
      weight: document.getElementById('prodWeight').value.trim(),
      rating: document.getElementById('prodRating').value,
      description: document.getElementById('prodDescription').value.trim(),
      image: document.getElementById('prodImage').value.trim() || '/images/prod_classic.jpg'
    };

    const url = id ? `/api/products/${id}` : '/api/products';
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        closeProductModal();
        loadProducts();
      } else {
        alert(data.message || 'Xatolik yuz berdi');
      }
    } catch (err) {
      alert('Server bilan bog\'lanishda xatolik');
    }
  });
}

// 4. Categories Tab
async function loadCategories() {
  try {
    const res = await fetch('/api/categories');
    const data = await res.json();
    if (data.success) {
      adminState.categories = data.data;
      renderCategoriesTable();
    }
  } catch (err) {
    console.error('Categories error:', err);
  }
}

function renderCategoriesTable() {
  const tbody = document.getElementById('categoriesTableBody');
  if (!tbody) return;

  tbody.innerHTML = adminState.categories.map(c => `
    <tr>
      <td>
        <img src="${c.image || '/images/cat_qulupnay.jpg'}" style="width:44px; height:44px; border-radius:6px; object-fit:cover;">
      </td>
      <td><strong>${c.name}</strong></td>
      <td><code>${c.slug}</code></td>
      <td><span style="background:#EBF5FF; color:#1D4ED8; padding:3px 8px; border-radius:4px; font-weight:600;">${c.badge || '0 mahsulot'}</span></td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn-admin-edit btn-admin-sm" onclick="editCategory('${c.id}')">Tahrirlash</button>
          <button class="btn-admin-danger btn-admin-sm" onclick="deleteCategory('${c.id}')">O'chirish</button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.openAddCategoryModal = function() {
  document.getElementById('categoryForm').reset();
  document.getElementById('catId').value = '';
  document.getElementById('categoryModalTitle').textContent = 'Yangi Kategoriya Qo\'shish';
  document.getElementById('categoryModal').classList.remove('hidden');
};

window.closeCategoryModal = function() {
  document.getElementById('categoryModal').classList.add('hidden');
};

window.editCategory = function(id) {
  const cat = adminState.categories.find(c => c.id === id);
  if (!cat) return;

  document.getElementById('catId').value = cat.id;
  document.getElementById('catName').value = cat.name;
  document.getElementById('catSlug').value = cat.slug;
  document.getElementById('catBadge').value = cat.badge || '';
  document.getElementById('catImage').value = cat.image || '/images/cat_qulupnay.jpg';

  document.getElementById('categoryModalTitle').textContent = 'Kategoriyani Tahrirlash';
  document.getElementById('categoryModal').classList.remove('hidden');
};

window.deleteCategory = async function(id) {
  if (!confirm('Ushbu kategoriyani o\'chirmoqchimisiz?')) return;
  try {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (data.success) {
      loadCategories();
    }
  } catch (err) {
    alert('O\'chirishda xatolik');
  }
};

const categoryForm = document.getElementById('categoryForm');
if (categoryForm) {
  categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('catId').value;
    const payload = {
      name: document.getElementById('catName').value.trim(),
      slug: document.getElementById('catSlug').value.trim(),
      badge: document.getElementById('catBadge').value.trim(),
      image: document.getElementById('catImage').value.trim()
    };

    const url = id ? `/api/categories/${id}` : '/api/categories';
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        closeCategoryModal();
        loadCategories();
      }
    } catch (err) {
      alert('Kategoriya saqlashda xatolik');
    }
  });
}

// 5. Reviews Tab
async function loadReviews() {
  try {
    const res = await fetch('/api/reviews?all=true', { headers: getAuthHeaders() });
    const data = await res.json();
    if (data.success) {
      adminState.reviews = data.data;
      renderReviewsTable();
    }
  } catch (err) {
    console.error('Reviews error:', err);
  }
}

function renderReviewsTable() {
  const tbody = document.getElementById('reviewsTableBody');
  if (!tbody) return;

  tbody.innerHTML = adminState.reviews.map(r => `
    <tr>
      <td><strong>${r.author}</strong></td>
      <td><span style="color:#F59E0B; font-weight:700;">${'★'.repeat(r.rating || 5)}</span></td>
      <td>"${r.comment}"</td>
      <td>${r.date || '-'}</td>
      <td>
        <button class="btn-admin-danger btn-admin-sm" onclick="deleteReview('${r.id}')">O'chirish</button>
      </td>
    </tr>
  `).join('');
}

window.deleteReview = async function(id) {
  if (!confirm('Ushbu fikrni o\'chirmoqchimisiz?')) return;
  try {
    const res = await fetch(`/api/reviews/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (data.success) {
      loadReviews();
    }
  } catch (err) {
    alert('O\'chirishda xatolik');
  }
};

window.openAddReviewModal = function() {
  document.getElementById('adminReviewForm').reset();
  document.getElementById('adminReviewModal').classList.remove('hidden');
};

window.closeAdminReviewModal = function() {
  document.getElementById('adminReviewModal').classList.add('hidden');
};

const adminReviewForm = document.getElementById('adminReviewForm');
if (adminReviewForm) {
  adminReviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      author: document.getElementById('adminRevAuthor').value.trim(),
      rating: document.getElementById('adminRevRating').value,
      comment: document.getElementById('adminRevComment').value.trim()
    };
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        closeAdminReviewModal();
        loadReviews();
      }
    } catch (err) {
      alert('Sharh qo\'shishda xatolik');
    }
  });
}

// 6. Settings Tab
async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.success) {
      adminState.settings = data.data;
      const s = data.data;
      document.getElementById('setBrandName').value = s.brandName || '';
      document.getElementById('setHeroBadge').value = s.heroBadge || '';
      document.getElementById('setSlogan').value = s.slogan || '';
      document.getElementById('setSubSlogan').value = s.subSlogan || '';
      document.getElementById('setPromoTitle').value = s.promoBannerTitle || '';
      document.getElementById('setPromoText').value = s.promoBannerText || '';
      document.getElementById('setPhone').value = s.phone || '';
      document.getElementById('setInstagram').value = s.instagram || '';
      document.getElementById('setTelegram').value = s.telegram || '';
      document.getElementById('setAddress').value = s.address || '';
      document.getElementById('setTgBotToken').value = s.telegramBotToken || '';
      document.getElementById('setTgChatId').value = s.telegramChatId || '';
    }
  } catch (err) {
    console.error('Settings load error:', err);
  }
}

const siteSettingsForm = document.getElementById('siteSettingsForm');
if (siteSettingsForm) {
  siteSettingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      brandName: document.getElementById('setBrandName').value.trim(),
      heroBadge: document.getElementById('setHeroBadge').value.trim(),
      slogan: document.getElementById('setSlogan').value.trim(),
      subSlogan: document.getElementById('setSubSlogan').value.trim(),
      promoBannerTitle: document.getElementById('setPromoTitle').value.trim(),
      promoBannerText: document.getElementById('setPromoText').value.trim(),
      phone: document.getElementById('setPhone').value.trim(),
      instagram: document.getElementById('setInstagram').value.trim(),
      telegram: document.getElementById('setTelegram').value.trim(),
      address: document.getElementById('setAddress').value.trim(),
      telegramBotToken: document.getElementById('setTgBotToken').value.trim(),
      telegramChatId: document.getElementById('setTgChatId').value.trim()
    };

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert('Sozlamalar muvaffaqiyatli saqlandi!');
      } else {
        alert(data.message || 'Xatolik yuz berdi');
      }
    } catch (err) {
      alert('Sozlamalarni saqlashda server xatosi');
    }
  });
}

// 7. Security Password Change
const changePasswordForm = document.getElementById('changePasswordForm');
if (changePasswordForm) {
  changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const oldPassword = document.getElementById('secOldPassword').value;
    const newPassword = document.getElementById('secNewPassword').value;
    const confirmPassword = document.getElementById('secConfirmPassword').value;

    if (newPassword !== confirmPassword) {
      alert('Yangi parollar bir-biriga mos kelmadi!');
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        alert('Parol muvaffaqiyatli o\'zgartirildi!');
        changePasswordForm.reset();
      } else {
        alert(data.message || 'Eski parol noto\'g\'ri');
      }
    } catch (err) {
      alert('Parolni yangilashda xatolik');
    }
  });
}

// Login Form Submit
const adminLoginForm = document.getElementById('adminLoginForm');
if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        adminState.token = data.token;
        localStorage.setItem('choco_admin_token', data.token);
        hideLoginOverlay();
        switchTab('dashboard');
      } else {
        alert(data.message || 'Login yoki parol noto\'g\'ri');
      }
    } catch (err) {
      alert('Tizimga kirishda xatolik yuz berdi');
    }
  });
}

// Logout
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
if (adminLogoutBtn) {
  adminLogoutBtn.addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (err) {}
    localStorage.removeItem('choco_admin_token');
    adminState.token = null;
    showLoginOverlay();
  });
}

// Modals open triggers
document.getElementById('openAddProductModalBtn')?.addEventListener('click', openAddProductModal);
document.getElementById('openAddCategoryModalBtn')?.addEventListener('click', openAddCategoryModal);
document.getElementById('openAddReviewModalBtn')?.addEventListener('click', openAddReviewModal);

// Filter listeners
document.getElementById('orderStatusFilter')?.addEventListener('change', loadOrders);
document.getElementById('orderSearchInput')?.addEventListener('input', () => {
  clearTimeout(window._searchTimer);
  window._searchTimer = setTimeout(loadOrders, 300);
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  const isAuth = await checkAuth();
  if (isAuth) {
    switchTab('dashboard');
  }
});
