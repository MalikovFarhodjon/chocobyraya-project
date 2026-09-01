/**
 * Rasmlarni lokalda optimallashtirish.
 *
 * Serverda ishlamaydi va ishlashi ham shart emas: natija (optimallashtirilgan
 * .jpg va .webp fayllar) git orqali boradi. `sharp` shu sababli
 * devDependencies'da turadi.
 *
 * Ishlatish:  npm run images
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const IMAGES_DIR = path.join(process.cwd(), 'public', 'images');

// Har bir rasm sayt ichida qanchalik katta ko'rsatilishiga qarab maksimal en.
// Bulardan kattasini saqlashning ma'nosi yo'q — foydalanuvchi baribir ko'rmaydi.
const MAX_WIDTHS = {
  'hero_box.jpg': 1400,
  'logo_strawberry.jpg': 400,
  default: 800
};

const JPEG_QUALITY = 80;
const WEBP_QUALITY = 78;

function kb(bytes) {
  return Math.round(bytes / 1024);
}

async function optimize() {
  const files = fs.readdirSync(IMAGES_DIR).filter(f => /\.(jpe?g|png)$/i.test(f));

  let beforeTotal = 0;
  let afterTotal = 0;
  const rows = [];

  for (const file of files) {
    const full = path.join(IMAGES_DIR, file);
    const before = fs.statSync(full).size;
    const maxWidth = MAX_WIDTHS[file] || MAX_WIDTHS.default;

    const meta = await sharp(full).metadata();
    const targetWidth = Math.min(meta.width, maxWidth);

    // Asl faylni buzmaslik uchun avval vaqtinchalik faylga yozamiz
    const tmpJpg = full + '.tmp';
    await sharp(full)
      .resize({ width: targetWidth, withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true })
      .toFile(tmpJpg);
    fs.renameSync(tmpJpg, full);

    const webpPath = full.replace(/\.(jpe?g|png)$/i, '.webp');
    await sharp(full)
      .resize({ width: targetWidth, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(webpPath);

    const afterJpg = fs.statSync(full).size;
    const afterWebp = fs.statSync(webpPath).size;

    beforeTotal += before;
    // Brauzer WebP ni oladi, shuning uchun haqiqiy og'irlik shu
    afterTotal += afterWebp;

    rows.push({
      file,
      size: `${meta.width}x${meta.height} -> ${targetWidth}px`,
      before: kb(before),
      jpg: kb(afterJpg),
      webp: kb(afterWebp)
    });
  }

  console.log('fayl'.padEnd(26) + 'o\'lcham'.padEnd(22) + 'oldin'.padStart(8) + 'jpg'.padStart(8) + 'webp'.padStart(8));
  console.log('-'.repeat(72));
  for (const r of rows) {
    console.log(
      r.file.padEnd(26) +
      r.size.padEnd(22) +
      `${r.before} KB`.padStart(8) +
      `${r.jpg} KB`.padStart(8) +
      `${r.webp} KB`.padStart(8)
    );
  }
  console.log('-'.repeat(72));
  console.log(
    `JAMI: ${kb(beforeTotal)} KB -> ${kb(afterTotal)} KB (WebP bilan), ` +
    `${Math.round((1 - afterTotal / beforeTotal) * 100)}% kamaydi`
  );
}

optimize().catch(err => {
  console.error('Optimallashtirish xatosi:', err);
  process.exit(1);
});
