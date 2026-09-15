import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateIcons() {
  const publicDir = path.resolve('public');
  const emblemSource = path.join(publicDir, 'orca-emblem.png');
  const logoSource = path.join(publicDir, 'orca-logo.png');

  if (!fs.existsSync(emblemSource) || !fs.existsSync(logoSource)) {
    console.error('Source images not found:', { emblemSource, logoSource });
    return;
  }

  console.log('🖼️ Generating PWA and Favicon assets from official Orca logo...');

  // 1. Copy orca-logo.png to logo.png for backwards compatibility
  fs.copyFileSync(logoSource, path.join(publicDir, 'logo.png'));
  console.log('✅ Updated public/logo.png with official Orca logo');

  // 2. Favicon (48x48 and 32x32 PNG)
  await sharp(emblemSource)
    .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✅ Generated public/favicon.png (48x48)');

  // 3. PWA 192x192
  await sharp(emblemSource)
    .resize(192, 192, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png()
    .toFile(path.join(publicDir, 'pwa-192.png'));
  console.log('✅ Generated public/pwa-192.png (192x192)');

  // 4. PWA 512x512
  await sharp(emblemSource)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .png()
    .toFile(path.join(publicDir, 'pwa-512.png'));
  console.log('✅ Generated public/pwa-512.png (512x512)');

  // 5. PWA Maskable 512x512 with safe zone
  const innerSize = Math.round(512 * 0.75); // 384x384 safe zone
  const innerBuffer = await sharp(emblemSource)
    .resize(innerSize, innerSize, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([{ input: innerBuffer, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512.png'));
  console.log('✅ Generated public/pwa-maskable-512.png');

  // 6. Apple touch icon (180x180)
  const iosInner = Math.round(180 * 0.85);
  const iosInnerBuffer = await sharp(emblemSource)
    .resize(iosInner, iosInner, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 }
    })
    .toBuffer();

  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite([{ input: iosInnerBuffer, gravity: 'center' }])
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✅ Generated public/apple-touch-icon.png');

  console.log('🎉 All Orca brand assets generated successfully!');
}

generateIcons();

