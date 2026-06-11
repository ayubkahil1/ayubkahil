# Amiin — Portfolio Website

Portfolio website oo casri ah, oo loo dhisay HTML, CSS, iyo JavaScript saafi ah.
Wax build ama framework uma baahna — kaliya fur `index.html`.

## ✨ Astaamaha (Features)

- 🎨 Naqshad casri ah oo qurux badan
- 🌙 Dark / Light mode (waa la kaydiyaa)
- 📱 Responsive — wuu shaqeeyaa mobile, tablet, iyo computer
- ⚡ Deg-deg ah, framework la'aan
- 🧩 Qaybo: Hero, About, Skills, Projects, Contact
- 📨 Form xiriir oo shaqeeya (email)

## 📂 Faylasha (Files)

```
.
├── index.html        # Bogga ugu weyn (structure-ka)
├── styles.css        # Dhammaan midabada iyo naqshadeynta
├── script.js         # Theme toggle, menu, form, animation
├── assets/
│   ├── favicon.svg   # Astaanta tab-ka browser-ka
│   └── cv.pdf        # (Ku dar CV-gaaga halkan)
└── README.md         # Faylkan
```

## 🚀 Sida loo isticmaalo

1. **Fur si toos ah:** Riix-laba-jeer (double-click) `index.html`.
2. **Server maxalli ah (la talisay):**
   ```bash
   # Haddii aad leedahay Python
   python3 -m http.server 3000
   # Ka dibna fur: http://localhost:3000
   ```

## ✏️ Sida loo beddelo (Customize)

| Waxaad beddeleyso | Halka |
|---|---|
| Magacaaga, qoraalka | `index.html` |
| Midabada (color) | `styles.css` — qaybta `:root` |
| Mashruucyada | `index.html` — qaybta `#projects` |
| Xirfadaha | `index.html` — qaybta `#skills` |
| Linkiyada bulshada | `index.html` — `hero-socials` |
| CV-ga | Ku rar `assets/cv.pdf` |

## ☁️ Deploy (Internet-ka soo saar)

### Vercel (ugu fudud)
```bash
npm i -g vercel
vercel
```

### Netlify
Jiid faylasha oo ku rid [netlify.com/drop](https://app.netlify.com/drop)

### GitHub Pages
Ku shub repo, ka dibna Settings → Pages → branch `main`.

---

La sameeyay ❤️ — 2026
