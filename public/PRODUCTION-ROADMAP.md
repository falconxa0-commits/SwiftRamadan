# 🚀 SwiftRamadan — Production Roadmap

> **Current State**: Feature-complete codebase, security-hardened (58 fixes), running on SQLite + localhost  
> **Target**: Production-grade Nigerian food delivery super-app serving real customers

---

## 📍 Phase 0: Quick Wins (Week 1) — *₦0 cost*

These cost nothing and unlock the next phase:

### 0.1 Migrate Database: SQLite → PostgreSQL
- [ ] Provision free PostgreSQL (Supabase free tier or Neon free tier)
- [ ] Update `prisma/schema.prisma`: change `provider = "sqlite"` → `provider = "postgresql"`
- [ ] Update `DATABASE_URL` in `.env` to PostgreSQL connection string
- [ ] Run `bun run db:push` to create tables in PostgreSQL
- [ ] Test all API routes against PostgreSQL

### 0.2 Get Free API Keys
- [ ] **Paystack Test Mode** — free, instant signup at paystack.com
- [ ] **Google OAuth** — free, Google Cloud Console
- [ ] **Google Maps** — free tier (28K calls/month)
- [ ] **Cloudinary** — free tier (25GB storage, 25K transforms/month)
- [ ] **Resend** — free tier (100 emails/day)
- [ ] **Upstash Redis** — free tier (10K commands/day)
- [ ] **Sentry** — free tier (5K errors/month)
- [ ] **Termii** — free test credits for SMS
- [ ] **NEXTAUTH_SECRET** — generate with `openssl rand -base64 32`

### 0.3 Environment Setup
- [ ] Create `.env.production` with all real keys
- [ ] Set `NEXTAUTH_URL=https://yourdomain.com`
- [ ] Set `NODE_ENV=production`
- [ ] Disable Prisma query logging (already done ✅)

---

## 📍 Phase 1: Core Infrastructure (Weeks 2–3) — *₦15K–₦50K/mo*

### 1.1 Cloud Hosting
**Recommended: Vercel (easiest for Next.js)**

| Option | Cost | Pros | Cons |
|--------|------|------|------|
| **Vercel Pro** | $20/mo | Zero-config Next.js, edge functions, preview deploys | Can get expensive at scale |
| **Railway** | $5–$20/mo | Simple, includes Postgres, good for MVP | Less Next.js-optimized |
| **DigitalOcean App Platform** | $5–$25/mo | More control, cheaper at scale | More setup |

**Action**: Start with Vercel Pro ($20/mo) → migrate to DO/DO+Cloudflare when you hit 10K users

### 1.2 Domain & SSL
- [ ] Buy domain (swiftramadan.com or swiftramadan.ng) — ₦3K–₦8K/year
- [ ] SSL is automatic on Vercel
- [ ] Set up DNS (Cloudflare free tier for CDN + DDoS protection)

### 1.3 Database (PostgreSQL)
| Option | Cost | Storage |
|--------|------|---------|
| **Supabase Pro** | $25/mo | 8GB |
| **Neon Pro** | $19/mo | 10GB |
| **Railway Postgres** | $5/mo | ~1GB |

**Action**: Start with Supabase free tier → upgrade to Pro at launch

### 1.4 Redis (Rate Limiting + Caching)
- [ ] Upstash Redis free tier (already configured in code ✅)
- [ ] Upgrade to Pro ($10/mo) when hitting 10K commands/day

---

## 📍 Phase 2: Payments Go Live (Week 3–4) — *₦0 upfront*

### 2.1 Paystack (Primary — Card Payments)
- [ ] Register business at paystack.com
- [ ] Complete KYC (CAC registration + bank account)
- [ ] Get **live secret key**
- [ ] Set `PAYSTACK_SECRET_KEY` in production env
- [ ] Test with Paystack test keys first
- [ ] Enable webhooks: `https://yourdomain.com/api/payments/callback`
- [ ] **Fee**: 1.5% + ₦100 per transaction

