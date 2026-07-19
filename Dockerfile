# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SwiftRamadan — Production Docker Build
# Multi-stage build: deps → build → production runner
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json bun.lockb* package-lock.json* ./
RUN npm install -g bun
RUN bun install --frozen-lockfile

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g bun

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ── Switch Prisma provider from SQLite to PostgreSQL for production ──
# In development, we use SQLite for simplicity. In production Docker builds,
# we switch to PostgreSQL before generating the Prisma client.
RUN sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

# Generate Prisma client with PostgreSQL provider
RUN bun run db:generate

# Build Next.js with standalone output
RUN bun run build

# Stage 3: Production runner (minimal image)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Switch to non-root user
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
