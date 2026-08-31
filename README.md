# 🍓 Choco_by_Raya — Luxury Landing Page & Admin Panel

Qo'lda tayyorlangan shokoladli qulupnaylar va hashamatli sovg'alar brendi **Choco_by_Raya** uchun to'liq interaktiv Landing Page va saytni to'liq boshqarish imkoniyatiga ega Admin Panel.

---

## ✨ Asosiy Imkoniyatlar

### 🌟 Mijozlar uchun Landing Page
- **Luxury dizayn**: Pushti, ipak, Belgiya shokoladi va tilla ranglar uyg'unligi.
- **Hero & Toifalar**: Qulupnaylar, To'plamlar, Shokoladlar, Sovg'alar, Shirin guldastalar.
- **Populyar Mahsulotlar Katalogi**: Narxlar, chegirmalar, tezkor ko'rish (Quick View) va saralanganlar (Wishlist).
- **Interaktiv Savatcha (Cart Drawer)**: Miqdorni o'zgartirish, savatdan o'chirish, umumiy summani avtomatik hisoblash.
- **Buyurtma berish (Checkout)**: Ism, telefon (+998...), yetkazish manzili/tumani, yetkazish vaqti, tabriknoma (gift note) matni, to'lov turlari (Payme, Click, Uzum, Naqd).
- **Mijozlar Sharhlari**: Fikr qoldirish modali va yulduzli baholash.

### 👑 Boshqaruv Admin Paneli (`/admin`)
- **Dashboard**: Bugungi buyurtmalar, jami tushum, faol mahsulotlar va so'nggi tushgan buyurtmalar.
- **Buyurtmalar nazorati**: Tushgan yangi buyurtmalarni ko'rish, holatini o'zgartirish (`Yangi`, `Tayyorlanmoqda`, `Yetkazilmoqda`, `Yetkazildi`, `Bekor qilindi`) va chek chop etish.
- **Mahsulotlar CRUD**: Yangi mahsulot qo'shish, rasm yuklash, narx, chegirma va toifani tahrirlash.
- **Kategoriyalar CRUD**: Toifalarni boshqarish.
- **Mijozlar Fikrlari**: Sharhlarni tasdiqlash / moderatsiya qilish.
- **Sayt Sozlamalari**: Slogan, kontaktlar va **Telegram Bot orqali yangi buyurtmalarni xabardor qilish** sozlamalari.
- **Xavfsizlik**: Admin parolini o'zgartirish.

---

## 🚀 Ishga Tushirish

1. **Repozitoriyani yuklab olish va kutubxonalarni o'rnatish**:
```bash
git clone https://github.com/MalikovFarhodjon/chocobyraya-project.git
cd chocobyraya-project
npm install
```

2. **Serverni ishga tushirish**:
```bash
npm start
```
yoki dasturchi rejimida:
```bash
npm run dev
```

3. **Brauzerda ochish**:
- **Asosiy sayt**: [http://localhost:3000](http://localhost:3000)
- **Admin panel**: [http://localhost:3000/admin](http://localhost:3000/admin)
  - **Standart login**: `admin`
  - **Standart parol**: `admin123`

---

## 🛠 Texnologiyalar
- **Backend**: Node.js, Express, Multer, REST API
- **Frontend**: HTML5, Vanilla CSS3 (Custom Luxury Design System), JavaScript (ES6+)
- **Ma'lumotlar bazasi**: JSON / Persistent Local DB Store
