# CleanAglow — Full-Stack Home Cleaning Marketplace Plan

## Top-Level Overview

Build a greenfield, production-grade two-sided home cleaning marketplace from scratch.  
The platform connects **homeowners** (customers) with **independent cleaners** (pros) through a subscription-first booking engine, powered by Stripe for billing and payouts.

**Three separate deployable surfaces:**
1. `apps/web` — Customer + Cleaner portal (Next.js, Tailwind, NextAuth)
2. `apps/admin` — Internal admin panel (separate Next.js app at `admin.domain.com`)
3. `packages/` — Shared Prisma schema, TypeScript types, and utilities (monorepo)

**Key architectural decisions captured from requirements gathering:**
- Monorepo layout using `pnpm workspaces` (or Turborepo) to share schema/types
- Authentication: NextAuth.js with JWT (email/password + Google + Apple) across all portals
- Geographic matching: zip-code string matching only (no PostGIS)
- Real-time chat: Socket.io (Node.js server co-located in `apps/web`)
- Stripe: Standard Connect for cleaner payouts; Stripe Subscriptions for recurring billing
- Admin panel: standalone isolated Next.js app, separate from the main web app
- Database: PostgreSQL + Prisma ORM

---

## Sub-Tasks

---

### Sub-Task 1 — Monorepo Scaffold & Shared Packages

**Status:** `[x] done`

**Intent**  
Stand up the project skeleton so all subsequent sub-tasks have a consistent foundation to build on. Establishing the monorepo structure first prevents refactoring mid-build and ensures the Prisma schema is the single source of truth for types across all apps.

**Expected Outcomes**
- `pnpm-workspace.yaml` at root wiring `apps/*` and `packages/*`
- `packages/db` — Prisma schema, generated client, and seed script
- `packages/types` — Shared TypeScript interfaces auto-derived from Prisma
- `packages/config` — Shared ESLint, Tailwind, and TypeScript base configs
- `apps/web` — blank Next.js 14 (App Router) project with Tailwind wired
- `apps/admin` — blank Next.js 14 project (same config)
- Root `turbo.json` defining `build`, `dev`, `lint`, `db:push` pipelines

---

### Sub-Task 2 — Prisma Database Schema

**Status:** `[x] done`

**Intent**  
Define the complete, normalized data model that every feature in the platform depends on. The schema must accommodate all three portals, Stripe's external IDs, subscription lifecycle states, and the chat system.

**Expected Outcomes**
- `packages/db/prisma/schema.prisma` is complete and validates with `prisma validate`
- `prisma db push` applies cleanly to a local PostgreSQL instance
- `prisma generate` produces a fully-typed client
- Seed script populates realistic test data (3 customers, 5 cleaners, 10 bookings)

---

### Sub-Task 3 — Authentication Layer (NextAuth.js)

**Status:** `[x] done`

**Intent**  
Implement a unified auth system that covers all three user roles, issuing JWTs that carry the `role` claim so both apps can gate routes without an extra DB lookup per request.

**Expected Outcomes**
- `/api/auth/[...nextauth]` handler in `apps/web` resolving credentials + Google + Apple
- Custom JWT callback embedding `userId`, `role`, `cleanerProfileId` into the token
- `getServerSession()` utility available to all API route handlers and server components
- Role-based middleware in `apps/web/middleware.ts` protecting `/dashboard`, `/pro`, `/admin` prefixes
- Admin panel `apps/admin` uses the same NextAuth config but restricts to `role === ADMIN`
- Passwords hashed with `bcryptjs` (12 rounds)
- Email verification flow (token stored in DB, sent via Resend/SendGrid)

---

### Sub-Task 4 — Pricing Engine & Service Zone API

**Status:** `[x] done`

**Intent**  
Implement the instant price estimation logic that powers the customer booking funnel. This is the core revenue calculation: base price from zip code + bedroom/bathroom multipliers + add-on costs + subscription discount.

**Expected Outcomes**
- `GET /api/pricing/estimate` accepts home specs + zip + plan and returns a price breakdown JSON
- `GET /api/zones/check` accepts a zip code and returns availability + base price
- Pricing formula is centralized in `packages/types/src/pricing.ts` so frontend and backend share the same logic
- Admin can update `ServiceZone` base prices and `AddOnPricing` via admin API endpoints

---

### Sub-Task 5 — Stripe Integration (Subscriptions + Connect)

**Status:** `[x] done`

**Intent**  
Wire up all money movement: customer subscription billing, per-booking payment intents, cleaner Stripe Connect onboarding, and platform-to-cleaner transfers. This is the most complex sub-task and must be complete before booking creation.

**Expected Outcomes**
- Stripe webhook handler at `POST /api/webhooks/stripe` processing all relevant events
- Customer subscription lifecycle: create → active → invoice paid → cancel/pause
- Cleaner Connect onboarding: account link generation, onboarding status check
- Per-booking PaymentIntent created at booking confirmation, captured at job completion
- Cleaner payout transfer triggered automatically after booking status → COMPLETED
- Cancellation fee logic: charge 50% of booking price if canceled within 24 hours

---

### Sub-Task 6 — Customer Portal: Booking Funnel & Dashboard

**Status:** `[x] done`

**Intent**  
Build the customer-facing Next.js pages: the multi-step onboarding/booking funnel, the subscription selector, and the post-login dashboard. This is the primary revenue-generating surface.

**Expected Outcomes**
- Multi-step booking funnel at `/book` (5 steps, client-side state machine)
- Subscription plan selection page with dynamic pricing display
- Customer dashboard at `/dashboard` with upcoming bookings, active subscription, and assigned cleaner card
- Reschedule/cancel flow with cancellation fee warning modal
- Saved payment method management via embedded Stripe Elements
- Cleaning checklist/instructions edit form
- Mobile-first responsive design on all pages

