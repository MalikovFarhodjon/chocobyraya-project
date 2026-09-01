import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Coolify'dagi reverse proxy ortida turamiz — req.hostname, req.protocol va
// req.ip to'g'ri bo'lishi uchun forwarded headerlarga ishonamiz.
app.set('trust proxy', true);

// admin.<domen> da ochilgan sayt admin panelni ko'rsatadi
function isAdminHost(req) {
  return (req.hostname || '').toLowerCase().startsWith('admin.');
}

// Admin session store (in-memory simple session tokens)
const activeSessions = new Set(['demo-admin-token-12345']);

// Ensure uploads folder exists
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'choco-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// express.static o'zi '/' uchun index.html qaytaradi, shuning uchun admin
// subdomen tekshiruvi undan oldin turishi shart.
app.get('/', (req, res, next) => {
  if (isAdminHost(req)) {
    return res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Admin Auth Middleware
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Avtorizatsiyadan o\'tilmagan' });
  }
  const token = authHeader.replace('Bearer ', '').trim();
  if (!activeSessions.has(token)) {
    return res.status(403).json({ success: false, message: 'Ruxsat berilmadi yoki sessiya tugagan' });
  }
  next();
}

// Helper to notify Telegram if configured
async function sendTelegramOrderNotification(order) {
  const settings = db.getSettings();
  if (!settings.telegramBotToken || !settings.telegramChatId) return;

  const itemsText = order.items.map(i => `• ${i.name} (${i.quantity} dona) - ${(i.price * i.quantity).toLocaleString()} so'm`).join('\n');
  const message = `🍓 <b>YANGI BUYURTMA: ${order.orderNumber}</b>\n\n` +
    `👤 <b>Mijoz:</b> ${order.customerName}\n` +
    `📞 <b>Telefon:</b> ${order.customerPhone}\n` +
    `📍 <b>Manzil:</b> ${order.district}, ${order.address}\n` +
    `📅 <b>Yetkazish vaqti:</b> ${order.deliveryDate} (${order.deliveryTime})\n` +
    `💳 <b>To'lov usuli:</b> ${order.paymentMethod}\n` +
    (order.giftNote ? `💌 <b>Tabriknoma:</b> <i>"${order.giftNote}"</i>\n` : '') +
    (order.notes ? `📝 <b>Qo'shimcha:</b> ${order.notes}\n` : '') +
    `\n🛍 <b>Buyurtma tarkibi:</b>\n${itemsText}\n\n` +
    `💰 <b>JAMI: ${order.totalAmount.toLocaleString()} so'm</b>\n` +
    `⏱ <b>Holati:</b> ${order.status}`;

  try {
    const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: settings.telegramChatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
  } catch (err) {
    console.error('Telegram notification error:', err.message);
  }
}

// ================= API ENDPOINTS =================

// --- Health check (Coolify uchun) ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// --- Auth ---
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (db.verifyAdmin(username, password)) {
    const token = 'token-' + Date.now() + '-' + Math.random().toString(36).substring(2);
    activeSessions.add(token);
    return res.json({
      success: true,
      token,
      admin: { username, name: 'Bosh Admin' }
    });
  }
  return res.status(401).json({ success: false, message: 'Login yoki parol noto\'g\'ri' });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '').trim();
    activeSessions.delete(token);
  }
  res.json({ success: true, message: 'Chiqildi' });
});

app.get('/api/auth/check', requireAdmin, (req, res) => {
  res.json({ success: true, valid: true });
});

app.post('/api/auth/change-password', requireAdmin, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Barcha maydonlarni to\'ldiring' });
  }
  const changed = db.updateAdminPassword(oldPassword, newPassword);
  if (!changed) {
    return res.status(400).json({ success: false, message: 'Eski parol noto\'g\'ri' });
  }
  res.json({ success: true, message: 'Parol muvaffaqiyatli o\'zgartirildi' });
});

// --- Uploads ---
app.post('/api/upload', requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Fayl tanlanmadi' });
  }
  const fileUrl = '/uploads/' + req.file.filename;
  res.json({ success: true, url: fileUrl });
});

// --- Products ---
app.get('/api/products', (req, res) => {
  const { category, search, popularOnly } = req.query;
  const products = db.getProducts({ category, search, popularOnly: popularOnly === 'true' });
  res.json({ success: true, data: products });
});

app.get('/api/products/:id', (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Mahsulot topilmadi' });
  }
  res.json({ success: true, data: product });
});

