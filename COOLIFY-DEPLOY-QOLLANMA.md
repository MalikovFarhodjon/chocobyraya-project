# Coolify'ga deploy qilish qo'llanmasi

Bu qo'llanma `chocobyraya.uz` ni `https://coolify.ittec.uz` ga joylashtirish jarayonida
to'plangan amaliy tajriba asosida yozilgan. Misollar `lalebaby.uz` uchun keltirilgan,
lekin har qanday Node.js loyihasiga mos keladi.

Server manzili: **46.225.115.118** (coolify.ittec.uz ham shu serverda).

---

## 0. Eng muhim qoida: serverda og'ir build qilmang

Server kuchsiz. Agar `npm install` native paketlarni (sharp, canvas, bcrypt, node-gyp
talab qiladigan har qanday paket) kompilyatsiya qilishga urinsa, server yiqilishi mumkin.

Shuning uchun deploydan **oldin** loyihani tekshiring:

```bash
# Runtime'da haqiqatan kerak bo'lgan paketlarni aniqlang
npm ls --omit=dev --depth=0
```

Ikkita savol bering:

1. **Bu paket runtime'da ishlatiladimi, yoki faqat build/skript uchunmi?**
   Faqat build uchun bo'lsa — `devDependencies`ga ko'chiring.
2. **Bu paket native binary yuklab oladimi?**
   `sharp` ~100 MB libvips tortadi. `bcrypt` node-gyp bilan kompilyatsiya qilinadi.

Chocobyraya misolida `sharp` faqat bir martalik lokal rasm skriptida ishlatilardi.
Uni `devDependencies`ga ko'chirgach:

| | Ilgari | Keyin |
|---|---|---|
| Paketlar | sharp + native build | 86 ta |
| Hajmi | ~100 MB+ | 2.7 MB |
| Vaqt | daqiqalar | ~2 soniya |

**Parol hashlash uchun `bcrypt` o'rniga Node'ning o'z `crypto.scrypt` funksiyasini
ishlating** — bir xil darajada xavfsiz, lekin native build talab qilmaydi.

### Agar haqiqiy frontend build bo'lsa (Next.js, Vite, React)

`lalebaby.uz` da bundler bo'lsa, ikki yo'l bor:

**A. Multi-stage Dockerfile (odatda yetarli).** Build bosqichi konteyner ichida ketadi,
lekin yakuniy image'ga faqat natija tushadi. Agar server build paytida yiqilsa — B ga o'ting.

**B. Lokalda build qilib, tayyor image'ni registry orqali yuborish.** Serverda umuman
build bo'lmaydi:

```bash
docker build -t ghcr.io/<user>/lalebaby:latest .
docker push ghcr.io/<user>/lalebaby:latest
```

Keyin Coolify'da Build Pack sifatida **Docker Image** tanlanadi va shu image ko'rsatiladi.
Buning uchun lokal kompyuterda Docker o'rnatilgan bo'lishi kerak.

---

## 1. Loyihani tayyorlash

### Dockerfile

```dockerfile
FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=3000 \
    DATA_DIR=/app/data \
    UPLOADS_DIR=/app/public/uploads

WORKDIR /app

# --omit=dev — devDependencies serverda o'rnatilmaydi
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

RUN mkdir -p /app/data /app/public/uploads

EXPOSE 3000
CMD ["node", "server.js"]
```

### .dockerignore

Buni yozishni **unutmang** — aks holda Windows'dagi `node_modules` image ichiga tushadi
va Linux konteynerida ishlamaydi:

```
node_modules
.git
.env
scripts
Dockerfile
.dockerignore
*.md
```

### Portni env'dan oling

```js
const PORT = process.env.PORT || 3000;
app.listen(PORT);
```

### Reverse proxy ortida ekanini bildiring

Coolify oldida Traefik turadi. `req.hostname`, `req.protocol` va `req.ip` to'g'ri
ishlashi uchun:

```js
app.set('trust proxy', true);
```

Busiz rate limiting hamma foydalanuvchini bitta IP deb hisoblaydi.

### Health check endpoint

```js
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});
```

---

## 2. Doimiy ma'lumotlar (eng ko'p xato qilinadigan joy)

Konteyner har redeploy'da **noldan** yaratiladi. Konteyner ichiga yozilgan hamma narsa —
buyurtmalar, yuklangan rasmlar, SQLite fayli — yo'qoladi.

