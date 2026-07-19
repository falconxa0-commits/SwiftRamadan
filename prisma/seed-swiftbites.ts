/* eslint-disable */
/**
 * SwiftBites Seed
 * Populates the TikTok-style video feed with 8 Ramadan food videos.
 */
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

const VIDEOS = [
  {
    title: 'Smoky Party Jollof — Lagos Style',
    caption: 'The secret is the smoke. 🔥 Bay leaves + thyme + fire. Drop a 🔥 if you want the full recipe!',
    hashtags: ['jollof', 'lagos', 'iftar', 'nigerianfood'],
    category: 'Iftar',
    creatorName: 'Chef Safa',
    creatorHandle: '@chefsafa',
    creatorAvatar: '',
    verified: true,
    posterImage: '/images/swiftbites/sb-jollof.png',
    musicTitle: 'African drums — original sound',
    durationSec: 18,
    likes: 12400,
    comments: 312,
    shares: 890,
    saves: 1240,
    views: 89000,
    orderCtaText: 'Order Jollof Rice & Chicken',
    orderProductName: 'Jollof Rice & Chicken',
  },
  {
    title: 'Suya on the grill — sparks flying',
    caption: 'Yaji spice mix revealed in the caption. Tag who you want to share this with 🍢',
    hashtags: ['suya', 'streetfood', 'grill', 'iftar'],
    category: 'Iftar',
    creatorName: 'Mama Nkechi',
    creatorHandle: '@mamankechi',
    creatorAvatar: '',
    verified: false,
    posterImage: '/images/swiftbites/sb-suya.png',
    musicTitle: 'Suya nights — Wizkid vibe',
    durationSec: 22,
    likes: 8700,
    comments: 198,
    shares: 432,
    saves: 670,
    views: 54000,
    orderCtaText: 'Order Suya Platter',
    orderProductName: 'Suya Platter',
  },
  {
    title: 'Breaking fast with Ajwa dates 🌙',
    caption: 'The Sunnah way. Premium ajwa + a glass of cold zobo. What\'s on your iftar table tonight?',
    hashtags: ['iftar', 'dates', 'ramadan', 'sunnah'],
    category: 'Iftar',
    creatorName: 'Aisha Bello',
    creatorHandle: '@aishabello',
    creatorAvatar: '',
    verified: true,
    posterImage: '/images/swiftbites/sb-dates.png',
    musicTitle: 'Peaceful nasheed — soft strings',
    durationSec: 15,
    likes: 23000,
    comments: 540,
    shares: 1200,
    saves: 3400,
    views: 156000,
    orderCtaText: 'Order Premium Dates Box',
    orderProductName: 'Premium Dates Box',
  },
  {
    title: 'Sahur prep: Moi Moi & Pap',
    caption: 'Quick steam while you sleep. Wake up to a hot sahur 💪 Who else preps the night before?',
    hashtags: ['sahur', 'moimoi', 'pap', 'mealprep'],
    category: 'Sahur',
    creatorName: 'Hadiza Cooks',
    creatorHandle: '@hadizacooks',
    creatorAvatar: '',
    verified: false,
    posterImage: '/images/swiftbites/sb-moimoi.png',
    musicTitle: 'Morning calm — lofi beats',
    durationSec: 20,
    likes: 5600,
    comments: 142,
    shares: 280,
    saves: 890,
    views: 41000,
    orderCtaText: 'Order Moi Moi & Pap',
    orderProductName: 'Moi Moi & Pap',
  },
  {
    title: 'Date & nut smoothie — energy in 60s',
    caption: 'Pre-workout sahur drink. Groundnuts + dates + milk = ⚡ Tag your gym buddy.',
    hashtags: ['smoothie', 'sahur', 'healthy', 'ramadan'],
    category: 'Sahur',
    creatorName: 'Fit Amina',
    creatorHandle: '@fitamina',
    creatorAvatar: '',
    verified: true,
    posterImage: '/images/swiftbites/sb-smoothie.png',
    musicTitle: 'Energy boost — afrobeats instrumental',
    durationSec: 16,
    likes: 9800,
    comments: 220,
    shares: 510,
    saves: 1450,
    views: 72000,
    orderCtaText: 'Order Date & Nut Smoothie',
    orderProductName: 'Date & Nut Smoothie',
  },
  {
    title: 'Family Iftar spread for 8 🍽️',
    caption: 'When the whole extended family shows up for iftar 😅 How many plates did we make? Comment your guess!',
    hashtags: ['iftar', 'family', 'spread', 'community'],
    category: 'Community',
    creatorName: 'The Bello Family',
    creatorHandle: '@bellofamily',
    creatorAvatar: '',
    verified: false,
    posterImage: '/images/swiftbites/sb-family-iftar.png',
    musicTitle: 'Family feast — joyful afrobeat',
    durationSec: 25,
    likes: 18200,
    comments: 410,
    shares: 670,
    saves: 2100,
    views: 124000,
    orderCtaText: 'Order Family Size Ramadan Box',
    orderProductName: 'Family Size Ramadan Box',
  },
  {
    title: 'Plating Jollof Arancini — fine dining',
    caption: 'When jollof rice meets Italian technique. Would you try this? 🤌',
    hashtags: ['cheflife', 'plating', 'jollof', 'finedining'],
    category: 'Recipes',
    creatorName: 'Chef Tunde',
    creatorHandle: '@cheftunde',
    creatorAvatar: '',
    verified: true,
    posterImage: '/images/swiftbites/sb-chef.png',
    musicTitle: 'Kitchen focus — ambient jazz',
    durationSec: 19,
    likes: 14500,
    comments: 380,
    shares: 540,
    saves: 1980,
    views: 98000,
    orderCtaText: 'Order Jollof Rice & Chicken',
    orderProductName: 'Jollof Rice & Chicken',
  },
  {
    title: 'Lagos market puff-puff run',
    caption: 'Aunty\'s puff puff hits different at sunset 🌅 Get yours before they sell out!',
    hashtags: ['puffpuff', 'lagos', 'market', 'iftar'],
    category: 'Vendors',
    creatorName: 'Lagos Street Eats',
    creatorHandle: '@lagosstreeteats',
    creatorAvatar: '',
    verified: false,
    posterImage: '/images/swiftbites/sb-vendor.png',
    musicTitle: 'Market buzz — lagos streets',
    durationSec: 17,
    likes: 7300,
    comments: 156,
    shares: 320,
    saves: 540,
    views: 47000,
    orderCtaText: 'Order Iftar Family Bundle',
    orderProductName: 'Iftar Family Bundle',
  },
];