---

### Sub-Task 7 — Cleaner Portal: Job Board, Calendar & Earnings

**Status:** `[x] done`

**Intent**  
Build the independent cleaner's portal — the job feed filtered by their zip codes, scheduling tools, and earnings/payout visibility. This is the supply-side of the marketplace.

**Expected Outcomes**
- `/pro/jobs` — job board listing available bookings in cleaner's service zip codes
- Accept/decline with optimistic UI update and real-time conflict check
- `/pro/calendar` — weekly calendar view of confirmed jobs
- `/pro/earnings` — completed jobs list, total earned, upcoming payouts, Stripe Connect onboarding CTA
- Stripe Connect onboarding flow embedded in earnings page
- Preference editor for service zip codes and radius

---

### Sub-Task 8 — Real-Time Chat (Socket.io)

**Status:** `[x] done`

**Intent**  
Implement bidirectional in-app messaging between customers and their assigned cleaners. Socket.io server runs as a custom Next.js server (or a small companion Express process) to enable WebSocket support.

**Expected Outcomes**
- Socket.io server integrated into `apps/web` via custom `server.ts`
- `Conversation` and `Message` records persisted to PostgreSQL on every send
- Chat UI available at `/dashboard/messages/:conversationId` (customer) and `/pro/messages/:conversationId` (cleaner)
- Unread message count badge on nav
- Messages load via REST on page mount, then live updates via Socket.io

---

### Sub-Task 9 — Admin Panel

**Status:** `[x] done`

**Intent**  
Build the standalone admin application at `apps/admin` with full platform oversight, dispute management, and pricing/zone configuration. Restricted to users with `role === ADMIN`.

**Expected Outcomes**
- Admin dashboard at `/` showing KPI cards: GMV, active subscriptions, total bookings, MoM growth
- Bookings table with filters (status, date range, zip), detail drawer
- Subscriptions table with cancel/pause admin override actions
- Dispute queue with investigation workflow (OPEN → UNDER_REVIEW → RESOLVED)
- Service zone management: create/edit zones, toggle active, set base price
- Commission rate editor (stored in a `PlatformConfig` DB table)
- Refund issuance form linked to a booking payment
- Cleaner approval workflow (review profile, approve/reject Connect onboarding)

---

### Sub-Task 10 — Notification System & Email Templates

**Status:** `[x] done`

**Intent**  
Wire transactional emails and in-app notifications for the key lifecycle events: booking confirmation, 24h reminder, cleaner assigned, booking completed, review request, and payment failure.

**Expected Outcomes**
- `Notification` model in Prisma (in-app bell icon)
- Email sent via Resend SDK for: registration verify, booking confirm, 24h reminder, payment failure, payout received
- In-app notification bell in nav with unread count
- `GET /api/notifications` returns unread notifications for current user

---

### Sub-Task 11 — Testing, Environment Config & Deployment

**Status:** `[x] done`

**Intent**  
Finalize the project with test coverage for critical paths, complete environment variable documentation, and deployment configuration for Vercel (web + admin) + a managed PostgreSQL provider.

**Expected Outcomes**
- Unit tests for pricing engine and subscription logic (Jest / Node test runner)
- Integration tests for key API routes (booking creation, subscription webhook)
- `.env.example` documenting every required variable
- `vercel.json` in `apps/web` and `apps/admin` for deployment
- `Dockerfile` for Socket.io custom server if not using Vercel Edge
- Database migration strategy documented

---

## Environment Variables Reference

| Variable | App | Purpose |
|---|---|---|
| `DATABASE_URL` | both | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | both | JWT signing secret |
| `NEXTAUTH_URL` | web | `https://cleanaglow.com` |
| `NEXTAUTH_URL` | admin | `https://admin.cleanaglow.com` |
| `GOOGLE_CLIENT_ID` | web | OAuth |
| `GOOGLE_CLIENT_SECRET` | web | OAuth |
| `APPLE_CLIENT_ID` | web | OAuth |
| `APPLE_CLIENT_SECRET` | web | OAuth |
| `STRIPE_SECRET_KEY` | web | Server-side Stripe API |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | web | Client-side Stripe Elements |
| `STRIPE_WEBHOOK_SECRET` | web | Webhook signature verification |
| `STRIPE_CONNECT_CLIENT_ID` | web | Standard Connect |
| `STRIPE_PRICE_ID_WEEKLY` | web | Stripe recurring price ID |
| `STRIPE_PRICE_ID_BIWEEKLY` | web | Stripe recurring price ID |
| `STRIPE_PRICE_ID_MONTHLY` | web | Stripe recurring price ID |
| `RESEND_API_KEY` | web | Transactional email |
| `CRON_SECRET` | web | Protect cron route |
| `PLATFORM_COMMISSION_RATE` | web | Default commission (e.g. 0.30) |
| `NEXT_PUBLIC_APP_URL` | web | Used in email links |

---

## Architecture Diagram Reference

```
┌─────────────────────────────────────────────┐
│              MONOREPO (pnpm + Turborepo)     │
│                                             │
│  apps/web              apps/admin           │
│  ┌──────────────┐      ┌──────────────┐     │
│  │ Next.js 14   │      │ Next.js 14   │     │
│  │ App Router   │      │ App Router   │     │
│  │ + Socket.io  │      │ ADMIN only   │     │
│  └──────┬───────┘      └──────┬───────┘     │
│         │                     │             │
│  packages/db (Prisma + PostgreSQL)          │
│  packages/types (shared TS interfaces)      │
│  packages/config (ESLint, Tailwind, TS)     │
└─────────────────────────────────────────────┘
         │                     │
    Stripe API            Resend API
  (Subscriptions,        (Transactional
   Connect, Webhooks)     Emails)
```
