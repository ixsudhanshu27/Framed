# Framed — AI photo framing storefront

A working end-to-end site: a public storefront where customers upload a photo and
place an order, a **customer dashboard** to track it, and a password-protected
**admin dashboard** to manage all orders. Backend is plain JavaScript running as
Netlify Functions, with data stored in **Netlify Blobs** (Netlify's built-in
key-value store — no external database needed to get started).

## What's real vs. stubbed

Real and working:
- Order submission (photo + customer details), saved server-side
- Customer order lookup by email
- Admin login + order list + status updates (received → enhancing → printing → shipped → delivered)

Stubbed for you to wire up later:
- **AI enhancement** — there's no call to an AI model yet. When you're ready, add a
  `netlify/functions/enhance-photo.js` function that calls a service like Replicate
  or the Stability API with the uploaded image, and update `create-order.js` to
  trigger it (or run it as a background function, since AI calls are slow).
- **Payments** — no checkout yet. Stripe integrates cleanly as another Netlify Function.
- **Photo storage** — photos are stored as base64 directly in Blobs, which is fine
  for a demo/small volume. For production, move to S3, Cloudinary, or Netlify Large
  Media and store just the URL.
- **Admin auth** — uses a single shared password (see below), which is fine for one
  or two admins. For a real team, swap in Netlify Identity or Auth0.

## Project structure

```
framed/
├── public/                  ← static frontend (served as-is)
│   ├── index.html           ← landing page
│   ├── order.html           ← customer order form
│   ├── dashboard.html       ← customer order tracking
│   ├── admin.html           ← admin dashboard
│   ├── css/style.css
│   └── js/ (order.js, dashboard.js, admin.js)
├── netlify/functions/       ← backend, plain Node.js
│   ├── create-order.js
│   ├── get-orders.js
│   ├── update-order.js
│   └── admin-login.js
├── netlify.toml
└── package.json
```

## Run it locally

You'll need [Node.js](https://nodejs.org) (v18+) installed.

```bash
npm install -g netlify-cli   # if you don't have it already
cd framed
npm install
netlify login                # connects the CLI to your Netlify account
netlify dev                  # starts the site + functions locally, usually on localhost:8888
```

`netlify dev` runs both the static site and the functions together, and emulates
Netlify Blobs locally, so orders you create will persist between requests while
the dev server is running.

Before testing the admin dashboard locally, set an admin password:

```bash
# create a file called .env at the project root
echo "ADMIN_PASSWORD=choose-a-real-password" > .env
```

## Deploy to Netlify

**Option A — via Git (recommended):**
1. Push this folder to a GitHub/GitLab/Bitbucket repo.
2. In the Netlify dashboard: **Add new site → Import an existing project**, and
   connect the repo. Netlify will read `netlify.toml` automatically.
3. Under **Site settings → Environment variables**, add `ADMIN_PASSWORD` with a
   real password.
4. Deploy. Netlify Blobs works automatically in production, no extra setup.

**Option B — straight from the CLI:**
```bash
netlify init      # links this folder to a new or existing Netlify site
netlify env:set ADMIN_PASSWORD "choose-a-real-password"
netlify deploy --prod
```

## Using it

- **Storefront:** `/` → `/order.html` to place an order.
- **Customer dashboard:** `/dashboard.html`, enter the email used at checkout.
- **Admin dashboard:** `/admin.html`, sign in with `ADMIN_PASSWORD`, update order
  status as photos move through enhancement, printing, and shipping.

## Sensible next steps, roughly in order

1. Wire up a real AI enhancement call (Replicate/Stability) triggered on order creation.
2. Add Stripe checkout so orders require payment.
3. Move photo storage to S3/Cloudinary once volume grows past a few hundred orders.
4. Add customer email notifications (Resend, Postmark, or SendGrid) on status changes.
5. Replace the shared admin password with per-admin accounts (Netlify Identity).
