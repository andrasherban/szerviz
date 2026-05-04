-- Duna Gumi Szerviz Supabase schema
-- Futtatás: Supabase Dashboard -> SQL Editor -> New query -> Run

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.service_prices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_amount integer not null check (price_amount >= 0),
  price_suffix text not null default 'Ft-tól',
  display_order integer not null default 99,
  duration_minutes integer not null default 30 check (duration_minutes > 0),
  is_highlighted boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  email text,
  vehicle_type text,
  license_plate text,
  service_price_id uuid references public.service_prices(id) on delete set null,
  requested_date date not null,
  requested_time time not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists bookings_unique_active_slot
on public.bookings (requested_date, requested_time)
where status in ('pending', 'confirmed');

create unique index if not exists service_prices_unique_name
on public.service_prices (name);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_service_prices_updated_at on public.service_prices;
create trigger set_service_prices_updated_at
before update on public.service_prices
for each row execute function public.set_updated_at();

drop trigger if exists set_bookings_updated_at on public.bookings;
create trigger set_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

create or replace function public.get_booked_times(target_date date)
returns table (requested_time time)
language sql
stable
security definer
set search_path = public
as $$
  select b.requested_time
  from public.bookings b
  where b.requested_date = target_date
    and b.status in ('pending', 'confirmed')
  order by b.requested_time;
$$;

grant usage on schema public to anon, authenticated;
grant select on public.service_prices to anon, authenticated;
grant insert on public.bookings to anon, authenticated;
grant select, update on public.bookings to authenticated;
grant select on public.admin_users to authenticated;
grant insert, update, delete on public.service_prices to authenticated;
grant execute on function public.get_booked_times(date) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.admin_users enable row level security;
alter table public.service_prices enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "Admins can read their own admin row" on public.admin_users;
create policy "Admins can read their own admin row"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Public can read active service prices" on public.service_prices;
create policy "Public can read active service prices"
on public.service_prices
for select
to anon, authenticated
using (is_active = true or public.is_admin());

drop policy if exists "Admins can manage service prices" on public.service_prices;
create policy "Admins can manage service prices"
on public.service_prices
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Anyone can create pending bookings" on public.bookings;
create policy "Anyone can create pending bookings"
on public.bookings
for insert
to anon, authenticated
with check (status = 'pending');

drop policy if exists "Admins can read bookings" on public.bookings;
create policy "Admins can read bookings"
on public.bookings
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update bookings" on public.bookings;
create policy "Admins can update bookings"
on public.bookings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.service_prices (name, description, price_amount, price_suffix, display_order, duration_minutes, is_highlighted, is_active)
values
  ('Kerékcsere hozott kerékszettel', 'Szezonális kerékcsere személyautóra, alap ellenőrzéssel.', 12000, 'Ft-tól', 1, 30, false, true),
  ('Gumicsere + centrírozás', 'Abroncs le- és felszerelés, centrírozás, szelep ellenőrzése.', 18000, 'Ft-tól', 2, 45, true, true),
  ('Defektjavítás', 'Sérülésvizsgálat, javítás javítható abroncs esetén.', 6000, 'Ft-tól', 3, 30, false, true),
  ('TPMS szelep kezelés', 'TPMS ellenőrzés, szelepcsere és alap programozási segítség.', 8000, 'Ft-tól', 4, 30, false, true)
on conflict (name) do update set
  description = excluded.description,
  price_amount = excluded.price_amount,
  price_suffix = excluded.price_suffix,
  display_order = excluded.display_order,
  duration_minutes = excluded.duration_minutes,
  is_highlighted = excluded.is_highlighted,
  is_active = excluded.is_active;

-- Admin jogosultság beállítása:
-- 1. Supabase Dashboard -> Authentication -> Users alatt hozz létre egy admin usert.
-- 2. Másold ki a user UUID-ját.
-- 3. Futtasd ezt külön, a saját UUID-val:
-- insert into public.admin_users (user_id) values ('IDE_JON_A_SUPABASE_AUTH_USER_UUID');
