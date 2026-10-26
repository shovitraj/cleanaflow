# CleanAglow Custom Node Server with Socket.io & Next.js
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@12.15.0 --activate

WORKDIR /app

# Install dependencies
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/ ./packages/
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/

RUN pnpm install --frozen-lockfile

# Copy application code
COPY . .

# Generate Prisma Client
RUN pnpm db:generate

# Build Next.js application
RUN pnpm --filter @cleanaglow/web build

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["pnpm", "--filter", "@cleanaglow/web", "start"]
