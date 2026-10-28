# CleanAglow — Full-Stack Home Cleaning Marketplace

Production-grade two-sided home cleaning marketplace connecting homeowners with independent cleaners via subscription-first booking, powered by Stripe, Next.js, and Prisma.

## Workspace Architecture

```
cleanaglow/
├── apps/
│   ├── web/          # Next.js customer + cleaner portal (port 3000)
│   └── admin/        # Next.js admin dashboard (port 3001)
├── packages/
│   ├── db/           # Prisma client, migrations & seeders
│   ├── types/        # Shared TypeScript interfaces & pricing engine
│   └── config/       # Shared TypeScript, ESLint, and Tailwind configurations
```

## Quick Start

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

3. **Database setup:**
   ```bash
   pnpm db:generate
   pnpm db:push
   pnpm db:seed
   ```

4. **Run development servers:**
   ```bash
   pnpm dev
   ```
   - Customer & Cleaner Portal: `http://localhost:3000`
   - Admin Dashboard: `http://localhost:3001`

## On-demand Tasks (TaskRabbit-style)

Beyond recurring cleaning, customers can hire local **Taskers** (users with a `CLEANER` role and a profile) for one-off jobs:
furniture assembly, mounting, moving help, repairs, yard work, delivery, painting, organizing and cleaning.

| Flow | Customer | Tasker |
|---|---|---|
| Browse | `/taskers` (filter by category, ZIP, price, vehicle), `/taskers/[id]` | `/pro/profile` (headline, skills, hourly rate, ZIPs) |
| Hire directly | "Select & Continue" -> `/dashboard/tasks/new?taskerId=` | `/pro/tasks` -> Direct requests -> accept / decline |
| Post a task | `/dashboard/tasks/new` -> review offers -> **Hire** | `/pro/tasks` -> Open tasks -> **Make an offer** |
| Do the work | `/dashboard/tasks/[id]` (track, cancel) | Start -> Complete (enter hours worked) |
| After | Review + tip | Payout + tip in `/pro/earnings` |

Pricing lives in `packages/types/src/tasks.ts`: hourly subtotal + 15% customer Trust & Support fee; the Tasker keeps 90% of the subtotal and 100% of tips.
Exact street address is only revealed to the Tasker once they are hired. Canceling an assigned task less than 24h out incurs a 50% fee.

API: `/api/tasks`, `/api/tasks/[id]/{offers/[offerId]/accept,status,cancel,tip,review}`, `/api/taskers`, `/api/pro/tasks`, `/api/pro/tasks/[id]/{offer,invite}`.

After pulling these changes run `pnpm db:push && pnpm db:generate && pnpm db:seed`, then restart the dev server.
