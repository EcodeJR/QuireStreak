# QuireStreak Icon Assets

Copy the `assets/` folder into the Expo project root (`app/assets/`), then merge `app-config-snippet.json` into `app.json`.

## Folder Structure

```
quirestreak-assets/
├── assets/                        ← drop into app/assets/
│   ├── icon.png                   ← iOS app icon, 1024 px, opaque
│   ├── adaptive-icon.png          ← Android adaptive icon foreground
│   ├── adaptive-icon-monochrome.png  ← Android 13+ themed icon layer
│   ├── splash-icon.png            ← Splash mark, light mode
│   ├── splash-icon-dark.png       ← Splash mark, dark mode
│   ├── notification-icon.png      ← Android notification icon, 96 px, white on transparent
│   └── favicon.png                ← Web favicon, 48 px
├── store/
│   ├── app-store-icon-1024.png    ← App Store Connect upload (do NOT put in app/assets/)
│   └── play-store-icon-512.png    ← Google Play listing icon (do NOT put in app/assets/)
├── source/                        ← Editable SVG masters (not shipped in the app)
│   ├── icon.svg                   ← Master for icon.png / favicon.png / play-store-icon-512.png
│   ├── adaptive.svg               ← Master for adaptive-icon.png
│   ├── mono.svg                   ← Master for adaptive-icon-monochrome.png
│   ├── notif.svg                  ← Master for notification-icon.png
│   ├── splash.svg                 ← Master for splash-icon.png (light mode)
│   ├── splash-dark.svg            ← Master for splash-icon-dark.png (dark mode)
│   ├── favicon.svg                ← Master for favicon.png (48×48 export)
│   └── play.svg                   ← Master for play-store-icon-512.png (512×512 export)
└── app-config-snippet.json        ← Merge this into your app.json
```

## Asset Specs

| File | Purpose | Spec |
|------|---------|------|
| `assets/icon.png` | iOS app icon | 1024×1024 px, opaque (App Store rejects transparency) |
| `assets/adaptive-icon.png` | Android adaptive icon foreground | 1024×1024 px — background is `#1A1714` in config |
| `assets/adaptive-icon-monochrome.png` | Android 13+ themed icon | 1024×1024 px, white/alpha only |
| `assets/splash-icon.png` | Splash screen mark, light mode | 1024×1024 px, transparent bg — config sets `backgroundColor: #FAF7F2` |
| `assets/splash-icon-dark.png` | Splash screen mark, dark mode | 1024×1024 px, transparent bg — config sets `backgroundColor: #14110F` |
| `assets/notification-icon.png` | Android notification icon | 96×96 px, white on transparent |
| `assets/favicon.png` | Web favicon | 48×48 px |
| `store/app-store-icon-1024.png` | App Store Connect upload | 1024×1024 px, opaque |
| `store/play-store-icon-512.png` | Google Play listing icon | 512×512 px, opaque |

## Colour Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Ink (dark) | `#1A1714` | App icon background, android adaptive bg |
| Paper (light) | `#FAF7F2` | Light splash background, ring stroke on icon |
| Deeper dark | `#14110F` | Dark splash background |
| Brand orange | `#D9531E` | Bookmark arrow / notification accent |

## Setup

1. Copy `assets/` into your Expo project root (`app/assets/`).
2. Open `app.json` and merge in the keys from `app-config-snippet.json`.
3. **Before your first store build**, update the bundle identifier and package name — they cannot be changed after publishing.

> [!WARNING]
> `store/` images are **not** referenced by `app.json`. Upload them manually to App Store Connect and Google Play Console.

> [!NOTE]
> `source/*.svg` files are editing masters only and should not be shipped in the app bundle.
