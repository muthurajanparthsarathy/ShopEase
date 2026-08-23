# ShopEase — Angular Frontend

An Angular 21 rewrite of the ShopEase e-commerce application — same UI and the same full set of customer + admin use cases as the original HTML/CSS/vanilla-JS reference app, rebuilt with proper architecture: typed models, a repository pattern, Reactive Forms, signal-based state, and RxJS throughout.

This project is `src/ShopEase.Web` inside the `ShopEase` solution (`ShopEase.slnx`), which is set up to hold this frontend alongside a future ASP.NET Core + SQL Server backend (`ShopEase.Api`).

## Table of contents

- [Project overview](#project-overview)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Folder structure](#folder-structure)
- [Installation](#installation)
- [How to run](#how-to-run)
- [Seeded login credentials](#seeded-login-credentials)
- [Building for production](#building-for-production)
- [Data persistence](#data-persistence)
- [Solution / Visual Studio notes](#solution--visual-studio-notes)
- [Known simplifications](#known-simplifications)
- [Roadmap](#roadmap)

## Project overview

ShopEase is a full-featured e-commerce storefront with a separate admin console, originally built as a static HTML/Bootstrap/vanilla-JS app (`Ecommerce_Frontend`) with no backend — all data lived in `localStorage`. This project is a 1:1 feature migration of that app to Angular, keeping the exact same look and business behavior while replacing manual DOM manipulation with a proper component/service/state architecture.

There is currently **no backend** — the app still persists everything to `localStorage`, but through a repository layer designed so a real API can be dropped in later without touching any component or business-logic code (see [Architecture](#architecture)).

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Angular 21 (standalone components, no NgModules) |
| Language | TypeScript |
| State | Angular Signals |
| Async / streams | RxJS |
| Forms | Angular Reactive Forms |
| Styling | Bootstrap 5.3 + custom SCSS (ported from the reference app) |
| Charts | Chart.js (admin dashboard analytics) |
| PDF generation | jsPDF + jspdf-autotable (order invoices) |
| Persistence | Browser `localStorage` / `sessionStorage`, behind a repository abstraction |
| Build tooling | Angular CLI / `@angular/build` (esbuild-based) |

## Architecture

```
src/app/
├── core/            → app-wide singletons
│   ├── models/        typed interfaces for every entity (Product, Order, User, …)
│   ├── repositories/   one contract + localStorage implementation per entity, behind DI tokens
│   ├── services/       cross-feature business logic (Auth, Product, Cart, Order, Payment, …)
│   ├── stores/         signal-based global state (AuthStore, CartStore, NotificationStore, WishlistStore)
│   ├── guards/          route guards (authGuard, adminGuard, guestGuard)
│   ├── validators/      the 20+ regex validators from the reference app, as Reactive Forms validators
│   └── utils/            storage wrapper, formatting, pagination, CSV/Text export, seed data
├── shared/          → reusable, feature-agnostic pieces
│   ├── layout/          navbar, footer, toast host, loader overlay, admin ribbon
│   ├── components/      star rating, dynamic custom-field form/display
│   └── utils/            report-summary formatting helpers
└── features/        → one folder per business feature/page
    ├── auth/ catalog/ cart/ checkout/ orders/ profile/ notifications/ wishlist/ reports/ help/ home/
    └── admin/
        ├── dashboard/ products/ categories/ orders/ customers/ reports/
        └── cms/ dynamic/ backup/ help/
```

**Repository pattern (API-ready by design):** every entity (products, orders, users, payments, …) has an abstract repository contract in `core/repositories/`, currently bound to a `LocalStorage*Repository` implementation in `core/repositories/repository.providers.ts`. To point the app at a real backend later:

1. Write `Http<Entity>Repository implements <Entity>Repository` for the entity you're migrating.
2. Change one line in `repository.providers.ts`: `{ provide: ProductRepository, useClass: HttpProductRepository }`.

No service, store, or component changes are required — they all depend on the abstract repository, never the concrete implementation.

**State:** four signal-based stores (`AuthStore`, `CartStore`, `NotificationStore`, `WishlistStore`) hold canonical global state (who's logged in, cart contents, unread notifications, wishlist ids) and are read directly in templates — no manual subscribe/unsubscribe. Everything else is local component state.

**Async:** repository calls return `Observable`s (wrapped in an artificial delay via `simulateLatency()` so the async shape matches what a real HTTP call would look like — including the reference app's original 800ms order-placement and 1500ms payment-processing delays). RxJS is also used for debounced search and combined derived state.

## Features

### Customer
- Login / Register with full client-side validation
- Profile management + multiple delivery addresses (CRUD, set default)
- Product catalog — search, filter (category/price/stock/brand), sort, pagination, quick view
- Product detail — quantity selector, ratings & reviews (read/write), related products
- Wishlist
- Shopping cart — quantity control, save-for-later, coupon codes (`SAVE10`, `WELCOME50`, `FLAT100`, `FREESHIP`)
- Checkout — address selection, Credit Card / UPI / Cash on Delivery, simulated async payment
- Order history — filters, detail view with status timeline, cancel/return (with terms & conditions), reorder, PDF invoice download
- Notification centre (toast + persistent, unread badge)
- Reports — My Orders / My Payments / My Cart Summary, CSV & Text export, print view
- Help Centre — searchable articles, FAQ, quick-access tools

### Admin
- Dashboard — KPI cards, Chart.js analytics (revenue/orders trend, distribution by status/category/method), top products, stock alerts, recent orders, activity log
- Product management — full CRUD, SKU uniqueness validation, bulk CSV upload with template + validation preview
- Category management — CRUD with delete-protection (categories with products can't be deleted)
- Order management — status lifecycle (Pending → Processing → Shipped → Delivered), customer-facing notifications on change
- Customer management — search/filter, activate/deactivate accounts
- Report Centre — Sales, Order Details, Product Inventory, Payment Transactions, Customer List; filterable, CSV/Text export, print
- **Content (CMS)** — WYSIWYG-style editor for the customer Home page (hero + reorderable sections: categories, product showcases, banners, recent orders), live preview, publish/reset
- **Dynamic Handling** — define custom fields at runtime for Orders/Products/Customers/Categories (text/number/date/dropdown/checkbox), plus manage order statuses, payment statuses, and payment methods as live lookups
- **Backup & Recovery** — scheduled backup jobs (run/pause/delete), activity log with retry, quick JSON export, a 4-step restore wizard (identify → verify integrity → scope & target → execute) with a safe staging mode, and a "reset all data" danger zone
- Admin Help Centre

## Folder structure

See [Architecture](#architecture) above for the `src/app` layout. Top-level:

```
ShopEase.Web/
├── src/
│   ├── app/            ← application code (see above)
│   ├── styles.scss      ← Bootstrap import + ported custom theme
│   ├── index.html
│   └── main.ts
├── public/               ← static assets (favicon, etc.)
├── angular.json
├── package.json
└── ShopEase.Web.esproj   ← Visual Studio project file (see Solution notes)
```

## Installation

**Prerequisites:** Node.js 20.19+ / 22.12+ (Angular 21 requirement) and npm.

```bash
cd src/ShopEase.Web
npm install
```

## How to run

```bash
npm start
```

This runs `ng serve` and opens a dev server at **http://localhost:4200** with hot reload. Data seeds itself into `localStorage` on first load — no setup needed.

## Seeded login credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@shopease.com` | `Admin@123` |
| Customer | `rahul@email.com` | `Rahul@123` |
| Customer | `priya@email.com` | `Priya@123` |

(12+ more customer accounts are seeded — see `core/utils/seed-data.service.ts` for the full list.)

## Building for production

```bash
ng build
```

Output goes to `dist/ShopEase.Web`. This runs the production configuration (optimized, hashed filenames) by default.

## Data persistence

There is no backend yet, so all data lives in the browser:

- `localStorage` — products, categories, orders, payments, users, notifications, reviews, wishlist, coupons applied, CMS config, custom field definitions, backup jobs/activity, and an auto-incrementing counter per entity.
- `sessionStorage` — the current logged-in session only; clearing it logs you out without touching any other data.

To reset everything back to the seeded defaults, use **Admin → Backup → Danger Zone → Reset to Defaults** in the app, or clear your browser's site data for `localhost:4200`.

## Solution / Visual Studio notes

This project is registered in `ShopEase.slnx` (the solution file one level up, at `D:\.NET_2026\ShopEase\`) via `ShopEase.Web.esproj`, so it should appear in Visual Studio's Solution Explorer alongside the future backend project(s). Once `ShopEase.Api` (ASP.NET Core) is added to the same solution, Visual Studio's **Multiple Startup Projects** setting can launch both `ng serve` and the API together with a single F5.

> This `.esproj` setup was authored without access to a Visual Studio installation to verify it in — if Solution Explorer doesn't pick it up cleanly, it may need a small adjustment from within VS itself.

## Known simplifications

A couple of things were intentionally simplified relative to the original reference app, disclosed here for transparency:

- **Admin report export**: available as CSV, Text, and Print. The original app's more elaborate export dialog (password-protected PDF, Excel/XLSX, and a full print-layout customization modal) was not carried over — the reporting itself (filtering, running, viewing) is fully functional.

## Roadmap

- [ ] ASP.NET Core Web API backend (`ShopEase.Api`) + SQL Server, added to this same solution
- [ ] Swap `LocalStorage*Repository` implementations for `Http*Repository` ones, entity by entity
- [ ] Authentication via the real API (replacing the current localStorage-based session)
