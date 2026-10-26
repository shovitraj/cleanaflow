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