### 2.2 Flutterwave (Backup Card + Bank Transfer)
- [ ] Register at flutterwave.com
- [ ] Complete KYC
- [ ] Set `FLUTTERWAVE_SECRET_KEY` + `FLUTTERWAVE_WEBHOOK_HASH`
- [ ] **Fee**: 1.4% per transaction

### 2.3 Monnify (Bank Transfer — popular in Nigeria)
- [ ] Register at monnify.com
- [ ] Set `MONNIFY_API_KEY` + `MONNIFY_SECRET_KEY` + `MONNIFY_CONTRACT_CODE`
- [ ] **Fee**: 1% per transaction

### 2.4 OPay + Moniepoint (Wallet/POS)
- [ ] Apply for merchant accounts
- [ ] Longer approval process (2–4 weeks)
- [ ] Can defer to post-launch

### 2.5 BNPL Partners
- [ ] **Carbon** — Apply at getcarbon.co
- [ ] **Creddit** — Apply at creddit.ng
- [ ] Defer if not ready at launch

### 💰 Payment Revenue Model
| Method | Fee (you pay) | Fee (you charge customer) | Your margin |
|--------|---------------|---------------------------|-------------|
| Card | 1.5% + ₦100 | 2% + ₦150 | 0.5% + ₦50 |
| Transfer | 1% | ₦100 flat | ₦100 – 1% |
| COD | ₦0 | ₦200 fee | ₦200 |
| BNPL | 3–5% | 5–8% | 2–3% |

---

## 📍 Phase 3: Auth & Comms (Week 4–5) — *₦10K–₦30K/mo*

### 3.1 SMS OTP (Termii — Nigerian-focused)
- [ ] Register at termii.com
- [ ] Set `TERMII_API_KEY` + `TERMII_SENDER_ID`
- [ ] Test OTP delivery to Nigerian numbers
- [ ] **Cost**: ₦1.5–₦3.5 per SMS
- [ ] **Budget**: ₦15K–₦30K/mo for 10K users

### 3.2 Email (Resend)
- [ ] Verify domain in Resend dashboard
- [ ] Set `RESEND_API_KEY`
- [ ] Configure SPF/DKIM/DMARC DNS records
- [ ] **Cost**: Free tier (100/day) → $20/mo for 10K emails

### 3.3 WhatsApp Business API
- [ ] Register at business.whatsapp.com
- [ ] Set `WHATSAPP_BUSINESS_TOKEN` + `WHATSAPP_BUSINESS_PHONE_NUMBER_ID`
- [ ] **Cost**: ₦3–₦5 per conversation
- [ ] Best for order updates & delivery notifications

### 3.4 Google OAuth
- [ ] Create OAuth 2.0 client in Google Cloud Console
- [ ] Add authorized redirect: `https://yourdomain.com/api/auth/callback/google`
- [ ] Set `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`

### 3.5 Apple OAuth (defer if not urgent)
- [ ] Requires Apple Developer account ($99/year)
- [ ] Only needed if targeting iOS app

---

## 📍 Phase 4: Storage & Media (Week 5) — *₦0–₦10K/mo*

### 4.1 Cloudinary (Images — already integrated ✅)
- [ ] Set `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET`
- [ ] Configure upload preset for direct uploads
- [ ] **Cost**: Free tier (25GB) → $89/mo for Pro

### 4.2 Video Storage
- [ ] **Option A**: Cloudflare Stream ($5/1000 mins) — set `CF_STREAM_*`
- [ ] **Option B**: Mux ($0.10/min) — more expensive but better quality
- [ ] **Defer** if video features aren't critical at launch

---

## 📍 Phase 5: Monitoring & Observability (Week 5–6) — *₦0–₦10K/mo*

### 5.1 Error Tracking (Sentry — already integrated ✅)
- [ ] Create Sentry project
- [ ] Set `SENTRY_DSN`
- [ ] **Cost**: Free tier (5K errors/month)

