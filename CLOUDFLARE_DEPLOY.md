# Cloudflare deploy

A projekt Angular 19-es, Supabase kliensoldali integrációval.

## Worker + static assets beállítás

A projekt gyökerében lévő `wrangler.jsonc` explicit megadja a statikus build mappát és az SPA fallbacket:

```json
{
  "name": "szerviz",
  "assets": {
    "directory": "./dist/gumi-szerviz-angular/browser",
    "not_found_handling": "single-page-application"
  }
}
```

Ez váltja ki a régi `_redirects` megoldást, ezért `_redirects` fájl nem kell.

## Build beállítás

```txt
Build command: npm run build
Deploy command: npx wrangler deploy
Node.js version: 20 vagy 22
```

A build ezt hozza létre:

```txt
dist/gumi-szerviz-angular/browser
```

## Environment variables

Build változóként add meg:

```txt
SUPABASE_URL=https://SAJAT_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=SAJAT_SUPABASE_ANON_VAGY_PUBLISHABLE_KEY
```

A `SUPABASE_URL` csak az alap projekt URL legyen, `/rest/v1/` nélkül.

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
