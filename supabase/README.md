# Supabase Setup — Suite Marketplace

## 1. Create project

1. Go to https://supabase.com/dashboard → New project
2. Name: `suite-marketplace` (region: Singapore)
3. Save the database password somewhere safe

## 2. Run schema + seed

Open **SQL Editor** in Supabase dashboard, then:

1. Paste contents of `schema.sql` → **Run**
2. Paste contents of `seed.sql` → **Run**

This creates:
- `products`, `orders`, `order_items` tables
- `receipts` private storage bucket
- RLS policies
- 5 jerseys seeded (3 teams + 1 official limited edition)

## 3. Get API keys

In Supabase dashboard → **Settings → API**, copy:

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

Paste them into `.env`.

## 4. Create admin user

Dashboard → **Authentication → Users → Add user** (email + password).

Then in **SQL Editor** run (replace the email):

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
where email = 'admin@suite.my';
```

Login at `/admin/login` with that email.
