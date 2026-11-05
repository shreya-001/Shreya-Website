# Setting up The Lantern Library app

The app lives at **https://shreya-001.github.io/Shreya-Website/library/**. It saves your books in
Supabase, asks Claude for genres and recommendations through a small server function, and keeps the
Reading section of this website in sync automatically.

It takes about 15 minutes and can all be done on your phone. Supabase screens change now and then,
so a button may be labelled slightly differently from what's written here.

## 1. Create the database (Supabase, free)

1. Go to **supabase.com**, sign up, and tap **New project**.
   Name it `lantern-library`, pick the region **Canada (Central)**, and save the database password somewhere safe.
2. When the project is ready, open **SQL Editor**, then **New query**.
   Paste everything from [`setup/schema.sql`](setup/schema.sql) and tap **Run**. It should say *Success*.
3. Open **Project Settings → API** (sometimes called *Data API* or *API Keys*). Copy two values:
   - **Project URL** (looks like `https://abcdefghijk.supabase.co`)
   - **anon public** key (it may be labelled *publishable* key)

## 2. Connect the app and website

Open [`library/config.js`](config.js) on GitHub, tap the pencil, paste the two values between the quotes, and commit:

```js
window.LANTERN_CONFIG = {
    supabaseUrl: "https://abcdefghijk.supabase.co",
    supabaseAnonKey: "eyJhbGciOi...",
};
```

Both values are safe to make public. The database rules only let you change your own data.

## 3. Give the librarian a Claude key (Anthropic, pay as you go)

1. Go to **console.anthropic.com** and sign up.
2. Under **Billing**, add a small credit (for example $5) and set a **monthly spend limit**.
   Genre lookups and recommendations for one reader cost cents a month.
3. Under **API Keys**, tap **Create key** and copy it. You only see it once.

## 4. Add the librarian function (Supabase)

1. In Supabase, open **Edge Functions → Deploy a new function → Via editor**.
2. Name it exactly `librarian`, replace the sample code with everything from [`setup/librarian.ts`](setup/librarian.ts), and tap **Deploy**.
3. Open **Edge Functions → Secrets** and add:
   - `ANTHROPIC_API_KEY` = the key from step 3
   - `OWNER_EMAIL` = the email you will sign in to the library with

Only that email can use the librarian, so nobody else can spend your credit.

## 5. Create your account, then lock the door

1. Open **https://shreya-001.github.io/Shreya-Website/library/** and tap **Create my account**
   with the same email as `OWNER_EMAIL`. Confirm the email if Supabase asks, then sign in.
2. In Supabase, open **Authentication → Sign In / Providers** (or *Settings*) and switch off
   **Allow new users to sign up**. Now only you can sign in.

## 6. Move your books over

1. Open the old Lantern Library on claude.ai and scroll to the bottom. Tap **Website & moving**,
   then **Copy backup** (or **Download backup**).
2. In the new app, tap **Website & backup** at the bottom, paste the backup (or choose the file), and tap **Import**.

Your books, quotes, goals, picks and spine photos all come across. The website updates a few seconds later.

## 7. Put it on your home screen

- **iPhone:** open the app link in Safari, tap **Share → Add to Home Screen**.
- **Android:** open it in Chrome, tap **⋮ → Install app** (or *Add to Home screen*).

It opens full screen like any other app.

## How sync works

- Every change you make (a new book, a page update, a rating, a quote) saves to Supabase right away.
  If the app is open on two devices, the other one updates within a second or two.
- A few seconds after a change, the app publishes the parts you chose to share (in **Website & backup**)
  to the public reading log. The Reading section and `reading.html` read it every time someone opens the page.
- If the database is ever unreachable, the website falls back to `assets/data/reading.json`.
