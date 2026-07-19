import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding next-gen features...');

  // ── Challenges (2 daily, 2 weekly, 2 ramadan) ──
  const challenges = await Promise.all([
    prisma.challenge.upsert({ where: { id: 'ch-daily-1' }, update: {}, create: { id: 'ch-daily-1', title: 'Order a new cuisine', description: 'Try a cuisine you\'ve never ordered before', icon: '🍽️', category: 'daily', points: 100, target: 1, active: true } }),
    prisma.challenge.upsert({ where: { id: 'ch-daily-2' }, update: {}, create: { id: 'ch-daily-2', title: 'Cook a recipe', description: 'Follow an AI-generated recipe from SwiftRamadan', icon: '👨‍🍳', category: 'daily', points: 150, target: 1, active: true } }),
    prisma.challenge.upsert({ where: { id: 'ch-weekly-1' }, update: {}, create: { id: 'ch-weekly-1', title: 'Share an Iftar photo', description: 'Upload a photo of your Iftar spread', icon: '📸', category: 'weekly', points: 200, target: 3, active: true } }),
    prisma.challenge.upsert({ where: { id: 'ch-weekly-2' }, update: {}, create: { id: 'ch-weekly-2', title: 'Gift a meal', description: 'Gift a meal to someone special', icon: '🎁', category: 'weekly', points: 300, target: 2, active: true } }),
    prisma.challenge.upsert({ where: { id: 'ch-ramadan-1' }, update: {}, create: { id: 'ch-ramadan-1', title: 'Complete 30 days of fasting', description: 'Fast every day of Ramadan', icon: '🌙', category: 'ramadan', points: 3000, target: 30, active: true } }),
    prisma.challenge.upsert({ where: { id: 'ch-ramadan-2' }, update: {}, create: { id: 'ch-ramadan-2', title: 'Ramadan Champion', description: 'Complete all daily challenges', icon: '🏆', category: 'ramadan', points: 5000, target: 30, active: true } }),
  ]);
  console.log(`  ✅ Created ${challenges.length} challenges`);

  // ── Chef Battles (2 live, 1 completed) ──
  const now = Date.now();
  const battles = await Promise.all([
    prisma.chefBattle.upsert({ where: { id: 'battle-1' }, update: {}, create: { id: 'battle-1', title: 'Jollof Rice', description: 'The ultimate Jollof battle!', chefAName: 'Chef Amina', chefADish: 'Party Jollof', chefAImage: '👩‍🍳', chefAVotes: 234, chefBName: 'Chef Bello', chefBDish: 'Smoky Jollof', chefBImage: '👨‍🍳', chefBVotes: 198, status: 'live', endTime: new Date(now + 3600000 * 6) } }),
    prisma.chefBattle.upsert({ where: { id: 'battle-2' }, update: {}, create: { id: 'battle-2', title: 'Suya Skewers', description: 'Who grills the best suya?', chefAName: 'Chef Danjuma', chefADish: 'Spicy Suya', chefAImage: '👨‍🍳', chefAVotes: 156, chefBName: 'Chef Fatima', chefBDish: 'Honey Suya', chefBImage: '👩‍🍳', chefBVotes: 189, status: 'live', endTime: new Date(now + 3600000 * 12) } }),
    prisma.chefBattle.upsert({ where: { id: 'battle-3' }, update: {}, create: { id: 'battle-3', title: 'Moi Moi', description: 'Classic Moi Moi showdown!', chefAName: 'Chef Iyabo', chefADish: 'Steamed Moi Moi', chefAImage: '👩‍🍳', chefAVotes: 312, chefBName: 'Chef Emeka', chefBDish: 'Baked Moi Moi', chefBImage: '👨‍🍳', chefBVotes: 287, status: 'completed', endTime: new Date(now - 3600000) } }),
  ]);
  console.log(`  ✅ Created ${battles.length} chef battles`);

  // ── Stories (4, expiring 24h from now) ──
  const expiryDate = new Date(now + 24 * 60 * 60 * 1000);
  const stories = await Promise.all([
    prisma.story.create({ data: { authorName: 'Amina K.', authorAvatar: '', type: 'image', mediaUrl: '/images/meals/meal-jollof.png', caption: 'Jollof and chicken for iftar!', sticker: 'Just broke fast 🌙', views: 23, expiresAt: expiryDate } }),
    prisma.story.create({ data: { authorName: 'Ibrahim S.', authorAvatar: '', type: 'image', mediaUrl: '/images/meals/meal-shawarma.png', caption: 'Prepping sahur early', sticker: 'Sahur prep ☪️', views: 15, expiresAt: expiryDate } }),
    prisma.story.create({ data: { authorName: 'Fatima M.', authorAvatar: '', type: 'image', mediaUrl: '/images/meals/meal-peppersoup.png', caption: 'Pepper soup hits different after fasting', sticker: 'Alhamdulillah 🤲', views: 31, expiresAt: expiryDate } }),
    prisma.story.create({ data: { authorName: 'Yusuf A.', authorAvatar: '', type: 'text', mediaUrl: '', caption: 'First day fasting complete! Alhamdulillah 🌙', sticker: 'Ramadan Mubarak ✨', views: 8, expiresAt: expiryDate } }),
  ]);
  console.log(`  ✅ Created ${stories.length} stories`);

  // ── Recipe Remixes (3) ──
  const remixes = await Promise.all([
    prisma.recipeRemix.create({ data: { originalName: 'Traditional Jollof Rice', originalImage: '', remixedName: 'Coconut Jollof Rice', remixedBy: 'Amina K.', remixDescription: 'What if we made Jollof with coconut rice? A creamy twist on the classic!', twist: 'Coconut milk instead of water', likes: 23 } }),
    prisma.recipeRemix.create({ data: { originalName: 'Suya Skewers', originalImage: '', remixedName: 'Suya-Stuffed Plantain', remixedBy: 'Yusuf A.', remixDescription: 'Suya meets plantain — the ultimate Nigerian fusion bite!', twist: 'Plantain wrap with suya filling', likes: 18 } }),
    prisma.recipeRemix.create({ data: { originalName: 'Pepper Soup', originalImage: '', remixedName: 'Coconut Pepper Soup', remixedBy: 'Fatima M.', remixDescription: 'Adding coconut milk creates a creamy, aromatic twist on traditional pepper soup', twist: 'Coconut milk base', likes: 12 } }),
  ]);
  console.log(`  ✅ Created ${remixes.length} recipe remixes`);

  // ── Neighbor Alerts (4) ──
  const alerts = await Promise.all([
    prisma.neighborAlert.create({ data: { authorName: 'Amina K.', authorArea: 'Lekki Phase 1', type: 'iftar', title: 'Extra Iftar packs at The Food Hub', description: '2 extra iftar packs available, join the delivery and save on fees!', location: 'Lekki Phase 1', urgency: 'normal', expiresAt: new Date(now + 15 * 60 * 1000) } }),
    prisma.neighborAlert.create({ data: { authorName: 'Ibrahim S.', authorArea: 'Victoria Island', type: 'surplus', title: 'Surplus Suya from Suya Palace', description: 'Big suya order, anyone want to split?', location: 'Victoria Island', urgency: 'low', expiresAt: new Date(now + 22 * 60 * 1000) } }),
    prisma.neighborAlert.create({ data: { authorName: 'Fatima M.', authorArea: 'Ikoyi', type: 'charity', title: 'Free Iftar at Mama Calabar', description: 'Community iftar initiative, free packs for those in need', location: 'Ikoyi', urgency: 'high', expiresAt: new Date(now + 8 * 60 * 1000) } }),
    prisma.neighborAlert.create({ data: { authorName: 'Yusuf A.', authorArea: 'Yaba', type: 'community', title: 'Group order from Amala Spot', description: '3 more people needed for group delivery discount', location: 'Yaba', urgency: 'normal', expiresAt: new Date(now + 18 * 60 * 1000) } }),
  ]);
  console.log(`  ✅ Created ${alerts.length} neighbor alerts`);

  // ── Auction Items (3 live, ending 2h from now) ──
  const auctionEnd = new Date(now + 2 * 60 * 60 * 1000);
  const auctions = await Promise.all([
    prisma.auctionItem.create({ data: { name: 'Suya Platter Premium', description: 'Premium suya platter from Mama Aisha Kitchen', image: '/images/products/suya-platter.png', startPrice: 5000, currentBid: 3500, bidCount: 7, endTime: auctionEnd, status: 'live' } }),
    prisma.auctionItem.create({ data: { name: 'Ramadan Fruit Basket', description: 'Fresh fruit basket from Fresh Harvest NG', image: '/images/products/fruit-basket.png', startPrice: 8000, currentBid: 5200, bidCount: 5, endTime: new Date(now + 90 * 60 * 1000), status: 'live' } }),
    prisma.auctionItem.create({ data: { name: 'Jollof Rice Family Pack', description: 'Family-sized jollof from Alhaji Bello Foods', image: '/images/products/jollof-family.png', startPrice: 12000, currentBid: 7800, bidCount: 8, endTime: new Date(now + 150 * 60 * 1000), status: 'live' } }),
  ]);
  console.log(`  ✅ Created ${auctions.length} auction items`);

  // ── Subscription Boxes (4) ──
  const boxes = await Promise.all([
    prisma.subscriptionBox.upsert({ where: { id: 'box-sahur' }, update: {}, create: { id: 'box-sahur', name: 'Weekly Sahur Box', description: 'Daily Sahur meal for 1 person with fresh fruits & dates', image: '', price: 12000, frequency: 'weekly', items: JSON.stringify(['Daily Sahur meal', 'Fresh fruits & dates', 'Hot beverage', 'Delivered before 4:30 AM']), isActive: true } }),
    prisma.subscriptionBox.upsert({ where: { id: 'box-iftar' }, update: {}, create: { id: 'box-iftar', name: 'Iftar Essentials Box', description: 'Everything you need for a perfect iftar every day', image: '', price: 25000, frequency: 'weekly', items: JSON.stringify(['Dates & water', 'Fresh juice', 'Soup of the day', 'Main meal', 'Dessert']), isActive: true } }),
    prisma.subscriptionBox.upsert({ where: { id: 'box-full' }, update: {}, create: { id: 'box-full', name: 'Full Ramadan Plan', description: 'Daily Sahur + Iftar for 1 person for 30 days', image: '', price: 85000, frequency: 'monthly', items: JSON.stringify(['Daily Sahur + Iftar', 'Premium protein', 'Fresh juice & Zobo', 'Dates & water', 'Iftar-precision delivery', 'Special Eid box']), isActive: true } }),
    prisma.subscriptionBox.upsert({ where: { id: 'box-family' }, update: {}, create: { id: 'box-family', name: 'Family Iftar Bundle', description: 'Iftar for the whole family — 3-4 people', image: '', price: 45000, frequency: 'weekly', items: JSON.stringify(['Family-sized main dish', 'Assorted sides', 'Drinks for 4', 'Dessert platter', 'Extra dates pack']), isActive: true } }),
  ]);
  console.log(`  ✅ Created ${boxes.length} subscription boxes`);

  // ── Mosque Partners (4) ──
  const mosques = await Promise.all([
    prisma.mosquePartner.upsert({ where: { id: 'mosque-1' }, update: {}, create: { id: 'mosque-1', name: 'Al-Huda Mosque', address: '15 Admiralty Way', area: 'Lekki Phase 1', lat: 6.4281, lng: 3.4219, iftarCapacity: 200, contactPhone: '+234-801-234-5678', status: 'active' } }),
    prisma.mosquePartner.upsert({ where: { id: 'mosque-2' }, update: {}, create: { id: 'mosque-2', name: 'Central Mosque Ikeja', address: '45 Oba Akran Ave', area: 'Ikeja GRA', lat: 6.6018, lng: 3.3515, iftarCapacity: 500, contactPhone: '+234-802-345-6789', status: 'active' } }),
    prisma.mosquePartner.upsert({ where: { id: 'mosque-3' }, update: {}, create: { id: 'mosque-3', name: 'Ansar-Ud-Deen Mosque', address: '8 Ogunlana Drive', area: 'Surulere', lat: 6.4972, lng: 3.3594, iftarCapacity: 150, contactPhone: '+234-803-456-7890', status: 'active' } }),
    prisma.mosquePartner.upsert({ where: { id: 'mosque-4' }, update: {}, create: { id: 'mosque-4', name: 'Yaba Muslim Community', address: '12 Herbert Macaulay Way', area: 'Yaba', lat: 6.5095, lng: 3.3790, iftarCapacity: 100, contactPhone: '+234-804-567-8901', status: 'active' } }),
  ]);
  console.log(`  ✅ Created ${mosques.length} mosque partners`);

  // ── Rider ETA Party (2) ──
  const riderEtas = await Promise.all([
    prisma.riderETAParty.create({ data: { orderId: 'ORD-2026-RMD-001', riderName: 'Ibrahim A.', eta: 7, mood: '🎉', song: 'Ramadan vibes 🎵', viewers: 4, status: 'en_route' } }),
    prisma.riderETAParty.create({ data: { orderId: 'ORD-2026-RMD-002', riderName: 'Tunde B.', eta: 3, mood: '🔥', song: 'Almost there! 🏃', viewers: 2, status: 'arriving' } }),
  ]);
  console.log(`  ✅ Created ${riderEtas.length} rider ETA parties`);

  console.log('\n🎉 Next-gen seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