app.post('/api/products', requireAdmin, (req, res) => {
  const created = db.addProduct(req.body);
  res.json({ success: true, data: created, message: 'Mahsulot muvaffaqiyatli qo\'shildi' });
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
  const updated = db.updateProduct(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Mahsulot topilmadi' });
  }
  res.json({ success: true, data: updated, message: 'Mahsulot yangilandi' });
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  const deleted = db.deleteProduct(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Mahsulot topilmadi' });
  }
  res.json({ success: true, message: 'Mahsulot o\'chirildi' });
});

// --- Categories ---
app.get('/api/categories', (req, res) => {
  const categories = db.getCategories();
  // enrich with live products count
  const allProds = db.getProducts();
  const enriched = categories.map(c => {
    const count = allProds.filter(p => p.category === c.slug).length;
    return {
      ...c,
      productCount: count,
      badge: `${count}+ mahsulot`
    };
  });
  res.json({ success: true, data: enriched });
});

app.post('/api/categories', requireAdmin, (req, res) => {
  const created = db.addCategory(req.body);
  res.json({ success: true, data: created, message: 'Kategoriya yaratildi' });
});

app.put('/api/categories/:id', requireAdmin, (req, res) => {
  const updated = db.updateCategory(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Kategoriya topilmadi' });
  }
  res.json({ success: true, data: updated, message: 'Kategoriya yangilandi' });
});

app.delete('/api/categories/:id', requireAdmin, (req, res) => {
  const deleted = db.deleteCategory(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Kategoriya topilmadi' });
  }
  res.json({ success: true, message: 'Kategoriya o\'chirildi' });
});

// --- Orders ---
app.get('/api/orders', requireAdmin, (req, res) => {
  const { status, search } = req.query;
  const orders = db.getOrders({ status, search });
  res.json({ success: true, data: orders });
});

app.post('/api/orders', (req, res) => {
  const orderData = req.body;
  if (!orderData.customerName || !orderData.customerPhone || !orderData.items || orderData.items.length === 0) {
    return res.status(400).json({ success: false, message: 'Ism, telefon va buyurtma mahsulotlari kiritilishi shart' });
  }
  const created = db.createOrder(orderData);
  sendTelegramOrderNotification(created);
  res.json({
    success: true,
    data: created,
    message: 'Buyurtmangiz muvaffaqiyatli qabul qilindi! Tez orada operatorimiz siz bilan bog\'lanadi.'
  });
});

app.patch('/api/orders/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, message: 'Status kiritilmadi' });
  }
  const updated = db.updateOrderStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Buyurtma topilmadi' });
  }
  res.json({ success: true, data: updated, message: 'Buyurtma holati o\'zgartirildi' });
});

app.delete('/api/orders/:id', requireAdmin, (req, res) => {
  const deleted = db.deleteOrder(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Buyurtma topilmadi' });
  }
  res.json({ success: true, message: 'Buyurtma o\'chirildi' });
});

// --- Reviews ---
app.get('/api/reviews', (req, res) => {
  const { all } = req.query;
  const reviews = db.getReviews(all !== 'true');
  res.json({ success: true, data: reviews });
});

app.post('/api/reviews', (req, res) => {
  const { author, comment, rating } = req.body;
  if (!author || !comment) {
    return res.status(400).json({ success: false, message: 'Ism va fikringizni kiriting' });
  }
  const review = db.addReview({ author, comment, rating, status: 'approved' });
  res.json({ success: true, data: review, message: 'Fikringiz uchun minnatdormiz!' });
});

app.patch('/api/reviews/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  const updated = db.updateReviewStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Sharh topilmadi' });
  }
  res.json({ success: true, data: updated, message: 'Sharh statusi yangilandi' });
});

app.delete('/api/reviews/:id', requireAdmin, (req, res) => {
  const deleted = db.deleteReview(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Sharh topilmadi' });
  }
  res.json({ success: true, message: 'Sharh o\'chirildi' });
});

// --- Settings ---
app.get('/api/settings', (req, res) => {
  res.json({ success: true, data: db.getSettings() });
});

app.put('/api/settings', requireAdmin, (req, res) => {
  const updated = db.updateSettings(req.body);
  res.json({ success: true, data: updated, message: 'Sozlamalar muvaffaqiyatli saqlandi' });
});

// --- Stats ---
app.get('/api/stats', requireAdmin, (req, res) => {
  res.json({ success: true, data: db.getStats() });
});

// Fallback to index.html or admin.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint topilmadi' });
  }
  if (isAdminHost(req)) {
    return res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🍓 Choco_by_Raya server is running on http://localhost:${PORT}`);
  console.log(`👑 Admin panel: http://localhost:${PORT}/admin`);
});
