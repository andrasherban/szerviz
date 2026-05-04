# Cloudflare Pages deploy javítás

Ez a projekt Angular 18-as statikus SPA-ként deployolható Cloudflare Pagesre.
Ne Workers/Angular auto-config deployként futtasd, mert az Angular 19+ verziót várhat.

## Cloudflare Pages beállítás

Workers & Pages → Pages → Import existing Git repository

Javasolt beállítások:

```txt
Framework preset: None / No preset
Build command: npm run build
Build output directory: dist/cloudflare/browser
Node.js version: 20 vagy 22
```

## Environment variables

Settings → Environment variables alatt add meg Production és Preview környezetre is:

```txt
SUPABASE_URL=https://SAJAT_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=SAJAT_SUPABASE_ANON_VAGY_PUBLISHABLE_KEY
```

## Routing

A `src/_redirects` fájl bekerült, és az Angular build kimásolja a dist gyökerébe:

```txt
/* /index.html 200
```

Ez kell ahhoz, hogy a `/foglalas` és `/admin` direkt megnyitva/frissítve se adjon 404-et.

## Lokális ellenőrzés

```bash
npm install
SUPABASE_URL=https://SAJAT_PROJECT_ID.supabase.co SUPABASE_ANON_KEY=SAJAT_KULCS npm run build
```

Windows PowerShell esetén:

```powershell
$env:SUPABASE_URL="https://SAJAT_PROJECT_ID.supabase.co"
$env:SUPABASE_ANON_KEY="SAJAT_KULCS"
npm run build
```
