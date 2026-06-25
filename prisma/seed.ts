import { db } from '../src/lib/db';

/**
 * Comprehensive seed for SwiftRamadan.
 * Populates: User, Product, Notification, Order (+ keeps existing videos).
 * Run: bun run prisma/seed.ts
 */

async function main() {
  console.log('🌱 Seeding SwiftRamadan database...');

  // ── 1. Demo user (so login is instant) ──
  const user = await db.user.upsert({
    where: { email: 'sani@swiftramadan.app' },
    update: {},
    create: {
      name: 'Sani Ibrahim',
      email: 'sani@swiftramadan.app',
      phone: '+234 803 555 0142',
      password: 'demo1234',
      role: 'customer',
      area: 'Lekki Phase 1',
      onboardingComplete: true,
      hasanatPoints: 5400,
      swiftPoints: 1200,
      loyaltyTier: 'gold',
      dailyStreak: 7,
    },
  });
  console.log(`  ✓ User: ${user.name} (${user.email})`);

  // ── 2. Products (catalog) ──
  const products = [
    {
      name: 'The Ultimate Ramadan Box',
      description: 'Curated Iftar & Sahur essentials box filled with premium rice, cooking oil, dates, fruits, and spices. 12 premium items.',
      price: 17500,
      originalPrice: 25000,
      salePrice: 17500,
      image: '/images/products/ramadan-box-1.png',
      images: '["/images/products/ramadan-box-1.png","/images/products/ramadan-box-2.png","/images/products/ramadan-box-3.png","/images/products/ramadan-box-4.png"]',
      category: 'bundles',
      rating: 4.9,
      reviews: 234,
      deliveryTime: '25-35 min',
      inStock: true,
    },
    {
      name: 'Jollof Rice & Chicken',
      description: 'Smoky party jollof with succulent grilled chicken. A Lagos classic!',
      price: 4500,
      image: '/images/meals/meal-jollof.png',
      images: '["/images/meals/meal-jollof.png"]',
      category: 'meals',
      rating: 4.9,
      reviews: 289,
      deliveryTime: '25 min',
      inStock: true,
    },
    {
      name: 'Suya Platter',
      description: 'Spicy beef suya with fresh onions and tomatoes. A Lagos street food classic.',
      price: 3200,
      image: '/images/meals/meal-suya.png',
      images: '["/images/meals/meal-suya.png"]',
      category: 'meals',
      rating: 4.8,
      reviews: 203,
      deliveryTime: '30 min',
      inStock: true,
    },
    {
      name: 'Moi Moi & Pap',
      description: 'Steamed bean pudding with creamy corn pap. Perfect for Sahur.',
      price: 2800,
      image: '/images/meals/meal-moimoi.png',
      images: '["/images/meals/meal-moimoi.png"]',
      category: 'meals',
      rating: 4.7,
      reviews: 156,
      deliveryTime: '20 min',
      inStock: true,
    },
    {
      name: 'Date & Nut Smoothie',
      description: 'Energy-packed date smoothie with groundnuts. Great for Iftar or Sahur.',
      price: 1800,
      image: '/images/meals/meal-smoothie.png',
      images: '["/images/meals/meal-smoothie.png"]',
      category: 'drinks',
      rating: 4.9,
      reviews: 178,
      deliveryTime: '15 min',
      inStock: true,
    },
    {
      name: 'Premium Dates Box',
      description: 'Premium Ajwa and Medjool dates. Perfect for breaking your fast.',
      price: 7500,
      originalPrice: 12000,
      salePrice: 7500,
      image: '/images/flash-sales/flash-dates.png',
      images: '["/images/flash-sales/flash-dates.png"]',
      category: 'bundles',
      rating: 4.7,
      reviews: 98,
      deliveryTime: '20-25 min',
      inStock: true,
    },
    {
      name: 'Iftar Family Bundle',
      description: 'Complete Iftar meal for the whole family. Serves 6.',
      price: 11000,
      originalPrice: 18000,
      salePrice: 11000,
      image: '/images/flash-sales/flash-iftar-bundle.png',
      images: '["/images/flash-sales/flash-iftar-bundle.png"]',
      category: 'bundles',
      rating: 4.8,
      reviews: 142,
      deliveryTime: '30-40 min',
      inStock: true,
    },
    {
      name: 'Zobo & Kunu Pack',
      description: 'Traditional hibiscus and millet drinks. Refreshing and nutritious.',
      price: 2800,
      originalPrice: 5000,
      salePrice: 2800,
      image: '/images/flash-sales/flash-zobo-kunu.png',
      images: '["/images/flash-sales/flash-zobo-kunu.png"]',
      category: 'drinks',
      rating: 4.6,
      reviews: 67,
      deliveryTime: '15-20 min',
      inStock: true,
    },
    {
      name: 'Mini Iftar Box',
      description: 'Compact Iftar box for one — dates, smoothie, and a light meal.',
      price: 8500,
      image: '/images/products/ramadan-box-2.png',
      images: '["/images/products/ramadan-box-2.png"]',
      category: 'bundles',
      rating: 4.6,
      reviews: 54,
      deliveryTime: '20 min',
      inStock: true,
    },
    {
      name: 'Family Size Ramadan Box',
      description: 'The biggest box — feeds a family of 8 for the full week of Ramadan.',
      price: 32000,
      image: '/images/products/ramadan-box-3.png',
      images: '["/images/products/ramadan-box-3.png"]',
      category: 'bundles',
      rating: 4.9,
      reviews: 87,
      deliveryTime: '35-45 min',
      inStock: true,
    },
    {
      name: 'Sadaqah Charity Box',
      description: 'Sponsor an Iftar meal for those in need. 100% of proceeds go to charity.',
      price: 5000,
      image: '/images/products/ramadan-box-4.png',
      images: '["/images/products/ramadan-box-4.png"]',
      category: 'charity',
      rating: 5.0,
      reviews: 312,
      deliveryTime: '—',
      inStock: true,
    },
    {
      name: '50kg Bag of Rice',
      description: 'Premium long-grain rice. Bulk pantry staple for the month.',
      price: 45000,
      image: '/images/categories/cat-groceries.png',
      images: '["/images/categories/cat-groceries.png"]',
      category: 'groceries',
      rating: 4.8,
      reviews: 145,
      deliveryTime: '40-60 min',
      inStock: true,
    },
    {
      name: '25L Premium Cooking Oil',
      description: 'Refined vegetable cooking oil in a 25-litre jerry can.',
      price: 28000,
      image: '/images/categories/cat-groceries.png',
      images: '["/images/categories/cat-groceries.png"]',
      category: 'groceries',
      rating: 4.7,
      reviews: 92,
      deliveryTime: '40-60 min',
      inStock: true,
    },
  ];

  // Clear + recreate products
  await db.product.deleteMany();
  for (const p of products) {
    await db.product.create({ data: p });
  }
  console.log(`  ✓ Products: ${products.length}`);

  // ── 3. Notifications ──
  await db.notification.deleteMany();
  const now = Date.now();
  const notifications = [
    { title: 'Iftar delivery arriving soon', message: 'Your Jollof Rice & Chicken is 5 minutes away. Rider: Ibrahim M.', type: 'delivery', minsAgo: 2 },
    { title: 'Flash Sale ending soon ⏰', message: 'Premium Dates Box is 38% OFF — only 2h 15m left!', type: 'promo', minsAgo: 18 },
    { title: 'Sahur alarm set', message: 'Wake-up call for 4:30 AM Sahur. Stay energized!', type: 'reminder', minsAgo: 60 },
    { title: 'Order delivered 🎉', message: 'Your Iftar Family Bundle was delivered. Rate your experience!', type: 'order', minsAgo: 180 },
    { title: 'Group Buy unlocked', message: '3 more people joined the Rice Group Buy. Price dropped to ₦38,000!', type: 'social', minsAgo: 360 },
    { title: 'Hasanat points earned', message: 'You earned +50 hasanat points for your daily check-in. Streak: 7 days 🔥', type: 'reward', minsAgo: 540 },
    { title: 'Chef Safa is LIVE', message: 'Live cooking session: Smoky Jollof in 30 mins. Tap to join!', type: 'live', minsAgo: 720 },
  ];
  for (const n of notifications) {
    await db.notification.create({
      data: {
        title: n.title,
        message: n.message,
        type: n.type,
        read: false,
        createdAt: new Date(now - n.minsAgo * 60 * 1000),
      },
    });
  }
  console.log(`  ✓ Notifications: ${notifications.length}`);

  // ── 4. Sample order (so Orders tab isn't empty) ──
  await db.order.deleteMany();
  await db.order.create({
    data: {
      status: 'In Transit',
      total: 9000,
      riderName: 'Ibrahim M.',
      progress: 75,
      items: JSON.stringify([{ name: 'Jollof Rice & Chicken', qty: 2, price: 4500 }]),
      userId: user.id,
      createdAt: new Date(now - 15 * 60 * 1000),
    },
  });
  await db.order.create({
    data: {
      status: 'Preparing',
      total: 17500,
      riderName: null,
      progress: 35,
      items: JSON.stringify([{ name: 'The Ultimate Ramadan Box', qty: 1, price: 17500 }]),
      userId: user.id,
      createdAt: new Date(now - 45 * 60 * 1000),
    },
  });
  await db.order.create({
    data: {
      status: 'Delivered',
      total: 8500,
      riderName: 'Tunde A.',
      progress: 100,
      items: JSON.stringify([{ name: 'Mini Iftar Box', qty: 1, price: 8500 }]),
      userId: user.id,
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
    },
  });
  console.log(`  ✓ Orders: 3 (1 in transit, 1 preparing, 1 delivered)`);

  // ── 5. Summary ──
  const counts = {
    users: await db.user.count(),
    products: await db.product.count(),
    orders: await db.order.count(),
    notifications: await db.notification.count(),
    videos: await db.video.count(),
    videoComments: await db.videoComment.count(),
    communityPosts: await db.communityPost.count(),
  };
  console.log('\n📊 Final DB state:');
  console.log(counts);
  console.log('\n✅ Seed complete!');
  console.log('   Demo login: sani@swiftramadan.app / demo1234');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
