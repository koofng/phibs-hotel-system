# Deploying to Render

The whole system runs as **one Render web service** (the API also serves the website) plus a
**Render PostgreSQL database**, both in the Frankfurt region. Everything is described in
[`render.yaml`](render.yaml), so Render sets most of it up for you.

Expected cost: about **$7/month** (web service, Starter) + **$6/month** (database, Basic 256 MB).
Check [render.com/pricing](https://render.com/pricing) for current prices.

---

## 1. Put the code on GitHub

Render deploys from a Git repository. If the project isn't on GitHub yet:

1. Create an empty **private** repository on [github.com/new](https://github.com/new) (no README).
2. In the project folder, run:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```

`.env` files with local passwords are already excluded by `.gitignore`, so they won't be uploaded.

## 2. Create the services on Render

1. Sign in at [dashboard.render.com](https://dashboard.render.com) and connect your GitHub account.
2. Click **New → Blueprint** and pick your repository. Render reads `render.yaml` and shows:
   - `phibs-hotel-db`, the PostgreSQL database
   - `phibs-hotel`, the web service
3. Render asks for three values. These create your first admin login:

   | Key | What to enter |
   |---|---|
   | `ADMIN_EMAIL` | The email you'll log in with, e.g. `phibsluxuryhomes@gmail.com` |
   | `ADMIN_PASSWORD` | A strong password, **at least 8 characters** |
   | `ADMIN_NAME` | Your name as it should appear on receipts |

4. Click **Apply**. The first build takes a few minutes. When it finishes, the service shows
   **Live** and a URL like `https://phibs-hotel.onrender.com`.

Everything else is set automatically: the database connection, a random `JWT_SECRET`, secure
cookies, and database migrations, which run on every start.

## 3. First login and setup

1. Open the service URL and log in with the admin email and password from step 2.
2. The production database starts **empty**. Add your data in the app:
   - **Inventory → Room types**: Phibs Cozy Single, Prestige, Diamond and Platinum Suites
   - **Inventory → Rooms**: your real room numbers
   - **Admin → Users**: front-desk staff accounts
3. Optional but recommended: in Render, open `phibs-hotel` → **Environment** and delete
   `ADMIN_PASSWORD`. It's only used once, on an empty database, and the account keeps working.

The public booking page is at `https://<your-url>/book`.

## 4. Updating the live site

Push changes to the `main` branch on GitHub:

```bash
git add .
git commit -m "Describe the change"
git push
```

Render rebuilds and redeploys automatically. Database changes (Prisma migrations) are applied
on startup.

## 5. Using your own domain (optional)

In Render, open `phibs-hotel` → **Settings → Custom Domains → Add**, enter e.g.
`app.phibsluxuryhomes.com`, and add the DNS record Render shows at your domain registrar.
HTTPS is set up automatically. Nothing in the app needs to change.

## 6. Backups

Paid Render databases include daily backups. You can see and restore them under
`phibs-hotel-db` → **Recovery**. To take a manual copy, use the **External Database URL**
from the database's **Connect** menu:

```bash
pg_dump "<external-database-url>" > phibs-backup.sql
```

## Troubleshooting

| Problem | What to check |
|---|---|
| Build fails | Open the deploy log in Render; the first error line usually names the problem. |
| Site loads but login fails | Make sure you're on the `https://` address and `COOKIE_SECURE` is `true`. If you use a custom domain, keep using that domain for every visit. |
| "Invalid email or password" for the admin | The admin is only created when the database has **no** users. If you changed `ADMIN_EMAIL` after the first deploy, the original email is still the login. |
| Service shows "Deploy failed" on start | Check the log for `prisma migrate deploy` errors. Usually the database isn't ready yet; redeploy with **Manual Deploy → Deploy latest commit**. |

## How it fits together (for developers)

- **Build:** `npm ci --include=dev && npm run build` generates the Prisma client, compiles the
  server to `server/dist`, and builds the React app to `client/dist`.
- **Start:** `npm run start:prod` runs `prisma migrate deploy`, then `node server/dist/index.js`.
- In production (`NODE_ENV=production`) Express serves `client/dist` and sends `index.html` for
  any non-`/api` path, so the site and API share one origin and the login cookie works.
- The client calls the API at `/api/v1` (set in `client/.env.production`).
- `TRUST_PROXY=1` makes Express read real visitor IPs from Render's proxy, which the booking
  rate limit relies on.
- On startup, if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set and the database has no users,
  one admin account is created (`server/src/lib/bootstrap.ts`).
- Local development is unchanged: `npm run dev` still runs the Vite dev server and API separately.