### Tuzoq: volume kodni bekitib qo'yadi

Agar ma'lumot fayli kod bilan bir papkada bo'lsa:

```
db/
  database.js     <- kod
  store.json      <- ma'lumot
```

`/app/db` ga volume ulasangiz, `database.js` ham bekitiladi va ilova ishga tushmaydi.

**Yechim:** ma'lumot yo'lini env orqali sozlanadigan qiling va alohida papkaga chiqaring:

```js
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DB_FILE = path.join(DATA_DIR, 'store.json');

// Papka yo'q bo'lsa yaratamiz
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
```

Keyin Coolify'da `/app/data` ga volume ulanadi va `DATA_DIR=/app/data` qilinadi.

### Kerakli volume'lar

| Mount path | Nima uchun |
|---|---|
| `/app/data` | Ma'lumotlar bazasi (JSON yoki SQLite) |
| `/app/public/uploads` | Yuklangan rasmlar |

PostgreSQL ishlatsangiz, bazani Coolify'da alohida **Database** resursi sifatida yarating —
u o'z volume'i bilan keladi va backup sozlash osonroq.

### Volume ishlayotganini tekshirish

Ishonch hosil qilishning yagona yo'li — sinash:

1. Sayt orqali biror yozuv qo'shing.
2. Redeploy qiling.
3. Yozuv joyidami? Yo'q bo'lsa — volume ulanmagan.

---

## 3. DNS

Deploydan oldin domenni serverga yo'naltiring:

| Nomi | Turi | Qiymati |
|---|---|---|
| `lalebaby.uz` | A | `46.225.115.118` |
| `www.lalebaby.uz` | CNAME | `lalebaby.uz` |
| `admin.lalebaby.uz` | A | `46.225.115.118` |

Tekshirish:

```powershell
Resolve-DnsName lalebaby.uz -Type A
```

DNS tarqalgunicha kutish kerak (odatda 5–30 daqiqa). Coolify Let's Encrypt sertifikatini
faqat domen serverga to'g'ri yo'nalgandan keyin ola oladi.

> Domen hali band emasligini tekshirish: `curl -I http://lalebaby.uz` → 404 qaytsa,
> Coolify proxy'sida hech narsa ro'yxatdan o'tmagan, bemalol ishlatsa bo'ladi.

---

## 4. Coolify: UI orqali

