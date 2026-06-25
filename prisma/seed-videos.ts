import { db } from '../src/lib/db';

const SAMPLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
];

const REELS = [
  {
    title: 'Jollof Rice — The Lagos Way 🔥',
    description: 'Smoky party jollof with the perfect crust. Save this for Iftar! #jollof #iftar #ramadan',
    videoUrl: SAMPLE_VIDEOS[2],
    thumbnailUrl: '/images/meals/meal-jollof.png',
    authorName: 'Chef Safa',
    authorHandle: '@chefsafa',
    authorAvatar: '',
    category: 'cooking',
    likes: 12840,
    comments: 342,
    shares: 890,
    views: 184000,
  },
  {
    title: 'Suya Spots in Yaba You MUST Try 🌶️',
    description: 'Late night suya run after Tarawih. Which spot is your favorite? #suya #lagos #ramadannights',
    videoUrl: SAMPLE_VIDEOS[4],
    thumbnailUrl: '/images/meals/meal-suya.png',
    authorName: 'Amaka Eats',
    authorHandle: '@amakaeats',
    authorAvatar: '',
    category: 'reviews',
    likes: 8920,
    comments: 215,
    shares: 432,
    views: 96500,
  },
  {
    title: 'Sahur Smoothie in 60 Seconds 🥤',
    description: 'High-protein date & banana smoothie to keep you full till Iftar. Full recipe below!',
    videoUrl: SAMPLE_VIDEOS[5],
    thumbnailUrl: '/images/meals/meal-smoothie.png',
    authorName: 'Halima Kitchen',
    authorHandle: '@halimakitchen',
    authorAvatar: '',
    category: 'sahur',
    likes: 15630,
    comments: 489,
    shares: 1200,
    views: 220000,
  },
  {
    title: 'Moi Moi Prep — Steaming Perfectly ✨',
    description: 'The secret is in the blending. Soft, fluffy moi moi every single time. #moimoi #naijafood',
    videoUrl: SAMPLE_VIDEOS[0],
    thumbnailUrl: '/images/meals/meal-moimoi.png',
    authorName: 'Mama Nkechi',
    authorHandle: '@mamankechi',
    authorAvatar: '',
    category: 'cooking',
    likes: 9450,
    comments: 178,
    shares: 623,
    views: 110200,
  },
  {
    title: 'Iftar Box Unboxing — Dates & Zobo Bundle 🎁',
    description: 'Our premium Ramadan Iftar bundle is BACK. Fresh dates, zobo, kuna & more. Tap shop!',
    videoUrl: SAMPLE_VIDEOS[3],
    thumbnailUrl: '/images/flash-sales/flash-iftar-bundle.png',
    authorName: 'SwiftRamadan',
    authorHandle: '@swiftramadan',
    authorAvatar: '',
    category: 'iftar',
    likes: 21800,
    comments: 612,
    shares: 2100,
    views: 312000,
  },
  {
    title: '5 Iftar Mistakes That Drain Your Energy ⚠️',
    description: 'Stop doing these at Iftar! Tips to stay energized through Tarawih. #ramadantips',
    videoUrl: SAMPLE_VIDEOS[7],
    thumbnailUrl: '/images/flash-sales/flash-dates.png',
    authorName: 'Nutritionist Bola',
    authorHandle: '@bolahealth',
    authorAvatar: '',
    category: 'tips',
    likes: 18750,
    comments: 534,
    shares: 1890,
    views: 268000,
  },
  {
    title: 'Zobo & Kunu Taste Test — Which Wins? 🧃',
    description: 'The great Naija drink debate! Zobo vs Kunu for Sahur. Drop your pick in comments 👇',
    videoUrl: SAMPLE_VIDEOS[6],
    thumbnailUrl: '/images/flash-sales/flash-zobo-kunu.png',
    authorName: 'Amaka Eats',
    authorHandle: '@amakaeats',
    authorAvatar: '',
    category: 'reviews',
    likes: 11200,
    comments: 798,
    shares: 560,
    views: 142000,
  },
  {
    title: 'Ramadan Grocery Haul — Under ₦15,000 🛒',
    description: 'Full week of Iftar meals on a budget. Watch till the end for the bonus tip!',
    videoUrl: SAMPLE_VIDEOS[1],
    thumbnailUrl: '/images/meals/meal-jollof.png',
    authorName: 'Halima Kitchen',
    authorHandle: '@halimakitchen',
    authorAvatar: '',
    category: 'tips',
    likes: 14200,
    comments: 367,
    shares: 980,
    views: 198000,
  },
];

async function main() {
  console.log('🌱 Seeding reels...');

  // Clear existing videos (and cascade comments)
  await db.videoComment.deleteMany();
  await db.video.deleteMany();

  for (const reel of REELS) {
    await db.video.create({
      data: {
        ...reel,
        likedBy: '[]',
      },
    });
  }

  // Add a couple of starter comments to the first video
  const first = await db.video.findFirst({ orderBy: { createdAt: 'desc' } });
  if (first) {
    await db.videoComment.createMany({
      data: [
        {
          videoId: first.id,
          authorName: 'Tunde',
          authorHandle: '@tundee',
          content: 'This jollof crust is EVERYTHING 😍 saving for Iftar!',
          likes: 42,
        },
        {
          videoId: first.id,
          authorName: 'Fatima',
          authorHandle: '@fatimah',
          content: 'Made this yesterday, my whole family loved it. Thank you Chef Safa 🙏',
          likes: 18,
        },
        {
          videoId: first.id,
          authorName: 'Yusuf',
          authorHandle: '@yusuf_eats',
          content: 'Bay leaves make all the difference 🔥',
          likes: 7,
        },
      ],
    });
  }

  const count = await db.video.count();
  const commentCount = await db.videoComment.count();
  console.log(`✅ Seeded ${count} videos and ${commentCount} comments`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
