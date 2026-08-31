import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function prepareAssets() {
  const mockupPath = 'public/images/design_mockup.jpg';
  if (!fs.existsSync(mockupPath)) {
    console.log('Mockup file not found');
    return;
  }

  const metadata = await sharp(mockupPath).metadata();
  console.log(`Mockup dimensions: ${metadata.width} x ${metadata.height}`);

  // Copy generated images if available
  const brainDir = 'C:/Users/User/.gemini/antigravity-ide/brain/4e2c5db5-2256-43f7-9627-4989e2325a9f';
  const heroGen = path.join(brainDir, 'hero_box_1788180755380.jpg');
  const catQulupnayGen = path.join(brainDir, 'cat_qulupnay_1788180772486.jpg');
  const catToplamGen = path.join(brainDir, 'cat_toplam_1788180796792.jpg');

  if (fs.existsSync(heroGen)) {
    fs.copyFileSync(heroGen, 'public/images/hero_box.jpg');
    console.log('Copied hero_box.jpg');
  }
  if (fs.existsSync(catQulupnayGen)) {
    fs.copyFileSync(catQulupnayGen, 'public/images/cat_qulupnay.jpg');
    console.log('Copied cat_qulupnay.jpg');
  }
  if (fs.existsSync(catToplamGen)) {
    fs.copyFileSync(catToplamGen, 'public/images/cat_toplam.jpg');
    console.log('Copied cat_toplam.jpg');
  }

  // Let's crop specific regions from mockup
  const W = metadata.width;
  const H = metadata.height;

  // Let's define percentage-based bounding boxes for categories & products based on standard UI ratio
  // Categories row is around Y: 36% to 46%
  // Products row is around Y: 51% to 65%
  // Promo gift box is around Y: 67% to 77%

  const crops = [
    { name: 'mockup_hero_box.jpg', left: 0.54, top: 0.07, width: 0.42, height: 0.25 },
    { name: 'crop_cat_qulupnay.jpg', left: 0.06, top: 0.36, width: 0.16, height: 0.085 },
    { name: 'crop_cat_toplam.jpg', left: 0.24, top: 0.36, width: 0.16, height: 0.085 },
    { name: 'cat_shokolad.jpg', left: 0.42, top: 0.36, width: 0.16, height: 0.085 },
    { name: 'cat_sovga.jpg', left: 0.60, top: 0.36, width: 0.16, height: 0.085 },
    { name: 'cat_guldasta.jpg', left: 0.78, top: 0.36, width: 0.16, height: 0.085 },
    { name: 'prod_classic.jpg', left: 0.06, top: 0.518, width: 0.21, height: 0.082 },
    { name: 'prod_premium.jpg', left: 0.29, top: 0.518, width: 0.21, height: 0.082 },
    { name: 'prod_deluxe.jpg', left: 0.515, top: 0.518, width: 0.21, height: 0.082 },
    { name: 'prod_mini.jpg', left: 0.738, top: 0.518, width: 0.21, height: 0.082 },
    { name: 'promo_strawberry.jpg', left: 0.06, top: 0.665, width: 0.22, height: 0.105 },
    { name: 'promo_gift.jpg', left: 0.75, top: 0.665, width: 0.18, height: 0.105 },
  ];

  for (const item of crops) {
    const extractOpts = {
      left: Math.round(item.left * W),
      top: Math.round(item.top * H),
      width: Math.min(Math.round(item.width * W), W - Math.round(item.left * W)),
      height: Math.min(Math.round(item.height * H), H - Math.round(item.top * H)),
    };
    try {
      await sharp(mockupPath)
        .extract(extractOpts)
        .resize(600, 600, { fit: 'cover' })
        .jpeg({ quality: 95 })
        .toFile(`public/images/${item.name}`);
      console.log(`Saved public/images/${item.name}`);
    } catch (err) {
      console.error(`Error cropping ${item.name}:`, err.message);
    }
  }
}

prepareAssets();