const SAMPLE_COMMENTS = [
  { authorName: 'Ibrahim M.', authorHandle: '@ibro', authorInitial: 'I', content: 'This looks 🔥🔥 definitely trying this for iftar tonight!' },
  { authorName: 'Fatima A.', authorHandle: '@fatimaah', authorInitial: 'F', content: 'Please drop the full recipe 🙏' },
  { authorName: 'Yusuf O.', authorHandle: '@yusufeats', authorInitial: 'Y', content: 'Lagos jollof hits different fr' },
  { authorName: 'Zainab K.', authorHandle: '@zainabk', authorInitial: 'Z', content: 'Saving this for tomorrow\'s iftar inshaAllah' },
  { authorName: 'David A.', authorHandle: '@davidaeats', authorInitial: 'D', content: 'How much for one plate? 😋' },
];

async function main() {
  console.log('🎬 Seeding SwiftBites video feed...');

  // Look up product IDs by name so the order CTA can deep-link
  const products = await db.product.findMany({ select: { id: true, name: true } });
  const productByName = new Map(products.map((p) => [p.name, p.id]));

  // Wipe existing SwiftBites data (idempotent re-seed)
  await db.swiftBiteComment.deleteMany();
  await db.swiftBiteVideo.deleteMany();

  // Insert videos
  for (const v of VIDEOS) {
    const orderProductId = v.orderProductName ? productByName.get(v.orderProductName) || null : null;
    await db.swiftBiteVideo.create({
      data: {
        title: v.title,
        caption: v.caption,
        hashtags: JSON.stringify(v.hashtags),
        category: v.category,
        creatorName: v.creatorName,
        creatorHandle: v.creatorHandle,
        creatorAvatar: v.creatorAvatar,
        verified: v.verified,
        posterImage: v.posterImage,
        musicTitle: v.musicTitle,
        durationSec: v.durationSec,
        likes: v.likes,
        comments: v.comments,
        shares: v.shares,
        saves: v.saves,
        views: v.views,
        orderCtaText: v.orderCtaText,
        orderProductId,
      },
    });
  }
  console.log(`  ✓ ${VIDEOS.length} videos inserted`);

  // Add 3 sample comments to each video (varying authors)
  const insertedVideos = await db.swiftBiteVideo.findMany();
  let commentCount = 0;
  for (const video of insertedVideos) {
    // Pick 3 distinct comments
    for (let i = 0; i < 3; i++) {
      const c = SAMPLE_COMMENTS[(video.title.length + i) % SAMPLE_COMMENTS.length];
      await db.swiftBiteComment.create({
        data: {
          videoId: video.id,
          authorName: c.authorName,
          authorHandle: c.authorHandle,
          authorInitial: c.authorInitial,
          content: c.content,
          likes: Math.floor(Math.random() * 200),
        },
      });
      commentCount++;
    }
  }
  console.log(`  ✓ ${commentCount} sample comments inserted`);

  console.log('\n✅ SwiftBites seed complete!');
  console.log(`   Videos: ${await db.swiftBiteVideo.count()}`);
  console.log(`   Comments: ${await db.swiftBiteComment.count()}`);
}

main()
  .catch((e) => {
    console.error('❌ SwiftBites seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
