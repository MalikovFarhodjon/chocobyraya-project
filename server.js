import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
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

// Admin sessiyalari (xotirada). Token -> tugash vaqti.
// Hech qanday oldindan yozilgan ("demo") token yo'q: sessiya faqat
// muvaffaqiyatli login orqali paydo bo'ladi.
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 soat
const activeSessions = new Map();

function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  activeSessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

function isValidSession(token) {
  const expiresAt = activeSessions.get(token);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    activeSessions.delete(token);
    return false;
  }
  return true;
}

// Muddati o'tgan sessiyalarni vaqti-vaqti bilan tozalab turamiz
setInterval(() => {
  const now = Date.now();
  for (const [token, expiresAt] of activeSessions) {
    if (now > expiresAt) activeSessions.delete(token);
  }
}, 60 * 60 * 1000).unref();

// Login urinishlarini IP bo'yicha cheklash (brute-force'ga qarshi)
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;
const loginAttempts = new Map();

function loginRateLimit(req, res, next) {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 0, resetAt: now + LOGIN_WINDOW_MS });
  } else if (entry.count >= LOGIN_MAX_ATTEMPTS) {
    const minutes = Math.ceil((entry.resetAt - now) / 60000);
    return res.status(429).json({
      success: false,
      message: `Juda ko'p urinish. ${minutes} daqiqadan so'ng qayta urinib ko'ring.`
    });
  }
  next();
}

function noteFailedLogin(req) {
  const entry = loginAttempts.get(req.ip || 'unknown');
  if (entry) entry.count += 1;
}

function clearLoginAttempts(req) {
  loginAttempts.delete(req.ip || 'unknown');
}

// Ensure uploads folder exists
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer setup for image uploads
// Faqat rasm yuklashga ruxsat. Kengaytma foydalanuvchi yuborgan nomdan emas,
// shu ro'yxatdan olinadi — aks holda .html/.js yuklab, uni sayt domenidan
// ochib yuborish mumkin bo'lardi.
const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = ALLOWED_IMAGE_TYPES[file.mimetype] || '.bin';
    const uniqueSuffix = crypto.randomBytes(12).toString('hex');
    cb(null, 'choco-' + Date.now() + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5MB
  fileFilter: function (req, file, cb) {
    if (!ALLOWED_IMAGE_TYPES[file.mimetype]) {
      return cb(new Error('Faqat rasm yuklash mumkin (JPG, PNG, WebP, GIF)'));
    }
    cb(null, true);
  }
});

// CORS: sukut bo'yicha faqat o'z domenidan (same-origin) so'rovlarga ruxsat.
// Qo'shimcha domenlar kerak bo'lsa, ALLOWED_ORIGINS orqali beriladi.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors((req, cb) => {
  const origin = req.headers.origin;
  let allowed = false;
  if (!origin) {
    allowed = true; // oddiy navigatsiya yoki server-to-server so'rov
  } else if (allowedOrigins.includes(origin)) {
    allowed = true;
  } else {
    try {
      allowed = new URL(origin).host === req.headers.host;
    } catch {
      allowed = false;
    }
  }
  cb(null, { origin: allowed, credentials: false });
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Asosiy xavfsizlik headerlari (qo'shimcha paketsiz)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.removeHeader('X-Powered-By');
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Admin panel fayllari faqat admin subdomenida beriladi. Asosiy domenda
// ular umuman yo'qdek ko'rinadi (oddiy sahifa qaytadi), shunda tasodifiy
// tashrifchi admin panel borligini ham bilmaydi.
const ADMIN_ASSETS = new Set(['/admin', '/admin.html', '/css/admin.css', '/js/admin.js']);

app.use((req, res, next) => {
  if (ADMIN_ASSETS.has(req.path) && !isAdminHost(req)) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

// robots.txt hostga qarab beriladi: admin subdomen qidiruv tizimlariga
// umuman indekslanmasligi kerak.
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  if (isAdminHost(req)) {
    return res.send('User-agent: *\nDisallow: /\n');
  }
  res.send(
    'User-agent: *\n' +
    'Allow: /\n' +
    'Disallow: /api/\n' +
    'Disallow: /uploads/\n\n' +
    'Sitemap: https://chocobyraya.uz/sitemap.xml\n'
  );
});

// express.static o'zi '/' uchun index.html qaytaradi, shuning uchun admin
// subdomen tekshiruvi undan oldin turishi shart.
app.get('/', (req, res, next) => {
  if (isAdminHost(req)) {
    return res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders(res, filePath) {
    if (/[\\/](images|uploads)[\\/]/.test(filePath)) {
      // Rasm nomlari o'zgarmaydi, uzoq keshlash mumkin
      res.setHeader('Cache-Control', 'public, max-age=2592000');
    } else if (/\.html$/.test(filePath)) {
      // HTML har doim yangilanib tursin
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }
}));

// Admin Auth Middleware
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Avtorizatsiyadan o\'tilmagan' });
  }
  const token = authHeader.replace('Bearer ', '').trim();
  if (!isValidSession(token)) {
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
app.post('/api/auth/login', loginRateLimit, (req, res) => {
  const { username, password } = req.body;
  if (db.verifyAdmin(username, password)) {
    clearLoginAttempts(req);
    const token = createSession();
    return res.json({
      success: true,
      token,
      admin: { username, name: 'Bosh Admin' }
    });
  }
  noteFailedLogin(req);
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
  if (String(newPassword).length < 10) {
    return res.status(400).json({ success: false, message: 'Yangi parol kamida 10 ta belgidan iborat bo\'lishi kerak' });
  }
  const changed = db.updateAdminPassword(oldPassword, newPassword);
  if (!changed) {
    return res.status(400).json({ success: false, message: 'Eski parol noto\'g\'ri' });
  }
  // Parol o'zgargach barcha eski sessiyalar bekor qilinadi
  activeSessions.clear();
  res.json({ success: true, message: 'Parol o\'zgartirildi. Iltimos, qaytadan kiring.' });
});

// --- Uploads ---
app.post('/api/upload', requireAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Fayl tanlanmadi' });
    }
    res.json({ success: true, url: '/uploads/' + req.file.filename });
  });
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
// Sozlamalar: Telegram kalitlari faqat tizimga kirgan adminga ko'rinadi
app.get('/api/settings', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  const data = isValidSession(token) ? db.getSettings() : db.getPublicSettings();
  res.json({ success: true, data });
});

app.put('/api/settings', requireAdmin, (req, res) => {
  const updated = db.updateSettings(req.body);
  res.json({ success: true, data: updated, message: 'Sozlamalar muvaffaqiyatli saqlandi' });
});

// --- Stats ---
app.get('/api/stats', requireAdmin, (req, res) => {
  res.json({ success: true, data: db.getStats() });
});

// Bu yo'lga faqat admin subdomenidan kelinadi — yuqoridagi ADMIN_ASSETS
// tekshiruvi boshqa domenlarni bu yergacha o'tkazmaydi.
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
  console.log(`🍓 Choco_by_Raya server is running on port ${PORT}`);
});
