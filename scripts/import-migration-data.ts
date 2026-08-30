/**
 * SwiftRamadan — Import Migration Data into PostgreSQL
 * Reads JSON files exported from SQLite and inserts into PostgreSQL via Prisma
 *
 * Usage: DATABASE_URL=postgresql://... bun run scripts/import-migration-data.ts
 */

import { db } from '../src/lib/db';
import { readFileSync, existsSync } from 'fs';

const EXPORT_DIR = '/tmp/swiftramadan-migration';

async function importTable(tableName: string) {
  const filePath = `${EXPORT_DIR}/${tableName}.json`;
  if (!existsSync(filePath)) {
    console.log(`  ⏭️  ${tableName}: no data file found (skipping)`);
    return;
  }

  const data = JSON.parse(readFileSync(filePath, 'utf-8'));
  if (!data || data.length === 0) {
    console.log(`  ⏭️  ${tableName}: empty data (skipping)`);
    return;
  }

  console.log(`  📥 ${tableName}: ${data.length} rows to import...`);

  try {
    // Use createMany for batch insert
    await db[getTableAccessor(tableName)].createMany({
      data: data.map((row: Record<string, unknown>) => {
        // Convert SQLite date strings to Date objects
        const processed: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(row)) {
          if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
            processed[key] = new Date(value);
          } else {
            processed[key] = value;
          }
        }
        return processed;
      }),
      skipDuplicates: true,
    });
    console.log(`  ✅ ${tableName}: imported successfully`);
  } catch (error) {
    console.error(`  ❌ ${tableName}: import failed -`, error instanceof Error ? error.message : error);
  }
}

function getTableAccessor(tableName: string): string {
  const map: Record<string, string> = {
    User: 'user',
    Product: 'product',
    Order: 'order',
    CartItem: 'cartItem',
    Notification: 'notification',
    PantryItem: 'pantryItem',
    CookingSession: 'cookingSession',
    CommunityPost: 'communityPost',
    CommunityComment: 'communityComment',
    Video: 'video',
    VideoComment: 'videoComment',
    WishlistItem: 'wishlistItem',
    Address: 'address',
    Review: 'review',
    Coupon: 'coupon',
    Payment: 'payment',
    Follow: 'follow',
    SavedVideo: 'savedVideo',
    ChatMessage: 'chatMessage',
    UserSetting: 'userSetting',
  };
  return map[tableName] || tableName.charAt(0).toLowerCase() + tableName.slice(1);
}

async function main() {
  console.log('📦 SwiftRamadan Data Import');
  console.log('   Source: JSON export files');
  console.log('   Target: PostgreSQL via DATABASE_URL');
  console.log('');

  const tables = [
    'User', 'Product', 'Order', 'CartItem', 'Notification',
    'PantryItem', 'CookingSession', 'CommunityPost', 'CommunityComment',
    'Video', 'VideoComment', 'WishlistItem', 'Address', 'Review',
    'Coupon', 'Payment', 'Follow', 'SavedVideo', 'ChatMessage', 'UserSetting',
  ];

  // Import in dependency order (User first, then dependent tables)
  for (const table of tables) {
    await importTable(table);
  }

  console.log('');
  console.log('✅ Migration import complete!');
  await db.$disconnect();
}

main().catch(console.error);
