# Coolify'ga joylashtirish

## Muhim: serverda og'ir build yo'q

Bu loyihaning frontend qismi (`public/`) toza HTML/CSS/JS — bundler (Vite, webpack va h.k.)
ishlatilmaydi, shuning uchun "front build" bosqichi umuman mavjud emas. Fayllar qanday bo'lsa
shundayligicha `express.static` orqali beriladi.

Serverni yiqitishi mumkin bo'lgan yagona narsa `sharp` edi — u native libvips binarylarini
yuklab olib, o'rnatishda ~100 MB+ va ancha RAM talab qiladi. `sharp` faqat
`scripts/prepare_assets.js` (bir martalik lokal rasm tayyorlash skripti) uchun kerak, runtime'da
ishlatilmaydi. Shuning uchun u `devDependencies`ga ko'chirildi va Docker image `npm ci --omit=dev`
bilan quriladi.

Natijada serverdagi o'rnatish: **86 ta paket, 2.7 MB, ~2 soniya, native kompilyatsiya yo'q.**

## Coolify sozlamalari

**Build Pack:** `Dockerfile`
**Port:** `3000`

### Environment variables

| Nomi | Qiymati |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DATA_DIR` | `/app/data` |
| `UPLOADS_DIR` | `/app/public/uploads` |
| `ADMIN_USERNAME` | admin login |
| `ADMIN_PASSWORD` | kuchli parol |

`ADMIN_USERNAME` va `ADMIN_PASSWORD` har safar ishga tushganda qo'llanadi va parol
`scrypt` bilan hashlanib saqlanadi. Shu sababli admin paneldan parolni o'zgartirsangiz,
Coolify'dagi `ADMIN_PASSWORD` ni ham yangilang — aks holda konteyner qayta ishga
tushganda eski parolga qaytadi.

### Persistent Storage (MAJBURIY)

Bularsiz har bir redeploy'da buyurtmalar, sozlamalar va yuklangan rasmlar o'chib ketadi:

| Turi | Mount path |
|---|---|
| Volume | `/app/data` |
| Volume | `/app/public/uploads` |

> `DATA_DIR` aynan `/app/data` bo'lishi kerak — `/app/db` ga volume ulash `database.js`
> kodini bekitib qo'yadi.

### Health check

- Path: `/api/health`
- Port: `3000`

### Domenlar

| Domen | Nima ochiladi |
|---|---|
| `chocobyraya.uz` | Landing sayt |
| `www.chocobyraya.uz` | Landing sayt |
| `admin.chocobyraya.uz` | Admin panel (ildizda) |

Ilova bitta Express protsessi: frontend, admin panel va API bir joyda. Frontend API'ni
nisbiy yo'l bilan chaqiradi (`fetch('/api/...')`), shuning uchun qaysi domendan ochilsa,
API ham o'sha domendan ishlaydi — CORS sozlash shart emas.

`admin.` bilan boshlanadigan hostda ildiz sahifa `admin.html` ni qaytaradi. Bu tekshiruv
`express.static`dan oldin turishi shart, chunki aks holda static middleware `/` uchun
`index.html` ni o'zi qaytarib yuboradi.

## Rasmlar

Rasmlar **lokalda** optimallashtiriladi, serverda emas:

```bash
npm install          # sharp devDependency sifatida o'rnatiladi
npm run images       # public/images ichidagi rasmlarni siqadi va .webp yaratadi
git add public/images && git commit && git push
```

Skript har bir rasmni sayt ko'rsatadigan eng katta o'lchamgacha kichraytiradi va
ikkita fayl qoldiradi: optimallashtirilgan `.jpg` (zaxira) va `.webp` (asosiy).
Yangi rasm qo'shganda shu buyruqni qayta ishga tushiring.

## Deploydan keyin

Admin panel **faqat** `https://admin.chocobyraya.uz` da ochiladi. Asosiy saytda
`/admin` yo'li ham, admin tugmasi ham yo'q — tashqaridan qaraganda admin panel
umuman mavjud emasdek ko'rinadi.

Telegram xabarnomalari admin panel → Sozlamalar bo'limida `telegramBotToken` va
`telegramChatId` kiritilgandan keyin ishlaydi. Bu kalitlar ochiq API'dan
qaytarilmaydi — ularni faqat tizimga kirgan admin ko'radi.
