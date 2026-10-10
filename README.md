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
- **AI enhancement** — there's no call to an AI model yet. 
- **Payments** — no checkout yet.
- **Photo storage** — photos are stored as base64 directly in Blobs, 
- **Admin auth** — uses a single shared password (see below), 

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