### 5.2 Analytics
- [ ] **Google Analytics** — set `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- [ ] **Mixpanel** — set `NEXT_PUBLIC_MIXPANEL_TOKEN` (free tier: 20K events/month)
- [ ] **PostHog** — free tier: 1M events/month (better for product analytics)

### 5.3 Uptime Monitoring
- [ ] **BetterStack** (free) or **UptimeRobot** (free: 50 monitors)
- [ ] Monitor: `/api` health check + critical payment endpoints

### 5.4 Logging
- [ ] **Axiom** (free tier: 500MB/month) — structured log search
- [ ] Already have `console.error` → Sentry captures ✅

---

## 📍 Phase 6: Identity Verification (Week 6) — *₦50–₦200/verification*

### 6.1 BVN Verification
- [ ] **YouVerify** — set `YOUVERIFY_API_KEY`
- [ ] **Prembly** — set `PREMBLY_API_KEY`
- [ ] **Smile Identity** — set `SMILE_IDENTITY_API_KEY`
- [ ] **Cost**: ₦50–₦200 per verification

### 6.2 Bank Account Verification
- [ ] Paystack bank verification (already integrated ✅)
- [ ] Set `PAYSTACK_SECRET_KEY` to enable

---

## 📍 Phase 7: Docker & Deployment (Week 6–7) — *₦0*

### 7.1 Dockerfile
```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY . .
RUN bun run db:generate
EXPOSE 3000
CMD ["bun", "start"]
```

### 7.2 docker-compose.yml (for VPS deployment)
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env.production
    depends_on:
      - postgres
      - redis
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: swiftramadan
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
  redis:
    image: upstash/redis:latest
volumes:
  pgdata:
```

### 7.3 CI/CD Pipeline
- [ ] Update `.github/workflows/ci.yml` — already has lint + type-check ✅
- [ ] Add deployment step:
  - Vercel: auto-deploys from GitHub
  - VPS: Add SSH deploy step to CI
- [ ] Add staging environment (preview deploys on PR)

---

## 📍 Phase 8: Testing & QA (Week 7–8) — *₦0*

### 8.1 Automated Tests
- [ ] Install: `bun add -d vitest @testing-library/react @testing-library/jest-dom`
- [ ] Write tests for:
  - [ ] Payment flow (critical path)
  - [ ] Auth flow (signup, login, OTP)
  - [ ] Cart → Order → Payment pipeline
  - [ ] API route authorization (verify 401s)
  - [ ] Input validation (Zod schemas)

### 8.2 Load Testing
- [ ] Install: `bun add -d kempo` or use `artillery`
- [ ] Test: 100 concurrent users hitting /api/products
- [ ] Test: 50 concurrent payment initiations
- [ ] Identify bottlenecks

### 8.3 Security (Final Check)
- [ ] Run `bun run lint` — 0 errors ✅
- [ ] Re-run penetration test against staging
- [ ] Enable Vercel DDoS protection
- [ ] Set up rate limiting alerts in Upstash
- [ ] Review all webhook endpoints with real signatures

---

## 📍 Phase 9: Legal & Compliance (Week 8–9) — *₦50K–₦200K one-time*

### 9.1 Business Registration
- [ ] CAC registration (₦10K–₦30K)
- [ ] Tax Identification Number (TIN)
- [ ] Bank account in business name

### 9.2 Data Protection (NDPR — Nigeria Data Protection Regulation)
- [ ] Privacy Policy page
- [ ] Terms of Service page
- [ ] Cookie consent banner
- [ ] Data processing agreement with payment providers
- [ ] NDPR audit (₦50K–₦150K if using a consultant)

### 9.3 Food Safety
- [ ] NAFDAC registration (if selling packaged food)
- [ ] Health & safety compliance for vendor kitchens
- [ ] Food handler certifications for vendors

---

## 📍 Phase 10: Launch Prep (Week 9–10)

### 10.1 Business Operations
- [ ] Onboard 10–20 pilot vendors in Lagos
- [ ] Recruit 5–10 riders (motorcycle dispatch)
- [ ] Set up customer support (WhatsApp + email)
- [ ] Create vendor onboarding guide
- [ ] Create rider onboarding guide

