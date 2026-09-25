# Icon & Splash Assets

Place the following source images in this folder:

## Required Files

| File | Size | Format | Notes |
|------|------|--------|-------|
| `icon.png` | 1024 × 1024 px | PNG | **No transparency** — solid background |
| `splash.png` | 2732 × 2732 px | PNG | Centered logo on `#0f172a` background |

## Generate All Android Icons & Splash Screens

After placing the source files above, run from `android-app/`:

```bash
npx capacitor-assets generate --android
```

This auto-generates all required Android icon sizes:
- `mipmap-mdpi` → 48×48
- `mipmap-hdpi` → 72×72
- `mipmap-xhdpi` → 96×96
- `mipmap-xxhdpi` → 144×144
- `mipmap-xxxhdpi` → 192×192
- `mipmap-anydpi-v26` → Adaptive icon XML

## Design Guidelines

- Icon background: `#0f172a` (dark slate — matches app theme)
- Icon foreground: Orca Labs logo in white/teal `#0d9488`
- Splash background: `#0f172a`
- Splash logo: centered, ~40% of canvas height
- No rounded corners on source — Android handles shaping

## Export from Figma / Illustrator

- Export at 1024×1024 with 100px padding around logo
- Save as PNG-24 (not PNG-8)
- Flatten all layers before export
