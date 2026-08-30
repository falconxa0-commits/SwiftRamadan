/**
 * SwiftRamadan Seed Script — Phase 2 (items 66-70)
 *
 * Seeds:
 *  66. Orders (real DB orders, not mock)
 *  67. Product → Vendor links (assign products to vendor accounts)
 *  68. Vendor users (3 demo vendors with store profiles)
 *  69. Rider users (3 demo riders with vehicle details)
 *  70. User-scoped notifications (per-user, not global)
 *
 * Run: `bun run prisma/seed-phase2.ts`
 */

import { PrismaClient, User } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Starting Phase 2 seed...\n');

  // ─── 68. Create Vendor Users ───
  console.log('▸ Creating vendor users...');
  const vendors = [
    {
      name: 'Sani Bello',
      email: 'sani@swiftramadan.app',
      phone: '+2348012345601',
      role: 'vendor',
      area: 'Lekki Phase 1',
      storeName: 'Suya Central',
      businessCategory: 'Grilled Meats',
      businessAddress: '12 Admiralty Way, Lekki Phase 1',
      bankName: 'GTBank',
      accountNumber: '0123456789',
      openTime: '08:00',
      closeTime: '23:00',
      vendorOnline: true,
      hasanatPoints: 8200,
      swiftPoints: 2400,
      loyaltyTier: 'gold',
    },
    {
      name: 'Fatima Ibrahim',
      email: 'fatima@swiftramadan.app',
      phone: '+2348012345602',
      role: 'vendor',
      area: 'Victoria Island',
      storeName: 'Iftar Palace',
      businessCategory: 'Iftar Meals',
      businessAddress: '45 Adeola Odeku St, Victoria Island',
      bankName: 'Access Bank',
      accountNumber: '0234567890',
      openTime: '10:00',
      closeTime: '22:00',
      vendorOnline: true,
      hasanatPoints: 6100,
      swiftPoints: 1800,
      loyaltyTier: 'silver',
    },
    {
      name: 'Ahmed Mohammed',
      email: 'ahmed@swiftramadan.app',
      phone: '+2348012345603',
      role: 'vendor',
      area: 'Ikeja',
      storeName: 'Sahur Smoothies',
      businessCategory: 'Drinks & Smoothies',
      businessAddress: '78 Allen Avenue, Ikeja',
      bankName: 'Zenith Bank',
      accountNumber: '0345678901',
      openTime: '04:00',
      closeTime: '18:00',
      vendorOnline: false,
      hasanatPoints: 4500,
      swiftPoints: 900,
      loyaltyTier: 'silver',
    },
  ];

  const vendorUsers: User[] = [];
  for (const v of vendors) {
    const user = await db.user.upsert({
      where: { email: v.email },
      update: v,
      create: { ...v, password: 'demo1234' },
    });
    vendorUsers.push(user);
    console.log(`  ✓ Vendor: ${user.storeName} (${user.email})`);
  }

  // ─── 69. Create Rider Users ───
  console.log('\n▸ Creating rider users...');
  const riders = [
    {
      name: 'Ibrahim Musa',
      email: 'ibrahim@swiftramadan.app',
      phone: '+2348012345611',
      role: 'rider',
      area: 'Lekki',
      vehicleType: 'Motorcycle',
      plateNumber: 'LAG-123-XY',
      vehicleColor: 'Red',
      licenseNumber: 'RID-2024-001',
      riderBankName: 'GTBank',
      riderAccountNumber: '0456789012',
      riderOnline: true,
      hasanatPoints: 3200,
      swiftPoints: 5600,
      loyaltyTier: 'platinum',
    },
    {
      name: 'Chidi Okafor',
      email: 'chidi@swiftramadan.app',
      phone: '+2348012345612',
      role: 'rider',
      area: 'Ikeja',
      vehicleType: 'Bicycle',
      plateNumber: 'LAG-456-AB',
      vehicleColor: 'Blue',
      licenseNumber: 'RID-2024-002',
      riderBankName: 'Access Bank',
      riderAccountNumber: '056789012',
      riderOnline: true,
      hasanatPoints: 2800,
      swiftPoints: 4200,
      loyaltyTier: 'gold',
    },
    {
      name: 'Emeka Nwosu',
      email: 'emeka@swiftramadan.app',
      phone: '+2348012345613',
      role: 'rider',
      area: 'Yaba',
      vehicleType: 'Motorcycle',
      plateNumber: 'LAG-789-CD',
      vehicleColor: 'Black',
      licenseNumber: 'RID-2024-003',
      riderBankName: 'Zenith Bank',
      riderAccountNumber: '0678901234',
      riderOnline: false,
      hasanatPoints: 1900,
      swiftPoints: 3100,
      loyaltyTier: 'silver',
    },
  ];

  const riderUsers: User[] = [];
  for (const r of riders) {
    const user = await db.user.upsert({
      where: { email: r.email },
      update: r,
      create: { ...r, password: 'demo1234' },
    });
    riderUsers.push(user);
    console.log(`  ✓ Rider: ${user.name} (${user.email}) — ${user.vehicleType}`);
  }

  // ─── Ensure a customer user exists ───
  console.log('\n▸ Ensuring customer user...');
  const customer = await db.user.upsert({
    where: { email: 'sani@swiftramadan.app' },
    update: {},
    create: {
      email: 'sani@swiftramadan.app',
      name: 'Sani Bello',
      phone: '+2348012345601',
      role: 'vendor',
      password: 'demo1234',
    },
  });

  const demoCustomer = await db.user.upsert({
    where: { email: 'demo@swiftramadan.app' },
    update: {},
    create: {
      email: 'demo@swiftramadan.app',
      name: 'Demo Customer',
      phone: '+2348012345600',
      role: 'customer',
      password: 'demo1234',
      area: 'Lekki Phase 1',
      hasanatPoints: 5400,
      swiftPoints: 1200,
      loyaltyTier: 'gold',
      dailyStreak: 3,
    },
  });
  console.log(`  ✓ Customer: ${demoCustomer.name} (${demoCustomer.email})`);

  // ─── 67. Link Products to Vendors ───
  console.log('\n▸ Linking products to vendors...');
  const allProducts = await db.product.findMany();
  const productVendorMap: Record<string, string> = {
    'Jollof Rice & Lamb Platter': vendorUsers[0].id,
    'Large Suya Sampler': vendorUsers[0].id,
    'Masa Cakes': vendorUsers[0].id,
    'Zobo Drink': vendorUsers[0].id,
    'The Ultimate Ramadan Box': vendorUsers[1].id,
    'Iftar Family Bundle': vendorUsers[1].id,
    'Premium Dates Box': vendorUsers[1].id,
    'Iftar Special: Jollof Rice & Grilled Chicken': vendorUsers[1].id,
    'Sahur Box: Overnight Oats & Dates': vendorUsers[2].id,
    'Zobo & Kunu Pack': vendorUsers[2].id,
    'Sahur Smoothie Pack': vendorUsers[2].id,
    'Family Iftar Bundle for 6': vendorUsers[1].id,
  };

  let linkedCount = 0;
  for (const product of allProducts) {
    const vendorId = productVendorMap[product.name];
    if (vendorId) {
      await db.product.update({
        where: { id: product.id },
        data: { vendorId },
      });
      linkedCount++;
    }
  }
  console.log(`  ✓ Linked ${linkedCount} products to vendors`);

  // ─── 66. Seed Orders ───
  console.log('\n▸ Creating orders...');
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);

  const orders = [
    // Active order for demo customer
    {
      status: 'In Transit',
      total: 17500,
      riderName: 'Ibrahim Musa',
      progress: 75,
      userId: demoCustomer.id,
      items: JSON.stringify([{ name: 'The Ultimate Ramadan Box', qty: 1, price: 17500 }]),
      createdAt: hoursAgo(1),
    },
    {
      status: 'Preparing',
      total: 8500,
      riderName: null,
      progress: 35,
      userId: demoCustomer.id,
      items: JSON.stringify([
        { name: 'Jollof Rice & Lamb Platter', qty: 1, price: 6500 },
        { name: 'Zobo Drink', qty: 1, price: 2000 },
      ]),
      createdAt: hoursAgo(0.5),
    },
    // Past delivered orders
    {
      status: 'Delivered',
      total: 12000,
      riderName: 'Ibrahim Musa',
      progress: 100,
      userId: demoCustomer.id,
      items: JSON.stringify([{ name: 'Iftar Family Bundle', qty: 1, price: 11000 }]),
      createdAt: hoursAgo(26),
    },
    {
      status: 'Delivered',
      total: 7500,
      riderName: 'Chidi Okafor',
      progress: 100,
      userId: demoCustomer.id,
      items: JSON.stringify([{ name: 'Premium Dates Box', qty: 1, price: 7500 }]),
      createdAt: hoursAgo(48),
    },
    {
      status: 'Delivered',
      total: 5000,
      riderName: 'Chidi Okafor',
      progress: 100,
      userId: demoCustomer.id,
      items: JSON.stringify([{ name: 'Zobo & Kunu Pack', qty: 1, price: 2800 }, { name: 'Masa Cakes', qty: 1, price: 2200 }]),
      createdAt: hoursAgo(72),
    },
    // Ready order (available for riders)
    {
      status: 'Ready',
      total: 6500,
      riderName: null,
      progress: 55,
      userId: demoCustomer.id,
      items: JSON.stringify([{ name: 'Jollof Rice & Lamb Platter', qty: 1, price: 6500 }]),
      createdAt: hoursAgo(0.2),
    },
    // Confirmed order
    {
      status: 'Confirmed',
      total: 4200,
      riderName: null,
      progress: 15,
      userId: demoCustomer.id,
      items: JSON.stringify([{ name: 'Large Suya Sampler', qty: 1, price: 4200 }]),
      createdAt: hoursAgo(0.1),
    },
  ];

  for (const order of orders) {
    await db.order.create({ data: order });
  }
  console.log(`  ✓ Created ${orders.length} orders`);

  // ─── 70. User-scoped Notifications ───
  console.log('\n▸ Creating user-scoped notifications...');
  // Clear existing global notifications (no userId)
  await db.notification.deleteMany({ where: { userId: null } });

  const notifications = [
    // Demo customer notifications
    {
      title: 'Order Confirmed!',
      message: 'Your Ramadan Family Box is being prepared.',
      type: 'order',
      userId: demoCustomer.id,
      read: false,
      createdAt: hoursAgo(0.2),
    },
    {
      title: 'Flash Sale Alert',
      message: '30% off all Dates & Fruit Boxes - 1 hour left!',
      type: 'promo',
      userId: demoCustomer.id,
      read: false,
      createdAt: hoursAgo(0.5),
    },
    {
      title: 'Iftar Reminder',
      message: 'Maghrib is at 6:45 PM. Order your Iftar now!',
      type: 'reminder',
      userId: demoCustomer.id,
      read: true,
      createdAt: hoursAgo(1),
    },
    {
      title: 'SwiftRewards',
      message: "You've earned 500 points from your last order!",
      type: 'reward',
      userId: demoCustomer.id,
      read: true,
      createdAt: hoursAgo(3),
    },
    {
      title: 'Delivery Update',
      message: 'Your rider Ibrahim is 5 mins away!',
      type: 'order',
      userId: demoCustomer.id,
      read: true,
      createdAt: hoursAgo(8),
    },
    // Vendor notifications — incoming orders
    {
      title: 'New Order!',
      message: 'RAM-4829: Jollof Rice & Lamb Platter — ₦6,500',
      type: 'order',
      userId: vendorUsers[0].id,
      read: false,
      createdAt: hoursAgo(0.1),
    },
    {
      title: 'New Order!',
      message: 'RAM-4830: The Ultimate Ramadan Box — ₦17,500',
      type: 'order',
      userId: vendorUsers[1].id,
      read: false,
      createdAt: hoursAgo(0.2),
    },
    // Rider notifications — new delivery available
    {
      title: 'New Delivery Available',
      message: 'Order ready for pickup at Suya Central — earn ₦975',
      type: 'delivery',
      userId: riderUsers[0].id,
      read: false,
      createdAt: hoursAgo(0.1),
    },
    {
      title: 'Delivery Completed',
      message: 'You earned ₦1,125 from your last delivery. Great job!',
      type: 'reward',
      userId: riderUsers[0].id,
      read: true,
      createdAt: hoursAgo(2),
    },
  ];

  for (const notif of notifications) {
    await db.notification.create({ data: notif });
  }
  console.log(`  ✓ Created ${notifications.length} user-scoped notifications`);

  // ─── Seed default coupons if none exist ───
  console.log('\n▸ Seeding coupons...');
  const existingCoupons = await db.coupon.count();
  if (existingCoupons === 0) {
    const coupons = [
      { code: 'RAMADAN', type: 'percent', value: 10, minOrder: 5000, maxUses: 1000, active: true },
      { code: 'IFTAR', type: 'percent', value: 15, minOrder: 10000, maxUses: 500, active: true },
      { code: 'SWIFT25', type: 'percent', value: 25, minOrder: 20000, maxUses: 100, active: true },
      { code: 'SAHUR', type: 'fixed', value: 1000, minOrder: 3000, maxUses: 300, active: true },
      { code: 'FREESHIP', type: 'fixed', value: 500, minOrder: 1000, maxUses: 2000, active: true },
    ];
    for (const c of coupons) {
      await db.coupon.create({ data: c });
    }
    console.log(`  ✓ Created ${coupons.length} coupons`);
  } else {
    console.log(`  ⊘ ${existingCoupons} coupons already exist, skipping`);
  }

  // ─── Seed default settings for users ───
  console.log('\n▸ Seeding user settings...');
  const allUsers = await db.user.findMany();
  for (const user of allUsers) {
    await db.userSetting.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
  }
  console.log(`  ✓ Settings ensured for ${allUsers.length} users`);

  console.log('\n✅ Phase 2 seed complete!');
  console.log('\n📋 Demo Accounts (password: demo1234):');
  console.log('  Customer: demo@swiftramadan.app');
  console.log('  Vendor:   sani@swiftramadan.app | fatima@swiftramadan.app | ahmed@swiftramadan.app');
  console.log('  Rider:    ibrahim@swiftramadan.app | chidi@swiftramadan.app | emeka@swiftramadan.app');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