### 10.2 Marketing
- [ ] Social media accounts (Instagram, Twitter/X, TikTok)
- [ ] Launch landing page with email waitlist
- [ ] Partner with Lagos Muslim communities & mosques
- [ ] Ramadan 2027 countdown campaign
- [ ] Influencer partnerships (₦50K–₦200K budget)
- [ ] Google Ads targeting "ramadan food delivery lagos"

### 10.3 Soft Launch Checklist
- [ ] All env vars set in production
- [ ] Database migrated and seeded with real vendor data
- [ ] Payment flow tested end-to-end with real ₦50 transaction
- [ ] SMS OTP delivering to real Nigerian numbers
- [ ] Email notifications sending
- [ ] Sentry capturing errors
- [ ] Google Analytics tracking
- [ ] SSL certificate active
- [ ] Rate limiting working
- [ ] All 67 API routes returning correct responses
- [ ] Mobile-responsive UI tested on real devices
- [ ] PWA installable from browser

---

## 📍 Phase 11: Post-Launch (Ongoing)

### Month 1–3: Stabilize
- [ ] Monitor error rates in Sentry
- [ ] Fix bugs from real user feedback
- [ ] Optimize slow queries (check Prisma query logs)
- [ ] A/B test onboarding flow
- [ ] Track conversion: Browse → Cart → Order → Payment

### Month 3–6: Grow
- [ ] Expand to Abuja + Port Harcourt
- [ ] Add more payment methods (USSD, QR)
- [ ] Launch referral program
- [ ] Vendor self-onboarding portal
- [ ] Rider app improvements

### Month 6–12: Scale
- [ ] Native mobile app (React Native or Expo)
- [ ] Real-time order tracking (WebSocket — already built ✅)
- [ ] Vendor analytics dashboard
- [ ] AI-powered menu recommendations
- [ ] Multi-language support (Hausa, Yoruba, Igbo)

---

## 💰 Budget Summary

| Phase | Timeline | One-time Cost | Monthly Cost |
|-------|----------|---------------|--------------|
| **Phase 0**: Quick Wins | Week 1 | ₦0 | ₦0 |
| **Phase 1**: Infrastructure | Weeks 2–3 | ₦8K (domain) | ₦15K–₦50K |
| **Phase 2**: Payments | Weeks 3–4 | ₦0 | 1–2% per tx |
| **Phase 3**: Auth & Comms | Weeks 4–5 | ₦0 | ₦10K–₦30K |
| **Phase 4**: Storage | Week 5 | ₦0 | ₦0–₦10K |
| **Phase 5**: Monitoring | Weeks 5–6 | ₦0 | ₦0–₦10K |
| **Phase 6**: Identity | Week 6 | ₦0 | ₦50–₦200/verify |
| **Phase 7**: Docker | Weeks 6–7 | ₦0 | ₦0 |
| **Phase 8**: Testing | Weeks 7–8 | ₦0 | ₦0 |
| **Phase 9**: Legal | Weeks 8–9 | ₦50K–₦200K | ₦0 |
| **Phase 10**: Launch | Weeks 9–10 | ₦50K–₦200K (marketing) | ₦0 |
| | | **₦108K–₦408K** | **₦25K–₦100K/mo** |

### Total to Launch: **₦108K–₦408K one-time + ₦25K–₦100K/month**

That's roughly **$130–$500 one-time + $30–$120/month** 🇳🇬

---

## 🎯 Critical Path (Minimum Viable Launch)

If you're broke and need to launch ASAP, here's the **bare minimum**:

1. **Vercel free tier** (hobby) — ₦0/mo
2. **Supabase free tier** (PostgreSQL) — ₦0/mo
3. **Paystack test → live** — ₦0 upfront
4. **Termii SMS** — ₦5K credit
5. **Resend free tier** (email) — ₦0/mo
6. **Upstash Redis free tier** — ₦0/mo
7. **Cloudinary free tier** — ₦0/mo
8. **Sentry free tier** — ₦0/mo
9. **Domain** — ₦3K/year

### **MVP Launch Cost: ₦8K one-time + ₦5K/month** 🚀

You can literally go live for under **₦15K** total.

---

*Built with ❤️ for Ramadan 2027 — Lagos, Nigeria*
