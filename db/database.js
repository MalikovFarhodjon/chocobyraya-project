import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'store.json');

const initialData = {
  admin: {
    username: 'admin',
    password: 'admin123',
    name: 'Raya (Bosh Admin)',
    email: 'admin@chocobyraya.uz'
  },
  settings: {
    brandName: 'Choco_by_Raya',
    slogan: 'Har bir qulupnayda muhabbat va nafislik ♡',
    subSlogan: 'Qo\'lda tayyorlangan shokoladli qulupnaylar va shirinliklar — sevimli insoningiz uchun eng mazali sovg\'a.',
    heroBadge: 'SEVGI BILAN, SIZ UCHUN',
    topBarAnnouncements: [
      'Yetkazib berish Toshkent bo\'ylab bepul',
      '100% sifatli mahsulotlar',
      'Qo\'lda tayyorlangan muhtasham ta\'m'
    ],
    phone: '+998 90 123 45 67',
    phoneFormatted: '+998 (90) 123-45-67',
    instagram: 'choco_by_raya',
    telegram: 'choco_by_raya',
    address: 'Toshkent sh., Amir Temur shoh ko\'chasi, 107-uy',
    workingHours: '09:00 - 22:00 (Har kuni dam olishsiz)',
    deliveryFee: 0,
    freeDeliveryThreshold: 0,
    promoBannerTitle: 'Sevimli insoningiz uchun nimalardir izlayapsizmi?',
    promoBannerText: 'Maxsus to\'plamlarimiz bilan tanishing va eng chiroyli sovg\'ani tanlang.',
    telegramBotToken: '',
    telegramChatId: ''
  },
  categories: [
    {
      id: 'cat-1',
      slug: 'qulupnaylar',
      name: 'Qulupnaylar',
      badge: '10+ mahsulot',
      image: '/images/cat_qulupnay.jpg',
      description: 'Shokoladli yangi uzilgan sara qulupnaylar',
      displayOrder: 1
    },
    {
      id: 'cat-2',
      slug: 'toplamlar',
      name: 'To\'plamlar',
      badge: '15+ mahsulot',
      image: '/images/cat_toplam.jpg',
      description: 'Nafis sovg\'abop to\'plamlar va qutilar',
      displayOrder: 2
    },
    {
      id: 'cat-3',
      slug: 'shokoladlar',
      name: 'Shokoladlar',
      badge: '12+ mahsulot',
      image: '/images/cat_shokolad.jpg',
      description: 'Belgiya shokoladidan tayyorlangan eksklyuziv shirinliklar',
      displayOrder: 3
    },
    {
      id: 'cat-4',
      slug: 'sovgalar',
      name: 'Sovg\'alar',
      badge: '8+ mahsulot',
      image: '/images/cat_sovga.jpg',
      description: 'Yurak shaklidagi va romantik bayramona sovg\'alar',
      displayOrder: 4
    },
    {
      id: 'cat-5',
      slug: 'shirin-guldastalar',
      name: 'Shirin guldastalar',
      badge: '7+ mahsulot',
      image: '/images/cat_guldasta.jpg',
      description: 'Shokoladli qulupnayli hashamatli guldastalar',
      displayOrder: 5
    }
  ],
  products: [
    {
      id: 'prod-1',
      name: 'Shokoladli qulupnay Classic',
      category: 'qulupnaylar',
      price: 45000,
      oldPrice: 55000,
      image: '/images/prod_classic.jpg',
      badge: 'Hit',
      isPopular: true,
      inStock: true,
      description: 'Belgiya sutli va qora shokoladiga botirilgan, nozik tilla zarrachalar bilan bezatilgan yangi sara qulupnay.',
      details: 'Tarkibi: Yangi qulupnay, Callebaut Belgiya shokoladi, tilla zar. Saqlash muddati: +2°C dan +6°C gacha haroratda 24 soat.',
      weight: '1 dona (35-45g)',
      rating: 5.0,
      reviewsCount: 48,
      createdAt: '2026-08-01T10:00:00Z'
    },
    {
      id: 'prod-2',
      name: 'Qulupnay to\'plami Premium',
      category: 'toplamlar',
      price: 250000,
      oldPrice: 280000,
      image: '/images/prod_premium.jpg',
      badge: 'Top',
      isPopular: true,
      inStock: true,
      description: '12 dona sara qulupnaylar, turli xil Belgiya shokoladlari, qarsildoq yong\'oqlar va yeyiladigan marvaridlar bilan bezatilgan premium to\'plam.',
      details: 'Tarkibi: 12 dona shokoladli qulupnay, Callebaut suti, yong\'oq bo\'laklari, maxsus qadoq va atlas lenta.',
      weight: '12 dona (450g)',
      rating: 4.9,
      reviewsCount: 36,
      createdAt: '2026-08-02T10:00:00Z'
    },
    {
      id: 'prod-3',
      name: 'Shirin guldasta Deluxe',
      category: 'shirin-guldastalar',
      price: 350000,
      oldPrice: 390000,
      image: '/images/prod_deluxe.jpg',
      badge: 'Deluxe',
      isPopular: true,
      inStock: true,
      description: 'Shokoladli qulupnaylar va gullar uyg\'unligida yaratilgan betakror, nafis va romantik guldasta.',
      details: 'Tarkibi: 19 dona shokoladli qulupnay, jonli gullar kompozitsiyasi, dizaynerlik o\'rami.',
      weight: '19 dona qulupnay + gullar',
      rating: 5.0,
      reviewsCount: 29,
      createdAt: '2026-08-03T10:00:00Z'
    },
    {
      id: 'prod-4',
      name: 'Mini to\'plam',
      category: 'toplamlar',
      price: 120000,
      oldPrice: 140000,
      image: '/images/prod_mini.jpg',
      badge: 'Yangi',
      isPopular: true,
      inStock: true,
      description: '6 dona mazali shokoladli qulupnaylar. Kichik kutilmagan sovg\'a yoki shirinlikdan bahra olish uchun ideal tanlov.',
      details: 'Tarkibi: 6 dona Callebaut shokoladli sara qulupnay, nafis mini quti.',
      weight: '6 dona (220g)',
      rating: 4.8,
      reviewsCount: 22,
      createdAt: '2026-08-04T10:00:00Z'
    },
    {
      id: 'prod-5',
      name: 'Royal Berry Heart Box',
      category: 'sovgalar',
      price: 320000,
      oldPrice: 360000,
      image: '/images/hero_box.jpg',
      badge: 'Eksklyuziv',
      isPopular: true,
      inStock: true,
      description: 'Hashamatli quti ichida 16 dona Callebaut shokoladiga botirilgan sara qulupnaylar va yangi malinalar kompozitsiyasi.',
      details: 'Tarkibi: 16 dona shokoladli qulupnay, yangi malina, tilla zarlar, maxsus sovg\'abop oq-oltin quti.',
      weight: '16 dona (550g)',
      rating: 5.0,
      reviewsCount: 31,
      createdAt: '2026-08-05T10:00:00Z'
    },
    {
      id: 'prod-6',
      name: 'Handcrafted Chocolate Art',
      category: 'shokoladlar',
      price: 95000,
      oldPrice: 110000,
      image: '/images/cat_shokolad.jpg',
      badge: 'Artisan',
      isPopular: true,
      inStock: true,
      description: 'Qo\'lda quyilgan, yong\'oqlar va quritilgan mevalar bilan boyitilgan Belgiya shokoladi plitkasi.',
      details: 'Tarkibi: Belgiya qora shokoladi 70%, pista, bodom, sublimatsiyalangan qulupnay.',
      weight: '100g',
      rating: 4.9,
      reviewsCount: 17,
      createdAt: '2026-08-06T10:00:00Z'
    }
  ],
  reviews: [
    {
      id: 'rev-1',
      author: 'Nilufar A.',
      rating: 5,
      comment: 'Juda mazali va chiroyli! Sovg\'a uchun ajoyib variant. Yetkazib berish ham tez bo\'ldi.',
      date: '2026-08-28',
      status: 'approved'
    },
    {
      id: 'rev-2',
      author: 'Sevara M.',
      rating: 5,
      comment: 'Har doim sizlardan buyurtma qilaman. Sifat va xizmat zo\'r!',
      date: '2026-08-25',
      status: 'approved'
    },
    {
      id: 'rev-3',
      author: 'Malika S.',
      rating: 5,
      comment: 'Eng chiroyli qulupnaylar faqat sizlarda! Rahmat, Choco_by_Raya!',
      date: '2026-08-22',
      status: 'approved'
    },
    {
      id: 'rev-4',
      author: 'Dildora K.',
      rating: 5,
      comment: 'Onamning tug\'ilgan kuniga buyurtma bergan edim, butun oilamiz hayratda qoldi! Ta\'mi shunchaki ilohiy.',
      date: '2026-08-20',
      status: 'approved'
    }
  ],
  orders: [
    {
      id: 'ord-1001',
      orderNumber: '#CR-1001',
      customerName: 'Jasur Rahimov',
      customerPhone: '+998 90 987 65 43',
      address: 'Chilonzor 9-mavze, 14-uy, 22-xonadon',
      district: 'Chilonzor tumani',
      deliveryDate: '2026-08-31',
      deliveryTime: '18:00 - 19:30',
      giftNote: 'Tug\'ilgan kuning bilan, jonim! Baxtli bo\'l ♡',
      paymentMethod: 'Payme',
      status: 'Yetkazilmoqda',
      items: [
        {
          id: 'prod-2',
          name: 'Qulupnay to\'plami Premium',
          price: 250000,
          quantity: 1,
          image: '/images/prod_premium.jpg'
        },
        {
          id: 'prod-1',
          name: 'Shokoladli qulupnay Classic',
          price: 45000,
          quantity: 2,
          image: '/images/prod_classic.jpg'
        }
      ],
      totalAmount: 340000,
      createdAt: '2026-08-31T14:20:00Z',
      notes: 'Iltimos, lentani pushti rangda qiling.'
    },
    {
      id: 'ord-1002',
      orderNumber: '#CR-1002',
      customerName: 'Madina Aliyeva',
      customerPhone: '+998 93 555 12 34',
      address: 'Mirzo Ulug\'bek tumani, Mustaqillik shoh ko\'chasi, 45-uy',
      district: 'Mirzo Ulug\'bek tumani',
      deliveryDate: '2026-08-31',
      deliveryTime: '19:00 - 20:00',
      giftNote: 'Eng yaxshi do\'stimga samimiy tilaklar bilan!',
      paymentMethod: 'Click',
      status: 'Tayyorlanmoqda',
      items: [
        {
          id: 'prod-3',
          name: 'Shirin guldasta Deluxe',
          price: 350000,
          quantity: 1,
          image: '/images/prod_deluxe.jpg'
        }
      ],
      totalAmount: 350000,
      createdAt: '2026-08-31T15:45:00Z',
      notes: 'Yetkazishdan oldin telefon qiling.'
    },
    {
      id: 'ord-1003',
      orderNumber: '#CR-1003',
      customerName: 'Azizbek Toshmatov',
      customerPhone: '+998 97 123 77 88',
      address: 'Yunusobod 4-mavze, 8-uy',
      district: 'Yunusobod tumani',
      deliveryDate: '2026-08-30',
      deliveryTime: '15:00 - 16:00',
      giftNote: '',
      paymentMethod: 'Naqd',
      status: 'Yetkazildi',
      items: [
        {
          id: 'prod-4',
          name: 'Mini to\'plam',
          price: 120000,
          quantity: 2,
          image: '/images/prod_mini.jpg'
        }
      ],
      totalAmount: 240000,
      createdAt: '2026-08-30T11:10:00Z',
      notes: ''
    }
  ]
};

