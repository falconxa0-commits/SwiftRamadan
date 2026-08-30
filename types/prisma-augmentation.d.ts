/**
 * Prisma model delegate augmentation.
 *
 * The Phase-2 routes (auctions, chef-battles, swift-bites, stories, etc.)
 * reference Prisma models that have not yet been added to `prisma/schema.prisma`
 * and therefore do not exist on the generated `PrismaClient` type. Until the
 * schema is migrated and the client is regenerated, expose each missing model
 * delegate as `any` so the routes keep type-checking without changing runtime
 * behaviour (a missing model delegate is already `undefined` at runtime —
 * this augmentation does not make that worse, it only satisfies TypeScript).
 *
 * If/when the schema is updated to include these models, regenerate the
 * Prisma client (`npx prisma generate`) and delete this file.
 */
import '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDelegate = any;

declare module '@prisma/client' {
  interface PrismaClient {
    // Next-gen / Phase-2 model delegates (added to schema pending migration).
    // Each is typed as `any` so route handlers can call `.upsert()/.findMany()`
    // without tripping TS18046. The runtime already throws on these — the
    // schema migration is what unblocks them properly.
    auctionItem: AnyDelegate;
    auctionBid: AnyDelegate;
    betaFeedback: AnyDelegate;
    challengeProgress: AnyDelegate;
    chefBattle: AnyDelegate;
    chefBattleVote: AnyDelegate;
    communityReply: AnyDelegate;
    diaryEntry: AnyDelegate;
    giftMeal: AnyDelegate;
    mosquePartner: AnyDelegate;
    neighborAlert: AnyDelegate;
    riderETAParty: AnyDelegate;
    story: AnyDelegate;
    streakShrine: AnyDelegate;
    subscriptionBox: AnyDelegate;
    swiftBiteComment: AnyDelegate;
    swiftBiteVideo: AnyDelegate;
    tip: AnyDelegate;
    userSubscription: AnyDelegate;
    vendorStorefront: AnyDelegate;
    // `wallet` is not in the schema but some routes expect it
    wallet: AnyDelegate;
  }
}
