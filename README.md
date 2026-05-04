# Duna Gumi Szerviz Angular + Supabase demo

Egyszerű gumiszerviz weboldal Angularban, Supabase adatbázissal.

## Funkciók

- Főoldal árlistával, kapcsolattal és nyitvatartással
- Külön foglaló oldal: `/foglalas`
- Dátum alapján látható szabad időpontok
- Foglalás mentése Supabase `bookings` táblába
- Admin oldal: `/admin`
- Foglalások listázása és státuszkezelése
- Árlista elemek módosítása és új ár létrehozása

## Futtatás

```bash
npm install
npm start
```

Ezután:

```txt
http://localhost:4200
```

## Supabase setup

1. Hozz létre egy Supabase projektet.
2. Supabase Dashboard -> SQL Editor -> New query.
3. Másold be és futtasd a `supabase/schema.sql` fájl tartalmát.
4. Supabase Dashboard -> Project Settings / Connect dialog alatt másold ki:
   - Project URL
   - anon / publishable key
5. Írd be ezeket ide:

```ts
// src/environments/environment.ts
export const environment = {
  production: false,
  supabaseUrl: 'https://YOUR_PROJECT_ID.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY'
};
```

Ugyanezt állítsd be a `src/environments/environment.prod.ts` fájlban is.

## Admin user létrehozása

1. Supabase Dashboard -> Authentication -> Users alatt hozz létre egy felhasználót.
2. Ha az e-mail megerősítés be van kapcsolva, erősítsd meg a usert, vagy fejlesztésnél kapcsold ki a Confirm email opciót.
3. Másold ki a user UUID-ját.
4. SQL Editorban futtasd:

```sql
insert into public.admin_users (user_id)
values ('IDE_JON_A_SUPABASE_AUTH_USER_UUID');
```

Ezután az `/admin` oldalon ezzel az e-mail + jelszó párossal be tudsz lépni.

## Időpontlogika

A foglaló oldal jelenleg fix nyitvatartásból generál 30 perces slotokat:

- Hétfő–csütörtök: 08:00–17:00
- Péntek: 08:00–16:00
- Szombat: 09:00–13:00
- Vasárnap: zárva

A Supabase `get_booked_times` RPC csak a már foglalt időpontokat adja vissza, nem ad ki ügyféladatokat publikus oldalon.

## Biztonság

A projekt Row Level Security policy-kat használ:

- árlistát bárki olvashatja, de csak admin módosíthatja;
- foglalást bárki létrehozhat;
- foglalásokat csak admin olvashat és módosíthat;
- a publikus foglaló oldal csak a foglalt időpontokat kapja vissza RPC-n keresztül.

## Ha 401/403 vagy permission hiba jön

Supabase Dashboardban ellenőrizd, hogy a Data API alatt a `public` schema és a szükséges táblák / functionök elérhetőek-e. A `schema.sql` tartalmazza a szükséges GRANT és RLS beállításokat, de a projekt beállításaitól függően ezt a dashboardon is engedélyezni kellhet.
