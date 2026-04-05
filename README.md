# 🧴 Mouchak Cosmetics

> **Full-stack e-commerce + inventory management** for cosmetics. Storefront, staff dashboard, POS, inventory tracking, and analytics.

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Keycloak-SSO-4D4D4D?style=flat-square" />
  <img src="https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square" />
</p>

## 🎯 What It Does

- 🌐 **Public Storefront** — Browse, search, filter products with category navigation
- 🔐 **Secure Authentication** — Keycloak SSO with role-based access (Customer/Staff/Admin)
- 🛒 **Customer Portal** — Shopping cart, wishlist, checkout, order tracking
- 💳 **Payment Processing** — SSLCommerz IPN webhooks with transaction reconciliation & refund workflow
- 📦 **Dual-Channel Inventory** — Real-time stock syncing between online orders & POS walk-in sales with reserved quantities
- 🏪 **POS Billing** — Point-of-sale system for staff to process walk-in customers
- 📊 **Business Analytics** — Revenue trends, top products, inventory valuation, order fulfillment metrics
- 👥 **Staff Dashboard** — Order processing, inventory adjustments, customer management in one place

## 🛠️ Tech Stack

**Frontend:** Next.js 16 + TypeScript + Tailwind + React Query  
**Backend:** Express.js + TypeScript + Prisma + PostgreSQL  
**Critical:** Keycloak (SSO/JWT) • PostgreSQL 16 • Prisma ORM  
**Integrations:** SSLCommerz (Payments)  

## 🚀 Quick Start

**Prerequisites:** Node.js 20+, PostgreSQL 16+

```bash
# Backend
cd server && npm install && npm run db:push && npm run dev

# Frontend (new terminal)
cd client && npm install && npm run dev
```

Visit: `http://localhost:3000` (frontend), `http://localhost:4000/api` (backend)

## 📚 Documentation

- [Full README](./README_FULL.md) — Complete setup, architecture, API docs
- [Backend Details](./server/README.md) — API routes, database schema
- [Frontend Details](./client/README.md) — Component structure, authentication

---

**Build time:** ~5 min | **Lines of code:** ~3500 | **TypeScript coverage:** 100%
