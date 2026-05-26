# Iletisim Panosu (AAC PWA)

iPhone 12 ekranina uygun, offline destekli AAC ses panosu.

## Deploy Akisi (GitHub -> Vercel)

1. Bu klasore gir:

```bash
cd "/Users/ugurdenizvural/Downloads/ACC tool/iletisim-panosu"
```

2. Gerekli dosyalari yerlestir:
- `bg-hilal.jpg` dosyasini proje kokune koy.
- Ses dosyalarini `sounds/` klasorune koy.

3. GitHub repo olusturup pushla:

```bash
git init
git add .
git commit -m "Initial AAC PWA"
git branch -M main
git remote add origin https://github.com/<kullanici>/<repo>.git
git push -u origin main
```

4. Vercel deploy:
- Vercel'e gir, `Add New -> Project`
- GitHub repoyu sec
- Framework: `Other`
- Build command: bos birak
- Output directory: bos birak
- Deploy

## Lokal Test

Service Worker testleri icin local server ile ac:

```bash
python3 -m http.server 8080
```

Ardindan `http://localhost:8080` adresini ac.

## Notlar
- `vercel.json` dosyasi SW cache davranisi ve manifest content-type icin eklendi.
- Yeni buton eklemek icin `app.js` icindeki `soundButtons` dizisine yeni obje ekle.
