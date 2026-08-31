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

## Deploydan keyin

Admin panel `https://<domen>/admin` manzilida. Standart login `admin` / `admin123` —
**birinchi kirishdayoq admin paneldagi "Parolni o'zgartirish" orqali almashtiring.**

Telegram xabarnomalari admin panel → Sozlamalar bo'limida `telegramBotToken` va
`telegramChatId` kiritilgandan keyin ishlaydi.