1. **Projects → + New** → nom bering (`lalebaby`)
2. **+ New Resource → Public Repository** (repo ochiq bo'lsa)
   - Repository: `https://github.com/<user>/lalebaby`
   - Branch: `main`
3. **Build Pack: Dockerfile**, Dockerfile Location: `/Dockerfile`
4. **Port: 3000** (Ports Exposes)
5. **Domains:** `https://lalebaby.uz,https://www.lalebaby.uz,https://admin.lalebaby.uz`
6. **Environment Variables** (2-bo'limga qarang)
7. **Storages → + Add** — ikkita volume
8. **Health Check:** path `/api/health`, port `3000`
9. **Deploy**

> Repo **yopiq** bo'lsa, avval Coolify'da GitHub App yoki Deploy Key ulash kerak
> (**Sources** bo'limi). Ochiq repo uchun bu shart emas.

---

## 5. Coolify: API orqali

Katta afzalligi — hamma narsani skript bilan takrorlash mumkin.

### Token olish

`https://coolify.ittec.uz/security/api-tokens` → **Create New Token** → `root` ruxsati.

Token **faqat bir marta** ko'rsatiladi. Skrinshotdan o'qimang — `l`/`I`/`1` va `O`/`0`
harflari adashadi. Darhol matn ko'rinishida nusxalang.

### PowerShell yordamchisi

```powershell
$BASE = "https://coolify.ittec.uz/api/v1"
$HEAD = @{
  Authorization  = "Bearer <TOKEN>"
  Accept         = "application/json"
  "Content-Type" = "application/json"
}

function Cf($Path, $Method = "GET", $Body = $null) {
  $a = @{ Uri = "$BASE$Path"; Headers = $HEAD; Method = $Method; TimeoutSec = 120 }
  if ($Body) { $a.Body = ($Body | ConvertTo-Json -Depth 10 -Compress) }
  try { Invoke-RestMethod @a }
  catch {
    $sr = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())
    "HTTP_ERROR $($_.Exception.Response.StatusCode.value__) :: $($sr.ReadToEnd())"
  }
}
```

### Qadamlar

```powershell
# Tokenni tekshirish
Cf "/version"

# Serverni topish
Cf "/servers" | ForEach-Object { "$($_.uuid)  $($_.name)" }

# Project yaratish -> uuid qaytadi
$proj = Cf "/projects" "POST" @{ name = "lalebaby" }

# Project environment'ini olish (odatda "production")
(Cf "/projects/$($proj.uuid)").environments

# Ilova yaratish
$app = Cf "/applications/public" "POST" @{
  project_uuid         = $proj.uuid
  server_uuid          = "<SERVER_UUID>"
  environment_name     = "production"
  git_repository       = "https://github.com/<user>/lalebaby"
  git_branch           = "main"
  build_pack           = "dockerfile"
  dockerfile_location  = "/Dockerfile"
  ports_exposes        = "3000"
  name                 = "lalebaby-web"
  domains              = "https://lalebaby.uz,https://www.lalebaby.uz"
  health_check_enabled = $true
  health_check_path    = "/api/health"
  instant_deploy       = $false
}

# Deploy
Cf "/deploy?uuid=$($app.uuid)&force=false" "POST"

# Holatini kuzatish
Cf "/deployments/<DEPLOYMENT_UUID>"
```

### API'ning nozik joylari

Bularni topish uchun ancha urinish kerak bo'ldi:

| Nima | To'g'ri yo'li |
|---|---|
| Volume qo'shish | `POST /applications/{uuid}/storages`, majburiy `type` maydoni qiymati **`persistent`** (`volume`, `bind`, `local` — hammasi rad etiladi) |
| Volume nomi | Coolify avtomatik `{app_uuid}-{name}` prefiksini qo'shadi |
| Env qo'shish | `POST /applications/{uuid}/envs`, faqat `{ key, value }` yuboring. `is_build_time` maydoni **422 xato** beradi |
| Env ro'yxati | Har bir o'zgaruvchi ikki marta ko'rinadi — biri production, biri preview uchun. Bu normal |
| Deploy | `POST /deploy?uuid=...` (ilova uuid'i bilan, `/applications/{uuid}/deploy` emas) |
| OpenAPI spec | `/openapi.json` HTML qaytaradi, ishlatib bo'lmaydi |

Volume qo'shish misoli:

```powershell
Cf "/applications/$($app.uuid)/storages" "POST" @{
  name = "data"; mount_path = "/app/data"; type = "persistent"
}
Cf "/applications/$($app.uuid)/storages" "POST" @{
  name = "uploads"; mount_path = "/app/public/uploads"; type = "persistent"
}
```

---

## 6. Git push'da avtomatik deploy

Coolify ilovasining webhook sekreti bor:

```powershell
(Cf "/applications/$($app.uuid)").manual_webhook_secret_github
```

GitHub'da: **Settings → Webhooks → Add webhook**

| Maydon | Qiymati |
|---|---|
| Payload URL | `https://coolify.ittec.uz/webhooks/source/github/events/manual` |
| Content type | `application/json` |
| Secret | yuqoridagi `manual_webhook_secret_github` |
| Events | Just the push event |

> Webhook qo'shish uchun repoda **Admin** huquqi kerak. Oddiy `write` (collaborator)
> huquqi yetarli emas — GitHub API 404 qaytaradi.

Tekshirish: kichik o'zgarish push qiling va Coolify'da yangi deployment paydo bo'lishini
kuzating.

---

## 7. Xavfsizlik ro'yxati

Deploydan **oldin** har birini tekshiring. Chocobyraya'da bularning hammasi muammo edi:

- [ ] **Kodda hardcoded token yo'q.** `const activeSessions = new Set(['demo-token'])`
      kabi narsa ochiq repoda hammaga admin huquqi beradi.
- [ ] **Login sahifasida standart login/parol yozilmagan** va maydonlar `value="admin"`
      bilan oldindan to'ldirilmagan.
- [ ] **Saytda admin paneliga tugma yo'q.** Admin panelni alohida subdomenga chiqaring:

      ```js
      const ADMIN_ASSETS = new Set(['/admin', '/admin.html', '/css/admin.css', '/js/admin.js']);
      app.use((req, res, next) => {
        const isAdminHost = (req.hostname || '').toLowerCase().startsWith('admin.');
        if (ADMIN_ASSETS.has(req.path) && !isAdminHost) {
          return res.sendFile(path.join(__dirname, 'public', 'index.html'));
        }
        next();
      });
      ```

      > Diqqat: `express.static` `/` uchun `index.html` ni **o'zi** qaytaradi. Shuning
      > uchun host tekshiruvi `express.static`dan **oldin** turishi shart.

- [ ] **Parollar hashlangan** (`crypto.scrypt`), ochiq matnda emas.
- [ ] **Sessiya tokenlari `crypto.randomBytes`dan.** `Date.now() + Math.random()` —
      taxmin qilsa bo'ladi.
- [ ] **Sessiyaning muddati bor** (masalan 8 soat).
- [ ] **Login urinishlari cheklangan** (IP bo'yicha, masalan 15 daqiqada 8 marta).
- [ ] **Maxfiy sozlamalar ochiq API'dan chiqmaydi.** `GET /api/settings` Telegram bot
      tokenini qaytarmasin.
- [ ] **Fayl yuklash cheklangan.** Faqat rasm MIME turlari; kengaytmani foydalanuvchi
      yuborgan nomdan emas, ruxsat etilgan ro'yxatdan oling — aks holda `.html` yuklab,
      uni sayt domenidan ochish mumkin.
- [ ] **CORS ochiq emas.** `app.use(cors())` — hamma domenga ruxsat degani.
- [ ] **Ma'lumotlar bazasi fayli `.gitignore` da.** Ichida admin hisobi bor.
- [ ] **Parollar env orqali.** `ADMIN_USERNAME` / `ADMIN_PASSWORD` — kodda emas.
- [ ] **Xavfsizlik headerlari:** `X-Content-Type-Options`, `X-Frame-Options`,
      `Referrer-Policy`, HTTPS'da `Strict-Transport-Security`.

---

## 8. Tekshirish

Deploydan keyin skript bilan tekshirish eng ishonchlisi:

```js
// livetest.mjs — node livetest.mjs
const SITE = 'https://lalebaby.uz';

const t = async (name, fn) => {
  try { console.log((await fn()) ? 'PASS' : 'FAIL', name); }
  catch (e) { console.log('FAIL', name, e.message); }
};

await t('sayt ochiladi', async () => (await fetch(SITE)).status === 200);
await t('health ok', async () => (await (await fetch(SITE + '/api/health')).json()).status === 'ok');
await t('admin asosiy domendan yashiringan', async () =>
  !/adminLoginForm/.test(await (await fetch(SITE + '/admin')).text()));
await t('HSTS bor', async () =>
  !!(await fetch(SITE)).headers.get('strict-transport-security'));
```

---

## 9. Muammolarni hal qilish

| Belgi | Sabab / yechim |
|---|---|
| Build paytida server yiqiladi | Native paket kompilyatsiya qilinyapti. `npm ls --omit=dev` bilan toping, `devDependencies`ga ko'chiring |
| Redeploy'dan keyin ma'lumot yo'qoladi | Volume ulanmagan yoki `DATA_DIR` noto'g'ri |
| Ilova ishga tushmaydi, modul topilmadi | Volume kod papkasini bekitgan (`/app/db` kabi) |
| 404, sertifikat yo'q | DNS hali serverga yo'nalmagan yoki Coolify'da domen qo'shilmagan |
| `req.hostname` noto'g'ri | `app.set('trust proxy', true)` yozilmagan |
| Rate limiting hammani bloklaydi | Yana `trust proxy` — hamma so'rov bitta proxy IP'sidan ko'rinyapti |
| API 422 "type is required" | `storages` uchun `type = "persistent"` yuboring |
| GitHub webhook 404 | Repoda `admin` huquqi kerak, `write` yetarli emas |

### Loglarni ko'rish

Coolify UI → ilova → **Logs**. Ishga tushmayotgan bo'lsa **Deployments** bo'limidagi
build logini o'qing.

---

## 10. Deploydan keyin

- [ ] Admin parolini almashtiring va xavfsiz joyda saqlang
- [ ] Telegram bot tokenini admin panel orqali kiriting (kodga yozmang)
- [ ] Volume backup sozlang (Coolify → **Backups**, yoki `docker run --rm -v <volume>:/data ...`)
- [ ] Barcha domenlarda HTTPS ishlashini tekshiring
- [ ] Mobil qurilmada ochib ko'ring