class Database {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DB_FILE)) {
        this.data = JSON.parse(JSON.stringify(initialData));
        this.save();
      } else {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
        // Ensure all top-level keys exist
        for (const key of Object.keys(initialData)) {
          if (!this.data[key]) {
            this.data[key] = initialData[key];
          }
        }
      }
    } catch (err) {
      console.error('Database initialization error, falling back to default:', err);
      this.data = JSON.parse(JSON.stringify(initialData));
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Database save error:', err);
    }
  }

  // --- Products ---
  getProducts(filter = {}) {
    let list = [...this.data.products];
    if (filter.category && filter.category !== 'all') {
      list = list.filter(p => p.category === filter.category);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
    }
    if (filter.popularOnly) {
      list = list.filter(p => p.isPopular);
    }
    return list;
  }

  getProductById(id) {
    return this.data.products.find(p => p.id === id);
  }

  addProduct(productData) {
    const id = 'prod-' + Date.now();
    const newProduct = {
      id,
      name: productData.name || 'Yangi mahsulot',
      category: productData.category || 'qulupnaylar',
      price: Number(productData.price) || 0,
      oldPrice: productData.oldPrice ? Number(productData.oldPrice) : null,
      image: productData.image || '/images/cat_qulupnay.jpg',
      badge: productData.badge || '',
      isPopular: productData.isPopular !== undefined ? Boolean(productData.isPopular) : false,
      inStock: productData.inStock !== undefined ? Boolean(productData.inStock) : true,
      description: productData.description || '',
      details: productData.details || '',
      weight: productData.weight || '',
      rating: Number(productData.rating) || 5.0,
      reviewsCount: Number(productData.reviewsCount) || 0,
      createdAt: new Date().toISOString()
    };
    this.data.products.unshift(newProduct);
    this.save();
    return newProduct;
  }

  updateProduct(id, updates) {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index === -1) return null;
    const current = this.data.products[index];
    this.data.products[index] = {
      ...current,
      ...updates,
      price: updates.price !== undefined ? Number(updates.price) : current.price,
      oldPrice: updates.oldPrice !== undefined ? (updates.oldPrice ? Number(updates.oldPrice) : null) : current.oldPrice,
      isPopular: updates.isPopular !== undefined ? Boolean(updates.isPopular) : current.isPopular,
      inStock: updates.inStock !== undefined ? Boolean(updates.inStock) : current.inStock,
      rating: updates.rating !== undefined ? Number(updates.rating) : current.rating,
    };
    this.save();
    return this.data.products[index];
  }

  deleteProduct(id) {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.data.products.splice(index, 1);
    this.save();
    return true;
  }

  // --- Categories ---
  getCategories() {
    return [...this.data.categories].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  addCategory(categoryData) {
    const id = 'cat-' + Date.now();
    const slug = categoryData.slug || categoryData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const newCategory = {
      id,
      slug,
      name: categoryData.name,
      badge: categoryData.badge || '0 mahsulot',
      image: categoryData.image || '/images/cat_qulupnay.jpg',
      description: categoryData.description || '',
      displayOrder: Number(categoryData.displayOrder) || (this.data.categories.length + 1)
    };
    this.data.categories.push(newCategory);
    this.save();
    return newCategory;
  }

  updateCategory(id, updates) {
    const index = this.data.categories.findIndex(c => c.id === id);
    if (index === -1) return null;
    this.data.categories[index] = {
      ...this.data.categories[index],
      ...updates
    };
    this.save();
    return this.data.categories[index];
  }

  deleteCategory(id) {
    const index = this.data.categories.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.data.categories.splice(index, 1);
    this.save();
    return true;
  }

  // --- Orders ---
  getOrders(filter = {}) {
    let list = [...this.data.orders];
    if (filter.status && filter.status !== 'all') {
      list = list.filter(o => o.status === filter.status);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        (o.district && o.district.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getOrderById(id) {
    return this.data.orders.find(o => o.id === id);
  }

  createOrder(orderData) {
    const count = this.data.orders.length + 1001;
    const orderNumber = `#CR-${count}`;
    const id = 'ord-' + Date.now();

    const newOrder = {
      id,
      orderNumber,
      customerName: orderData.customerName || 'Mijoz',
      customerPhone: orderData.customerPhone || '',
      address: orderData.address || '',
      district: orderData.district || 'Toshkent shahri',
      deliveryDate: orderData.deliveryDate || new Date().toISOString().split('T')[0],
      deliveryTime: orderData.deliveryTime || 'Istalgan vaqtda',
      giftNote: orderData.giftNote || '',
      paymentMethod: orderData.paymentMethod || 'Naqd',
      items: Array.isArray(orderData.items) ? orderData.items : [],
      totalAmount: Number(orderData.totalAmount) || 0,
      status: 'Yangi',
      notes: orderData.notes || '',
      createdAt: new Date().toISOString()
    };

    this.data.orders.unshift(newOrder);
    this.save();
    return newOrder;
  }

  updateOrderStatus(id, status) {
    const order = this.data.orders.find(o => o.id === id);
    if (!order) return null;
    order.status = status;
    this.save();
    return order;
  }

  deleteOrder(id) {
    const index = this.data.orders.findIndex(o => o.id === id);
    if (index === -1) return false;
    this.data.orders.splice(index, 1);
    this.save();
    return true;
  }

  // --- Reviews ---
  getReviews(approvedOnly = false) {
    let list = [...this.data.reviews];
    if (approvedOnly) {
      list = list.filter(r => r.status === 'approved');
    }
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  addReview(reviewData) {
    const id = 'rev-' + Date.now();
    const newReview = {
      id,
      author: reviewData.author || 'Mijoz',
      rating: Number(reviewData.rating) || 5,
      comment: reviewData.comment || '',
      date: new Date().toISOString().split('T')[0],
      status: reviewData.status || 'approved' // auto-approve or pending
    };
    this.data.reviews.unshift(newReview);
    this.save();
    return newReview;
  }

  updateReviewStatus(id, status) {
    const rev = this.data.reviews.find(r => r.id === id);
    if (!rev) return null;
    rev.status = status;
    this.save();
    return rev;
  }

  deleteReview(id) {
    const index = this.data.reviews.findIndex(r => r.id === id);
    if (index === -1) return false;
    this.data.reviews.splice(index, 1);
    this.save();
    return true;
  }

  // --- Settings ---
  getSettings() {
    return { ...this.data.settings };
  }

  updateSettings(updates) {
    this.data.settings = {
      ...this.data.settings,
      ...updates
    };
    this.save();
    return this.data.settings;
  }

  // --- Admin Auth ---
  verifyAdmin(username, password) {
    return this.data.admin.username === username && this.data.admin.password === password;
  }

  updateAdminPassword(oldPassword, newPassword) {
    if (this.data.admin.password !== oldPassword) {
      return false;
    }
    this.data.admin.password = newPassword;
    this.save();
    return true;
  }

  // --- Analytics & Stats ---
  getStats() {
    const totalOrders = this.data.orders.length;
    const completedOrders = this.data.orders.filter(o => o.status === 'Yetkazildi');
    const pendingOrders = this.data.orders.filter(o => o.status === 'Yangi' || o.status === 'Tayyorlanmoqda' || o.status === 'Yetkazilmoqda');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayOrders = this.data.orders.filter(o => o.createdAt && o.createdAt.startsWith(todayStr));
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    return {
      totalRevenue,
      todayRevenue,
      totalOrders,
      todayOrdersCount: todayOrders.length,
      pendingOrdersCount: pendingOrders.length,
      totalProducts: this.data.products.length,
      totalCategories: this.data.categories.length,
      totalReviews: this.data.reviews.length,
      recentOrders: this.getOrders().slice(0, 5)
    };
  }
}

export const db = new Database();
