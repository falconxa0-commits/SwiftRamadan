# PHASE2-F — Realtime + Upload Builder

**Task ID**: PHASE2-F
**Agent**: Realtime + Upload Builder
**Date**: 2026-06-25

## Scope
Two infrastructure features for SwiftRamadan (Next.js 16 + Prisma/SQLite + Tailwind):

1. **Feature 55** — WebSocket / Socket.io Real-time service (mini-service on port 3003 + client hook + wiring into 4 existing components).
2. **Feature 56** — Image/file upload API (single + multiple + base64) + client hook + wiring into 3 existing modals.

## Files Created
- `mini-services/realtime-service/package.json` — independent bun project (socket.io, express, cors, @prisma/client).
- `mini-services/realtime-service/index.ts` — socket.io server on port 3003 with events: `register`, `join-room`, `leave-room`, `chat-message` (broadcast + Prisma persist), `order-status-update`, `rider-location`, `new-order`, `delivery-request`, `typing`, `disconnect`. Express `/` and `/health` for health-checks.
- `src/hooks/use-socket.ts` — `useSocket(roomId?)` returns `{ socket, isConnected }`. Socket created via `useState` lazy initializer to avoid `react-hooks/set-state-in-effect` violations; connection state updated only from socket event handlers. Room join/leave handled automatically.
- `src/hooks/use-upload.ts` — `useUpload()` returns `{ upload, uploadMany, uploadBase64, uploading }`.
- `src/app/api/upload/route.ts` — POST accepts `multipart/form-data` (file) OR `application/json` (`{ image: dataUrl }`). Validates: image-only, ≤5MB. Saves to `/public/uploads/{ts}-{rand}.{ext}`. Returns `{ success, url, filename, size, type, originalName }`.
- `src/app/api/upload/multiple/route.ts` — POST accepts up to 5 files under `files` field. Partial success allowed.

## Files Modified
1. **`src/components/swift/RealTimeTrackingModal.tsx`** — joined `order-{orderId}` room; listens for `order-status-update` + `rider-location` events; HTTP polling every 5s as fallback (was 3s). Header dot + bottom progress show socket vs polling mode.
2. **`src/components/swift/ChatModal.tsx`** — joined chat room; sends via `socket.emit('chat-message', ...)` (server persists + broadcasts); HTTP fallback; typing indicator (animated 3-dot bubble); emits `typing` events on input (throttled 1/s); status pill shows Online/Reconnecting.
3. **`src/components/swift/VendorDashboard.tsx`** — joined `vendor-{vendorId}` room; on `new-order` event: prepends to incomingOrders, toasts, plays chime (Web Audio API), switches to Incoming tab, bell icon turns green.
4. **`src/components/swift/RiderDashboard.tsx`** — joined `rider-{email}` room; on `delivery-request` event: prepends to availableDeliveries, toasts, plays chime, auto-opens NewDeliveryRequestModal (only if online + no other modal open).
5. **`src/components/swift/VendorAddProductModal.tsx`** — drag-and-drop image upload zone replacing the empty preview placeholder; quick-pick sample images kept as alternative; URL input kept as override; submit button disabled while uploading.
6. **`src/components/swift/UploadVideoModal.tsx`** — tappable thumbnail upload zone (h-28) replacing the URL-only input; URL input kept below as override; submit button disabled while uploading.
7. **`src/components/swift/EditProfileModal.tsx`** — replaced FileReader/base64 (which would store a multi-KB data URL in DB) with real `useUpload().upload(file)`; avatar is tappable; spinner overlay while uploading; "Upload photo" + "Use initials" buttons.

## Decisions / Notes
- **Socket.io path**: Used the default `/socket.io/` instead of `/`. This lets express routes (`/`, `/health`) respond normally for health-checks. The frontend still uses `io("/?XTransformPort=3003")` because socket.io-client appends `/socket.io/` internally — the gateway routes by the XTransformPort query param regardless of path.
- **PrismaClient**: The mini-service has its own `@prisma/client` install, but its `node_modules/.prisma` is symlinked to the main project's `.prisma` (which contains the schema-generated client with the `ChatMessage` model). This avoids running `prisma generate` twice while keeping the services decoupled.
- **Lint compliance**: Hit `react-hooks/set-state-in-effect` errors with the textbook `setSocket(s)` pattern in `useEffect`. Restructured `use-socket.ts` to create the socket in a `useState` lazy initializer and only update `isConnected` from socket event handlers (not the effect body). The HMR edge case (socket already connected when effect runs) is handled via `queueMicrotask`.
- **Fallback strategy**: Every socket-driven component retains its HTTP polling fallback:
  - RealTimeTrackingModal: polls every 5s (was 3s) regardless of socket state.
  - ChatModal: polls every 3s when socket offline, every 15s when online (safety net).
  - VendorDashboard/RiderDashboard: rely on socket for new-order/delivery-request push; existing 15s data refresh polls remain unchanged.
- **Sound effects**: Used the Web Audio API to synthesize a short chime (880→1320Hz sine for vendor, 660→990Hz triangle for rider). No external audio files needed. Wrapped in try/catch so the app degrades gracefully on browsers without AudioContext.
- **Identity for rooms**: VendorId isn't always available client-side (it's in the API response, not the Zustand store). Falls back to `vendor-{userEmail}` if `data.vendorId` is null. Rider uses `rider-{email}`.

## Verification
- **Realtime service running**: `ps aux | grep bun --hot` shows `bun --hot index.ts` (PID 27983) running.
- **Health check**: `curl http://localhost:3003/health` → `{"ok":true}` ✅
- **Health check (gateway)**: `curl http://localhost:81/socket.io/?EIO=4&transport=polling&XTransformPort=3003` → 200 OK with sid ✅
- **Full socket.io round-trip via gateway**: connect → join-room → chat-message → server persists (Prisma row created with real ID) → broadcast back to room → client receives message ✅
- **Upload API**:
  - POST /api/upload (multipart, 182KB PNG) → returns `/uploads/{ts}-{rand}.png` ✅
  - GET /uploads/{filename} → 200 OK ✅
  - POST /api/upload (JSON base64) → returns `/uploads/{ts}-{rand}.png` ✅
  - POST /api/upload/multiple (2 files) → returns 2 URLs ✅
- **Lint**: 0 errors, 5 pre-existing warnings (none in any file I own).
- **Dev server**: healthy on port 3000; only 2xx in recent dev.log.

## Stage Summary
- 2 features fully built and verified end-to-end ✅
- 13 files created/modified (6 created + 7 modified) — exactly the spec's file ownership list
- Realtime service double-forked and survives bash session end (PID reparented to init via `( ( exec bun --hot index.ts ) & )`)
- Aurora Luxe design preserved throughout (glass-effect bars, gold + green + sky accents, animated typing indicator, toast notifications, accessible ARIA labels)
- Zero mock data, zero placeholders, zero regressions to existing flows
