# SwiftRamadan — Production Deployment Guide

> Comprehensive guide for deploying the SwiftRamadan Nigerian food delivery super-app to production.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Server Setup](#3-server-setup)
4. [Environment Configuration](#4-environment-configuration)
5. [Database Setup (PostgreSQL)](#5-database-setup-postgresql)
6. [Docker Deployment](#6-docker-deployment)
7. [SSL/TLS Configuration](#7-ssltls-configuration)
8. [Payment Provider Setup](#8-payment-provider-setup)
9. [OAuth Provider Setup](#9-oauth-provider-setup)
10. [AI Services Configuration](#10-ai-services-configuration)
11. [Communication Setup (SMS, Email, WhatsApp)](#11-communication-setup-sms-email-whatsapp)
12. [Monitoring & Logging](#12-monitoring--logging)
13. [Backup Strategy](#13-backup-strategy)
14. [Scaling Strategy](#14-scaling-strategy)
15. [Launch Checklist](#15-launch-checklist)
16. [Nigerian Compliance](#16-nigerian-compliance)

---

## 1. Architecture Overview

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Clients    │────▶│  Nginx/Caddy     │────▶│  Next.js 16     │
│  (Web/PWA)   │     │  Reverse Proxy   │     │  Standalone     │
└──────────────┘     │  + SSL/TLS       │     │  (Node.js)      │
                     └──────────────────┘     └────────┬────────┘
                                                       │
                              ┌─────────────────────────┼──────────────────────┐
                              │                         │                      │
                     ┌────────▼────────┐     ┌─────────▼─────────┐   ┌───────▼────────┐
                     │   PostgreSQL    │     │  Upstash Redis    │   │  Mini-services │
                     │   (Primary DB)  │     │  (Cache/OTP/      │   │  (Realtime,    │
                     │                 │     │   Rate Limit)     │   │   Tracking)    │
                     └─────────────────┘     └───────────────────┘   └────────────────┘
```

### Stack Summary

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | Next.js 16 (standalone) | Full-stack React with API routes |
| Language | TypeScript | Type safety across codebase |
| ORM | Prisma 6 | Database access & migrations |
| Database | PostgreSQL (prod) / SQLite (dev) | Persistent data storage |
| Cache/Session | Upstash Redis | OTP storage, rate limiting, caching |
| Auth | NextAuth v4 (JWT) | Credentials + Google + Apple OAuth |
| Payments | Paystack, Flutterwave, Monnify, OPay, Moniepoint | Nigerian payment processing |
| AI | z-ai-web-dev-sdk | LLM, VLM, Image Gen, ASR, TTS |
| Email | Resend | Transactional & notification emails |
| SMS | Termii | Nigerian SMS with DND bypass |
| WhatsApp | WhatsApp Business API + Twilio | Order & delivery notifications |
| Monitoring | Sentry | Error tracking & crash reporting |
| Reverse Proxy | Nginx or Caddy | SSL termination, static assets |
| Runtime | Bun (dev) / Node.js (prod) | JavaScript runtime |
| Container | Docker + Docker Compose | Production deployment |

---

## 2. Prerequisites

### Local Development Tools

- **Bun** >= 1.3 (primary package manager)
- **Node.js** >= 20 (production runtime)
- **Docker** >= 24.0 + Docker Compose >= 2.20
- **Git** >= 2.40

### External Service Accounts

| Service | URL | Purpose |
|---------|-----|---------|
| Paystack | https://paystack.com | Primary payment gateway |
| Flutterwave | https://flutterwave.com | Secondary payment gateway |
| Monnify | https://monnify.com | Bank transfer payments |
| OPay | https://opay.com | Mobile money / wallet |
| Moniepoint | https://moniepoint.com | POS & agency banking |
| Google Cloud | https://console.cloud.google.com | OAuth + Cloud services |
| Apple Developer | https://developer.apple.com | Apple Sign-In |
| Upstash | https://upstash.com | Serverless Redis |
| Resend | https://resend.com | Transactional email |
| Termii | https://termii.com | Nigerian SMS |
| Twilio | https://twilio.com | WhatsApp & SMS fallback |
| Meta Business | https://business.facebook.com | WhatsApp Business API |
| Sentry | https://sentry.io | Error monitoring |
| Cloudinary | https://cloudinary.com | Media storage (optional) |

---

## 3. Server Setup

### Minimum Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 4 vCPU | 8 vCPU |
| RAM | 8 GB | 16 GB |
| Storage | 50 GB SSD | 100 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| Network | 100 Mbps | 1 Gbps |

### Initial Server Provisioning

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git unzip software-properties-common

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install -y docker-compose-plugin

# Verify Docker
docker --version
docker compose version

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Bun (for build step)
curl -fsSL https://bun.sh/install | bash

# Configure firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Create application user
sudo useradd -m -s /bin/bash swiftramadan
sudo mkdir -p /opt/swiftramadan
sudo chown swiftramadan:swiftramadan /opt/swiftramadan
```

### Swap Configuration (Minimum Spec Servers)

```bash
# Add 4GB swap for servers with 8GB RAM
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 4. Environment Configuration

Create a `.env.production` file in the project root. **Never commit this file to version control.**

```bash
# ─── Core ───────────────────────────────────────────────────────
NODE_ENV=production
NEXTAUTH_URL=https://swiftramadan.com
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-48>
PORT=3000

# ─── Database (PostgreSQL) ──────────────────────────────────────
DATABASE_URL=postgresql://swiftramadan:<strong-password>@localhost:5432/swiftramadan?schema=public

# ─── Redis (Upstash) ───────────────────────────────────────────
UPSTASH_REDIS_REST_URL=https://<your-upstash-endpoint>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<your-upstash-token>

# ─── Payment: Paystack (Primary) ───────────────────────────────
PAYSTACK_SECRET_KEY=sk_live_<your-key>
PAYSTACK_PUBLIC_KEY=pk_live_<your-key>
PAYSTACK_WEBHOOK_SECRET=<your-webhook-secret>

# ─── Payment: Flutterwave (Secondary) ──────────────────────────
FLUTTERWAVE_SECRET_KEY=FLWSECK-<your-key>
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-<your-key>
FLUTTERWAVE_WEBHOOK_HASH=<your-hash>

# ─── Payment: Monnify (Bank Transfer) ──────────────────────────
MONNIFY_API_KEY=MK_TEST_<your-key>
MONNIFY_SECRET_KEY=<your-secret>
MONNIFY_CONTRACT_CODE=<your-contract-code>
MONNIFY_WEBHOOK_HASH=<your-hash>

# ─── Payment: OPay (Mobile Money) ──────────────────────────────
OPAY_MERCHANT_ID=<your-merchant-id>
OPAY_SECRET_KEY=<your-secret-key>
OPAY_PUBLIC_KEY=<your-public-key>

# ─── Payment: Moniepoint (POS/Agency) ──────────────────────────
MONIEPOINT_API_KEY=<your-api-key>
MONIEPOINT_SECRET_KEY=<your-secret-key>

# ─── OAuth: Google ─────────────────────────────────────────────
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>

# ─── OAuth: Apple ──────────────────────────────────────────────
APPLE_CLIENT_ID=com.swiftramadan.app
APPLE_CLIENT_SECRET=<your-apple-secret>

# ─── AI: z-ai-web-dev-sdk ──────────────────────────────────────
ZAI_API_KEY=<your-zai-api-key>

# ─── Email: Resend ─────────────────────────────────────────────
RESEND_API_KEY=re_<your-key>
EMAIL_FROM=noreply@swiftramadan.com
EMAIL_FROM_NAME=SwiftRamadan

# ─── SMS: Termii (Nigeria) ─────────────────────────────────────
TERMII_API_KEY=<your-termii-key>
TERMII_SENDER_ID=SwiftRamadan

# ─── WhatsApp: Twilio ──────────────────────────────────────────
TWILIO_ACCOUNT_SID=AC<your-sid>
TWILIO_AUTH_TOKEN=<your-auth-token>
TWILIO_PHONE_NUMBER=+234<your-number>
TWILIO_WHATSAPP_NUMBER=whatsapp:+234<your-number>

# ─── WhatsApp: Business API ────────────────────────────────────
WHATSAPP_BUSINESS_TOKEN=<your-token>
WHATSAPP_BUSINESS_PHONE_NUMBER_ID=<your-phone-id>
WHATSAPP_BUSINESS_ACCOUNT_ID=<your-account-id>
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<your-verify-token>

# ─── Monitoring: Sentry ────────────────────────────────────────
SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project>

# ─── Storage: Cloudinary (optional) ────────────────────────────
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# ─── Maps ──────────────────────────────────────────────────────
GOOGLE_MAPS_API_KEY=<your-maps-key>
MAPBOX_ACCESS_TOKEN=<your-mapbox-token>
```

### Generate Secure Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 48

# Generate webhook secrets
openssl rand -hex 32
```

### Prisma Schema Switch (SQLite → PostgreSQL)

The development environment uses SQLite. For production, update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

This change is required before running `prisma generate` and `prisma migrate deploy` in production.

---

## 5. Database Setup (PostgreSQL)

### Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib

# Start and enable
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Create Database & User

```bash
sudo -u postgres psql

CREATE USER swiftramadan WITH PASSWORD '<strong-password>';
CREATE DATABASE swiftramadan OWNER swiftramadan;
GRANT ALL PRIVILEGES ON DATABASE swiftramadan TO swiftramadan;

# Enable required extensions
\c swiftramadan
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\q
```

### Run Migrations

```bash
# Switch Prisma provider to PostgreSQL first (see Section 4)
# Then run migrations:

# Generate Prisma client
npx prisma generate

# Deploy migrations (production — non-interactive)
npx prisma migrate deploy

# Preview what will change
npx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --script

# Seed the database (first time only)
npx prisma db seed
```

### PostgreSQL Tuning (Recommended)

Edit `/etc/postgresql/14/main/postgresql.conf`:

```ini
# Memory (for 16GB RAM server)
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 64MB
maintenance_work_mem = 512MB

# Connections
max_connections = 200

# WAL
wal_level = replica
max_wal_size = 2GB
min_wal_size = 512MB

# Logging
log_min_duration_statement = 500
log_checkpoints = on
log_connections = on
log_disconnections = on
```

```bash
sudo systemctl restart postgresql
```

---

## 6. Docker Deployment

### Dockerfile

Create a `Dockerfile` in the project root:

```dockerfile
# ─── Stage 1: Dependencies ─────────────────────────────────────
FROM node:20-bookworm AS deps
WORKDIR /app

COPY package.json bun.lock ./
COPY prisma ./prisma/

# Install with npm (Bun in Docker can be flaky)
RUN npm install --frozen-lockfile || npm install
RUN npx prisma generate

# ─── Stage 2: Build ────────────────────────────────────────────
FROM node:20-bookworm AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Update Prisma schema to PostgreSQL for production build
# (this assumes DATABASE_URL is set via environment at build time)
ENV DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder"

RUN npx prisma generate
RUN npm run build

# ─── Stage 3: Production ───────────────────────────────────────
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: swiftramadan-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - swiftramadan
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

  postgres:
    image: postgres:16-bookworm
    container_name: swiftramadan-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: swiftramadan
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}
      POSTGRES_DB: swiftramadan
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - swiftramadan
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U swiftramadan"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Realtime service (Socket.IO)
  realtime:
    build:
      context: ./mini-services/realtime-service
      dockerfile: Dockerfile
    container_name: swiftramadan-realtime
    restart: unless-stopped
    ports:
      - "3001:3001"
    networks:
      - swiftramadan

  # Tracking service
  tracking:
    build:
      context: ./mini-services/tracking-service
      dockerfile: Dockerfile
    container_name: swiftramadan-tracking
    restart: unless-stopped
    ports:
      - "3002:3002"
    networks:
      - swiftramadan

volumes:
  postgres_data:
    driver: local

networks:
  swiftramadan:
    driver: bridge
```

### Deploy Commands

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f app

# Run migrations inside the container
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Seed the database (first time)
docker compose -f docker-compose.prod.yml exec app npx prisma db seed

# Restart a single service
docker compose -f docker-compose.prod.yml restart app

# Stop everything
docker compose -f docker-compose.prod.yml down

# Stop and remove volumes (WARNING: deletes database)
docker compose -f docker-compose.prod.yml down -v
```

---

## 7. SSL/TLS Configuration

### Option A: Let's Encrypt with Nginx

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Install Nginx
sudo apt install -y nginx

# Obtain SSL certificate
sudo certbot --nginx -d swiftramadan.com -d www.swiftramadan.com

# Auto-renewal (Certbot sets this up automatically)
sudo certbot renew --dry-run
```

### Nginx Configuration

Create `/etc/nginx/sites-available/swiftramadan`:

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name swiftramadan.com www.swiftramadan.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name swiftramadan.com www.swiftramadan.com;

    # SSL certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/swiftramadan.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/swiftramadan.com/privkey.pem;

    # SSL hardening
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;" always;

    # HSTS (enable after confirming SSL works)
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 256;

    # Next.js standalone
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api burst=50 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Auth rate limiting (stricter)
    location /api/auth/ {
        limit_req zone=auth burst=10 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket for realtime
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400s;
    }

    # Static files with caching
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Payment webhook endpoints (no rate limit)
    location /api/payments/callback {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Max upload size
    client_max_body_size 10M;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/swiftramadan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Option B: Caddy (Simpler Auto-SSL)

The project includes a `Caddyfile`. For production:

```caddyfile
swiftramadan.com, www.swiftramadan.com {
    reverse_proxy localhost:3000 {
        header_up Host {host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
        header_up X-Real-IP {remote_host}
    }

    reverse_proxy /socket.io/* localhost:3001 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        transport http {
            read_timeout 86400s
        }
    }

    encode gzip

    @static path /_next/static/*
    header @static Cache-Control "public, max-age=31536000, immutable"
}
```

---

## 8. Payment Provider Setup

SwiftRamadan supports 6 Nigerian payment providers with intelligent routing. The system automatically recommends the optimal provider based on amount and payment method.

### Provider Routing Logic

| Amount | Method | Recommended Provider | Reason |
|--------|--------|---------------------|--------|
| < ₦10,000 | Card | OPay | Lowest fees for small amounts |
| ₦10,000–₦499,999 | Card | Paystack | Reliable, good rates |
| ≥ ₦500,000 | Card | Flutterwave | Higher limits |
| ≥ ₦50,000 | Bank Transfer | Monnify | Dedicated account numbers |
| < ₦50,000 | Bank Transfer | Moniepoint | Better for small transfers |
| Any | POS | Moniepoint | POS terminal integration |
| Any | OPay Wallet | OPay | Native wallet payments |
| Any | BNPL | BNPL | Installment payments |
| Any | Cash | Swift-Pay | Cash on delivery |

### 8.1 Paystack (Primary — Card Payments)

1. **Sign up**: https://paystack.com
2. **Complete business verification** with CAC registration documents
3. **Go to Dashboard → Settings → API Keys & Webhooks**
4. **Copy keys**:
   - `PAYSTACK_PUBLIC_KEY` (starts with `pk_live_`)
   - `PAYSTACK_SECRET_KEY` (starts with `sk_live_`)
5. **Set webhook URL**: `https://swiftramadan.com/api/payments/callback`
6. **Set webhook secret** and add to `.env.production` as `PAYSTACK_WEBHOOK_SECRET`
7. **Enable payment methods**: Cards, Bank Transfer, USSD, Apple Pay
8. **Test mode**: Use `pk_test_` and `sk_test_` keys for staging

### 8.2 Flutterwave (Secondary — Higher Limits)

1. **Sign up**: https://flutterwave.com
2. **Complete KYC** (business verification)
3. **Go to Dashboard → Settings → API**
4. **Copy keys**:
   - `FLUTTERWAVE_PUBLIC_KEY` (starts with `FLWPUBK-`)
   - `FLUTTERWAVE_SECRET_KEY` (starts with `FLWSECK-`)
5. **Set webhook**: `https://swiftramadan.com/api/payments/callback`
6. **Set webhook hash** as `FLUTTERWAVE_WEBHOOK_HASH`

### 8.3 Monnify (Bank Transfer — Dedicated Account Numbers)

1. **Sign up**: https://monnify.com
2. **Complete business onboarding**
3. **Get API credentials**: Dashboard → Settings → API Keys
   - `MONNIFY_API_KEY`
   - `MONNIFY_SECRET_KEY`
   - `MONNIFY_CONTRACT_CODE`
4. **Set webhook hash**: `MONNIFY_WEBHOOK_HASH`
5. **Reserve account numbers**: Monnify generates dedicated virtual accounts per transaction

### 8.4 OPay (Mobile Money / Wallet)

1. **Sign up**: https://opay.com
2. **Apply for merchant API access**
3. **Get credentials**:
   - `OPAY_MERCHANT_ID`
   - `OPAY_SECRET_KEY`
   - `OPAY_PUBLIC_KEY`
4. **Configure callback URL**: `https://swiftramadan.com/api/payments/callback`

### 8.5 Moniepoint (POS / Agency Banking)

1. **Sign up**: https://moniepoint.com
2. **Apply for API integration**
3. **Get credentials**:
   - `MONIEPOINT_API_KEY`
   - `MONIEPOINT_SECRET_KEY`
4. **Supported methods**: Bank transfer + POS terminal payments

### 8.6 BNPL (Buy Now Pay Later)

BNPL is implemented as an internal installment system. No external API keys are required, but configure:
- Minimum/maximum eligible amounts
- Late fee rates (see `src/lib/payments/bnpl.ts`)
- Installment periods (2-week, 4-week options)

### Health Check

All providers have health check endpoints. Verify at startup:

```bash
# Check all payment providers
curl https://swiftramadan.com/api/payments/health
```

### Webhook Verification

The app verifies webhook signatures for all providers:

```typescript
import { verifyPaystackWebhookSignature } from '@/lib/payments/paystack';
import { verifyFlutterwaveWebhookSignature } from '@/lib/payments/flutterwave';
import { verifyMonnifyWebhookHash } from '@/lib/payments/monnify';
```

**Always verify webhook signatures** — never trust unverified payloads.

---

## 9. OAuth Provider Setup

SwiftRamadan uses NextAuth v4 with JWT strategy. OAuth providers are conditionally loaded — they only appear if environment variables are configured.

### 9.1 Google OAuth

1. Go to **Google Cloud Console**: https://console.cloud.google.com
2. **Create a new project** (or select existing)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**
5. Application type: **Web application**
6. Authorized JavaScript origins: `https://swiftramadan.com`
7. Authorized redirect URIs: `https://swiftramadan.com/api/auth/callback/google`
8. Copy the **Client ID** and **Client Secret**
9. Set in `.env.production`:
   ```
   GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=<client-secret>
   ```

### 9.2 Apple Sign-In

1. Go to **Apple Developer**: https://developer.apple.com
2. Navigate to **Certificates, Identifiers & Profiles**
3. **Register an App ID** with Sign In with Apple capability
4. **Create a Services ID** for web authentication
   - Configure domain: `swiftramadan.com`
   - Redirect URL: `https://swiftramadan.com/api/auth/callback/apple`
5. **Create a Key** for Sign In with Apple
6. Download the `.p8` key file (keep it secure — can only be downloaded once)
7. Generate the client secret JWT from the key
8. Set in `.env.production`:
   ```
   APPLE_CLIENT_ID=com.swiftramadan.app
   APPLE_CLIENT_SECRET=<generated-jwt-secret>
   ```

### Session Configuration

- **Strategy**: JWT (stateless, no server-side sessions)
- **Max Age**: 30 days
- **Custom pages**: Sign-in and error pages redirect to `/`

---

## 10. AI Services Configuration

SwiftRamadan uses the `z-ai-web-dev-sdk` for AI-powered features:

| Feature | API Route | Use Case |
|---------|-----------|----------|
| **LLM** (Chat) | `/api/chat` | Safa AI assistant, customer support |
| **VLM** (Vision) | `/api/visual-search` | Snap-to-shop visual food search |
| **Image Generation** | `/api/image-gen` | AI recipe images, marketing assets |
| **ASR** (Speech-to-Text) | `/api/asr` | Voice shopping, voice commands |
| **TTS** (Text-to-Speech) | `/api/tts` | Accessible order confirmations |
| **AI Recipe** | `/api/ai-recipe` | AI-powered recipe generation |
| **Live Vision** | `/api/live-vision` | Real-time cooking assistance |
| **Taste DNA** | `/api/taste-dna` | Personalized food recommendations |
| **Recipe Remix** | `/api/recipe-remix` | Recipe variation suggestions |
| **Predictive Reorder** | `/api/predictive-reorder` | Smart reorder suggestions |

### Setup

1. Obtain an API key from the z-ai-web-dev-sdk provider
2. Set in `.env.production`:
   ```
   ZAI_API_KEY=<your-api-key>
   ```
3. The SDK is already integrated in the codebase via `package.json` dependency

### Rate Limiting for AI Endpoints

AI endpoints are resource-intensive. Configure stricter rate limits:

```nginx
# In Nginx config
limit_req_zone $binary_remote_addr zone=ai:10m rate=10r/m;

location /api/ai-recipe {
    limit_req zone=ai burst=5 nodelay;
    proxy_pass http://127.0.0.1:3000;
}
```

---

## 11. Communication Setup (SMS, Email, WhatsApp)

SwiftRamadan uses a **smart notification routing** system that automatically selects the best channel for Nigerian users:

```
Priority: WhatsApp → SMS (Termii) → Email (Resend)
```

### 11.1 Resend (Email)

1. **Sign up**: https://resend.com
2. **Verify your domain** (`swiftramadan.com`) in Dashboard → Domains
3. **Create API key**: Dashboard → API Keys → Create API Key
4. Set in `.env.production`:
   ```
   RESEND_API_KEY=re_<your-key>
   EMAIL_FROM=noreply@swiftramadan.com
   EMAIL_FROM_NAME=SwiftRamadan
   ```

**Email templates** are in `src/lib/communications/templates/`:
- `welcome.ts` — Welcome email
- `order-confirmation.ts` — Order confirmed
- `delivery-update.ts` — Rider en route / delivered
- `vendor-order.ts` — New order notification for vendors
- `password-reset.ts` — Password reset OTP
- `gift-card.ts` — Gift card delivery
- `rider-payout.ts` — Rider payout confirmation

### 11.2 Termii (SMS — Nigeria)

Termii is the **primary SMS provider** for Nigerian numbers, offering DND (Do-Not-Disturb) bypass which is critical for Nigerian delivery.

1. **Sign up**: https://termii.com
2. **Add sender ID**: Dashboard → Sender IDs → Request "SwiftRamadan"
3. **Get API key**: Dashboard → API Keys
4. Set in `.env.production`:
   ```
   TERMII_API_KEY=<your-key>
   TERMII_SENDER_ID=SwiftRamadan
   ```

**Features used**:
- OTP delivery via `sendTermiiOTP()`
- Transactional SMS via `sendTermiiSMS()`
- DND bypass for Nigerian numbers

### 11.3 Twilio (WhatsApp & SMS Fallback)

1. **Sign up**: https://twilio.com
2. **Get a phone number** with SMS and WhatsApp capability
3. **Configure WhatsApp Sandbox** (for testing) or get production access
4. Set in `.env.production`:
   ```
   TWILIO_ACCOUNT_SID=AC<your-sid>
   TWILIO_AUTH_TOKEN=<your-auth-token>
   TWILIO_PHONE_NUMBER=+234<your-number>
   TWILIO_WHATSAPP_NUMBER=whatsapp:+234<your-number>
   ```

### 11.4 WhatsApp Business API

For production WhatsApp messaging at scale:

1. **Go to**: https://business.facebook.com
2. **Create a WhatsApp Business Account**
3. **Register your business** and get verified
4. **Create a WhatsApp Business Profile**
5. **Get credentials**:
   ```
   WHATSAPP_BUSINESS_TOKEN=<your-token>
   WHATSAPP_BUSINESS_PHONE_NUMBER_ID=<your-phone-id>
   WHATSAPP_BUSINESS_ACCOUNT_ID=<your-account-id>
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=<your-verify-token>
   ```
6. **Set webhook URL**: `https://swiftramadan.com/api/communications/whatsapp`

**WhatsApp templates used**:
- Order confirmation
- Delivery updates
- Gift card notifications
- Location sharing (rider location)

### Smart Routing Details

The communication system (`src/lib/communications/index.ts`) uses `routeCommunication()` to intelligently route:

- **Nigerian numbers** (starting with +234 or 0): WhatsApp first, then Termii SMS
- **International numbers**: Twilio SMS
- **Always**: Email via Resend as final fallback

---

## 12. Monitoring & Logging

### Sentry Error Tracking

Sentry is configured in `src/lib/monitoring/sentry.ts` and tracks:
- Unhandled exceptions
- Payment failures
- Authentication errors
- API route errors

**Setup**:

1. **Create a Sentry project**: https://sentry.io → Create Project → Next.js
2. **Copy the DSN** from Project Settings → Client Keys
3. Set in `.env.production`:
   ```
   SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project>
   ```

**Usage in code**:
```typescript
import { captureException, captureMessage } from '@/lib/monitoring/sentry';

// Capture errors
await captureException(error, {
  tags: { feature: 'payments', provider: 'paystack' },
  user: { id: user.id, email: user.email, role: user.role },
});

// Capture messages
await captureMessage('Payment gateway timeout', 'warning', {
  tags: { provider: 'flutterwave' },
});
```

### Health Check Endpoint

Add a health check endpoint for monitoring:

```bash
# Check application health
curl -f https://swiftramadan.com/api/health || echo "UNHEALTHY"
```

### Log Management

```bash
# Application logs (Docker)
docker compose -f docker-compose.prod.yml logs -f app --tail=100

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Uptime Monitoring

Set up external uptime monitoring (recommended services):
- **UptimeRobot** (free tier: 50 monitors)
- **Pingdom**
- **BetterStack**

Configure alerts for:
- HTTPS response code != 200
- Response time > 5 seconds
- SSL certificate expiring within 14 days

---

## 13. Backup Strategy

### Database Backups

```bash
#!/bin/bash
# /opt/swiftramadan/backup.sh — Run via cron

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/swiftramadan/backups"
mkdir -p $BACKUP_DIR

# PostgreSQL dump
docker compose -f /opt/swiftramadan/docker-compose.prod.yml exec -T postgres \
  pg_dump -U swiftramadan swiftramadan | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_$DATE.sql.gz"
```

### Cron Job

```bash
# Edit crontab
crontab -e

# Run backup daily at 2:00 AM WAT (1:00 AM UTC)
0 1 * * * /opt/swiftramadan/backup.sh >> /opt/swiftramadan/backups/backup.log 2>&1
```

### Off-site Backup

Upload backups to cloud storage:

```bash
# Using AWS S3 (install aws-cli first)
aws s3 sync /opt/swiftramadan/backups s3://swiftramadan-backups/db/

# Or using rclone for any cloud provider
rclone sync /opt/swiftramadan/backups remote:swiftramadan-backups/db/
```

### Restore from Backup

```bash
# Decompress and restore
gunzip -c /opt/swiftramadan/backups/db_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U swiftramadan swiftramadan
```

---

## 14. Scaling Strategy

### Vertical Scaling (Single Server)

| Stage | CPU | RAM | Storage | Expected Load |
|-------|-----|-----|---------|---------------|
| Launch | 4 vCPU | 8 GB | 50 GB SSD | Up to 1,000 DAU |
| Growth | 8 vCPU | 16 GB | 100 GB SSD | Up to 10,000 DAU |
| Scale | 16 vCPU | 32 GB | 200 GB SSD | Up to 50,000 DAU |

### Horizontal Scaling (Multi-Server)

When a single server is insufficient:

```
┌──────────────┐
│ Load Balancer│ (Nginx / AWS ALB / Cloudflare)
└──────┬───────┘
       │
  ┌────┼────┐
  │    │    │
┌─▼─┐┌─▼─┐┌─▼─┐
│App││App││App│  ← Multiple Next.js instances
│ 1 ││ 2 ││ 3 │
└───┘└───┘└───┘
  │    │    │
  └────┼────┘
       │
┌──────▼──────┐
│  PostgreSQL  │  ← Managed (AWS RDS / Supabase)
│  (Primary +  │
│   Read Rep.) │
└─────────────┘
```

**Steps to horizontal scaling**:
1. Move PostgreSQL to a managed service (Supabase, AWS RDS, or Railway)
2. Use Upstash Redis (already serverless — scales automatically)
3. Deploy multiple app instances behind a load balancer
4. Use Cloudflare CDN for static assets
5. Move file uploads to S3/Cloudinary (already integrated)

### Performance Optimizations

- **Next.js standalone output** — minimal server bundle (already configured in `package.json` build script)
- **Redis caching** — menu items, product listings, prayer times
- **CDN** — Cloudflare for static assets and API caching
- **Connection pooling** — Prisma with PgBouncer for high-concurrency database access
- **Image optimization** — Next.js Image component with Cloudinary loader

### Database Connection Pooling

For high-concurrency production, add PgBouncer:

```ini
; pgbouncer.ini
[databases]
swiftramadan = host=127.0.0.1 port=5432 dbname=swiftramadan

[pgbouncer]
pool_mode = transaction
max_client_conn = 200
default_pool_size = 25
reserve_pool_size = 5
listen_addr = 127.0.0.1
listen_port = 6432
```

Then set `DATABASE_URL=postgresql://swiftramadan:password@localhost:6432/swiftramadan`

---

## 15. Launch Checklist

### Infrastructure

- [ ] PostgreSQL database provisioned and accessible
- [ ] Prisma schema switched from SQLite to PostgreSQL
- [ ] All `.env.production` variables configured and verified
- [ ] SSL/TLS certificate installed (Let's Encrypt)
- [ ] DNS A record pointed to server IP
- [ ] DNS AAAA record (if IPv6 supported)
- [ ] Docker containers running and healthy
- [ ] Health check endpoint returning 200 (`/api/health`)
- [ ] Rate limiting verified on API and auth endpoints
- [ ] WebSocket connections working (realtime service)
- [ ] Backup cron job configured and tested
- [ ] Database migrations deployed (`npx prisma migrate deploy`)

### Payment Providers

- [ ] Paystack configured and webhook verified
- [ ] Flutterwave configured and webhook verified
- [ ] Monnify configured and webhook verified
- [ ] OPay merchant access approved and configured
- [ ] Moniepoint API access approved and configured
- [ ] BNPL terms and conditions defined
- [ ] Test transactions completed on all providers
- [ ] Webhook signature verification working
- [ ] Refund flow tested

### Authentication

- [ ] NextAuth secret generated and set
- [ ] Google OAuth redirect URI configured
- [ ] Apple Sign-In configured with correct redirect
- [ ] OTP delivery working (SMS + Email)
- [ ] Password reset flow tested
- [ ] Session management working (30-day JWT)

### Communication

- [ ] Resend domain verified and API key set
- [ ] Termii sender ID approved ("SwiftRamadan")
- [ ] Twilio phone number active
- [ ] WhatsApp Business API approved
- [ ] Order confirmation notifications working
- [ ] Delivery update notifications working
- [ ] Gift card delivery notifications working

### Monitoring & Security

- [ ] Sentry DSN configured and receiving errors
- [ ] Uptime monitoring configured (UptimeRobot/Pingdom)
- [ ] Security headers verified (X-Frame-Options, CSP, HSTS)
- [ ] CORS configured correctly
- [ ] Admin endpoints protected
- [ ] File upload limits enforced
- [ ] SQL injection protection verified (Prisma parameterized queries)

### Compliance & Legal

- [ ] NDPR compliance (Nigeria Data Protection Regulation) — privacy policy
- [ ] CAC registration (Corporate Affairs Commission) verified
- [ ] NITDA compliance (National Information Technology Development Agency)
- [ ] NAFDAC food safety certifications (where applicable)
- [ ] Terms of Service page published
- [ ] Privacy Policy page published
- [ ] Cookie consent banner implemented
- [ ] Data retention policy defined
- [ ] BVN verification integration tested (if applicable)

### Application

- [ ] Landing page loads correctly
- [ ] Customer signup/login flow works end-to-end
- [ ] Vendor onboarding flow works
- [ ] Rider onboarding flow works
- [ ] Cart → Checkout → Payment flow works
- [ ] Order tracking works
- [ ] AI features working (Safa, Visual Search, Voice)
- [ ] Reels/video tab working
- [ ] Community forum working
- [ ] PWA installable and offline-capable
- [ ] Mobile responsive on all screen sizes

### Pre-Launch

- [ ] Load testing completed (k6 / Artillery)
- [ ] Security audit completed
- [ ] Mobile app store submissions ready (if applicable)
- [ ] Customer support channels ready (WhatsApp, email, phone)
- [ ] Social media accounts created and branded
- [ ] Marketing launch plan ready
- [ ] Incident response playbook documented
- [ ] On-call rotation established
- [ ] Status page configured

---

## 16. Nigerian Compliance

### NDPR — Nigeria Data Protection Regulation

SwiftRamadan handles personal data (names, emails, phone numbers, addresses, payment info) and must comply with NDPR:

1. **Data Processing Notice**: Display a clear privacy notice at signup
2. **Consent**: Obtain explicit consent before processing personal data
3. **Data Minimization**: Only collect data necessary for the service
4. **Data Subject Rights**: Implement mechanisms for users to:
   - Access their data
   - Request correction
   - Request deletion
   - Object to processing
   - Data portability
5. **Data Protection Officer (DPO)**: Appoint a DPO if processing > 1,000 records
6. **Data Breach Notification**: Notify NITDA within 72 hours of a breach
7. **Annual Audit**: File annual data protection audit with NITDA

**Implementation**:
- Privacy Policy page at `/privacy`
- Terms of Service page at `/terms`
- Legal pages modal in the app (`LegalPagesModal` component)
- Cookie consent banner
- Data export API for user data portability

### CAC — Corporate Affairs Commission

- Register business name or limited liability company with CAC
- Required for Paystack/Flutterwave business verification
- Upload CAC certificate to payment provider dashboards

### NITDA — National Information Technology Development Agency

- Comply with NITDA guidelines for electronic transactions
- Register as a data controller if processing significant personal data
- Submit annual compliance reports

### NAFDAC — National Agency for Food and Drug Administration and Control

- Required for food vendors selling pre-packaged food items
- Vendors must display NAFDAC registration numbers
- SwiftRamadan should verify vendor NAFDAC compliance during onboarding
- Not required for fresh food / restaurant-prepared meals

### Financial Compliance

- **CBN (Central Bank of Nigeria)**: Comply with payment service provider regulations
- **AML/KYC**: Implement Know Your Customer for vendors and riders
  - BVN verification (Bank Verification Number) — see `src/lib/verification/bvn.ts`
  - Valid government-issued ID
- **Transaction limits**: Respect CBN transaction limits for mobile money
- **Receipts**: Provide digital receipts for all transactions

---

## Quick Reference

### Essential Commands

```bash
# Build for production
npm run build

# Run production server (standalone)
npm run start

# Database migrations
npx prisma migrate deploy    # Production — apply pending migrations
npx prisma migrate diff      # Preview changes between schema and DB
npx prisma generate          # Regenerate Prisma client
npx prisma db seed           # Seed database with initial data

# Docker
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# SSL
sudo certbot renew           # Renew Let's Encrypt certificates
sudo nginx -t && sudo systemctl reload nginx  # Test & reload Nginx

# Backups
/opt/swiftramadan/backup.sh  # Manual backup
```

### Key File Locations

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema (switch provider to `postgresql` for prod) |
| `src/lib/auth-config.ts` | NextAuth configuration |
| `src/lib/payments/index.ts` | Unified payment provider routing |
| `src/lib/communications/index.ts` | Smart notification routing |
| `src/lib/redis.ts` | Upstash Redis (OTP, rate limiting, caching) |
| `src/lib/monitoring/sentry.ts` | Sentry error tracking |
| `src/lib/oauth.ts` | Google & Apple OAuth configuration |
| `src/middleware.ts` | Next.js middleware (rate limiting, auth) |
| `Caddyfile` | Caddy reverse proxy configuration |
| `next.config.ts` | Next.js configuration |
| `package.json` | Build scripts and dependencies |

### Environment Variables Summary

| Variable | Required | Service |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL |
| `NEXTAUTH_SECRET` | Yes | Authentication |
| `NEXTAUTH_URL` | Yes | Authentication |
| `UPSTASH_REDIS_REST_URL` | Yes | Cache/Sessions |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Cache/Sessions |
| `PAYSTACK_SECRET_KEY` | Yes | Payments |
| `PAYSTACK_PUBLIC_KEY` | Yes | Payments |
| `PAYSTACK_WEBHOOK_SECRET` | Yes | Payments |
| `FLUTTERWAVE_SECRET_KEY` | Recommended | Payments |
| `FLUTTERWAVE_PUBLIC_KEY` | Recommended | Payments |
| `FLUTTERWAVE_WEBHOOK_HASH` | Recommended | Payments |
| `MONNIFY_API_KEY` | Recommended | Payments |
| `MONNIFY_SECRET_KEY` | Recommended | Payments |
| `MONNIFY_CONTRACT_CODE` | Recommended | Payments |
| `OPAY_MERCHANT_ID` | Optional | Payments |
| `OPAY_SECRET_KEY` | Optional | Payments |
| `MONIEPOINT_API_KEY` | Optional | Payments |
| `MONIEPOINT_SECRET_KEY` | Optional | Payments |
| `GOOGLE_CLIENT_ID` | Recommended | OAuth |
| `GOOGLE_CLIENT_SECRET` | Recommended | OAuth |
| `APPLE_CLIENT_ID` | Optional | OAuth |
| `APPLE_CLIENT_SECRET` | Optional | OAuth |
| `ZAI_API_KEY` | Yes | AI Services |
| `RESEND_API_KEY` | Yes | Email |
| `TERMII_API_KEY` | Yes | SMS (Nigeria) |
| `TERMII_SENDER_ID` | Yes | SMS (Nigeria) |
| `TWILIO_ACCOUNT_SID` | Recommended | WhatsApp/SMS |
| `TWILIO_AUTH_TOKEN` | Recommended | WhatsApp/SMS |
| `TWILIO_PHONE_NUMBER` | Recommended | WhatsApp/SMS |
| `WHATSAPP_BUSINESS_TOKEN` | Optional | WhatsApp |
| `WHATSAPP_BUSINESS_PHONE_NUMBER_ID` | Optional | WhatsApp |
| `SENTRY_DSN` | Recommended | Monitoring |
| `CLOUDINARY_CLOUD_NAME` | Optional | Storage |
| `GOOGLE_MAPS_API_KEY` | Optional | Maps |

---

*Last updated: 2025-03-04 | SwiftRamadan v0.2.0*
