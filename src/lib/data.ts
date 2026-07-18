// Mock data for SwiftRamadan app

// Re-export shared formatNaira from the central utility
export { formatNaira } from '@/lib/format';

// Hero Slides
export const heroSlides = [
  {
    id: 1,
    image: '/images/hero/hero-iftar-jollof.png',
    title: 'Iftar Special: Jollof Rice & Grilled Chicken',
    subtitle: 'Delivered before Maghrib',
    badge: 'Best Seller',
  },
  {
    id: 2,
    image: '/images/hero/hero-sahur-oats.png',
    title: 'Sahur Box: Overnight Oats & Dates',
    subtitle: 'Pre-dawn energy boost',
    badge: 'New',
  },
  {
    id: 3,
    image: '/images/hero/hero-family-iftar.png',
    title: 'Family Iftar Bundle for 6',
    subtitle: 'Save 30% with group pricing',
    badge: 'Group Buy',
  },
];

// Categories
export const categories = [
  { id: 1, name: 'Iftar Meals', image: '/images/categories/cat-iftar.png', active: true },
  { id: 2, name: 'Sahur', image: '/images/categories/cat-sahur.png', active: false },
  { id: 3, name: 'Dates', image: '/images/categories/cat-dates.png', active: false },
  { id: 4, name: 'Drinks', image: '/images/categories/cat-drinks.png', active: false },
  { id: 5, name: 'Snacks', image: '/images/categories/cat-snacks.png', active: false },
  { id: 6, name: 'Fruits', image: '/images/categories/cat-fruits.png', active: false },
  { id: 7, name: 'Groceries', image: '/images/categories/cat-groceries.png', active: false },
];

// Ramadan Box
export const ramadanBox = {
  id: 100,
  title: 'The Ultimate Ramadan Box',
  originalPrice: 25000,
  salePrice: 17500,
  images: [
    '/images/products/ramadan-box-1.png',
    '/images/products/ramadan-box-2.png',
    '/images/products/ramadan-box-3.png',
    '/images/products/ramadan-box-4.png',
  ],
  contents: '12 Premium Items',
};

// Trending Meals
export const trendingMeals = [
  {
    id: 1,
    name: 'Jollof Rice & Chicken',
    description: 'Smoky party jollof with succulent grilled chicken',
    price: 4500,
    image: '/images/meals/meal-jollof.png',
    deliveryTime: '25 min',
    rating: 4.9,
    reviews: 289,
    category: 'Iftar Meals',
  },
  {
    id: 2,
    name: 'Suya Platter',
    description: 'Spicy beef suya with fresh onions and tomatoes',
    price: 3200,
    image: '/images/meals/meal-suya.png',
    deliveryTime: '30 min',
    rating: 4.8,
    reviews: 203,
    category: 'Iftar Meals',
  },
  {
    id: 3,
    name: 'Moi Moi & Pap',
    description: 'Steamed bean pudding with creamy corn pap',
    price: 2800,
    image: '/images/meals/meal-moimoi.png',
    deliveryTime: '20 min',
    rating: 4.7,
    reviews: 156,
    category: 'Sahur',
  },
  {
    id: 4,
    name: 'Date & Nut Smoothie',
    description: 'Energy-packed date smoothie with groundnuts',
    price: 1800,
    image: '/images/meals/meal-smoothie.png',
    deliveryTime: '15 min',
    rating: 4.9,
    reviews: 178,
    category: 'Drinks',
  },
];

// Category Hub Items
export const categoryHubItems = [
  { id: 1, name: 'Iftar Meals', subtitle: '200+ dishes', image: '/images/categories/hub-iftar.png', badge: 'Popular' },
  { id: 2, name: 'Groceries', subtitle: 'Bulk savings', image: '/images/categories/hub-groceries.png', badge: 'Group Buy' },
  { id: 3, name: 'Pharmacy', subtitle: 'Health essentials', image: '/images/categories/hub-pharmacy.png', badge: 'Fast' },
  { id: 4, name: 'Office Meals', subtitle: 'Corporate plans', image: '/images/categories/hub-office.png', badge: 'New' },
];

// Popular Retailers
export const popularRetailers = [
  { id: 1, name: 'The Food Hub', category: 'Iftar Meals', deliveryTime: '25 min', image: '/images/retailers/retailer-foodhub.png', rating: 4.8, verified: true },
  { id: 2, name: 'Lagos Fresh Mart', category: 'Groceries', deliveryTime: '40 min', image: '/images/retailers/retailer-freshmart.png', rating: 4.6, verified: true },
  { id: 3, name: 'Suya Palace', category: 'Grills', deliveryTime: '30 min', image: '/images/retailers/retailer-suyapalace.png', rating: 4.7, verified: false },
  { id: 4, name: 'Green Pharmacy', category: 'Pharmacy', deliveryTime: '35 min', image: '/images/retailers/retailer-pharmacy.png', rating: 4.5, verified: true },
];

// Quick Actions
export const quickActions = [
  { id: 1, name: 'Reorder', icon: 'replay' },
  { id: 2, name: 'Group Buy', icon: 'groups' },
  { id: 3, name: 'Gift', icon: 'card_giftcard' },
  { id: 4, name: 'Recipes', icon: 'restaurant' },
  { id: 5, name: 'Mosques', icon: 'mosque' },
  { id: 6, name: 'Track', icon: 'local_shipping' },
];

// My Orders
export const myOrders = [
  {
    id: 'SWR-2847',
    item: 'Jollof Rice & Chicken x2',
    status: 'In Transit',
    eta: 'Arriving in 15 min',
    total: 9000,
    rider: 'Ibrahim M.',
    items: [{ name: 'Jollof Rice & Chicken', qty: 2, price: 4500 }],
    progress: 75,
  },
  {
    id: 'SWR-2846',
    item: 'Ramadan Box - Premium',
    status: 'Preparing',
    eta: 'Estimated 6:30 PM',
    total: 17500,
    rider: null,
    items: [{ name: 'Ramadan Box - Premium', qty: 1, price: 17500 }],
    progress: 35,
  },
  {
    id: 'SWR-2839',
    item: 'Date Bundle (5kg)',
    status: 'Delivered',
    eta: 'Delivered Mar 12',
    total: 8500,
    rider: null,
    items: [{ name: 'Date Bundle (5kg)', qty: 1, price: 8500 }],
    progress: 100,
  },
  {
    id: 'SWR-2832',
    item: 'Sahur Pack x3',
    status: 'Delivered',
    eta: 'Delivered Mar 11',
    total: 5400,
    rider: null,
    items: [{ name: 'Sahur Pack', qty: 3, price: 1800 }],
    progress: 100,
  },
];

// Flash Sales
export const flashSales = [
  {
    id: 1,
    name: 'Premium Dates Box',
    image: '/images/flash-sales/flash-dates.png',
    originalPrice: 12000,
    salePrice: 7500,
    discount: 38,
    endsIn: '2h 15m',
    claimed: 72,
  },
  {
    id: 2,
    name: 'Iftar Family Bundle',
    image: '/images/flash-sales/flash-iftar-bundle.png',
    originalPrice: 18000,
    salePrice: 11000,
    discount: 39,
    endsIn: '1h 45m',
    claimed: 58,
  },
  {
    id: 3,
    name: 'Zobo & Kunu Pack',
    image: '/images/flash-sales/flash-zobo-kunu.png',
    originalPrice: 5000,
    salePrice: 2800,
    discount: 44,
    endsIn: '3h 30m',
    claimed: 85,
  },
];

// Loyalty Data
export const loyaltyData = {
  tier: 'Gold Member',
  points: 4250,
  nextTierPoints: 7500,
  tierProgress: 57,
  benefits: [
    'Free delivery on orders above ₦5,000',
    'Priority Iftar delivery slots',
    '5% cashback on group buys',
    'Early access to flash sales',
  ],
};

// Gift Card Templates
export const giftCardTemplates = [
  { id: 1, name: 'Crescent Grace', icon: 'mosque', color: 'from-[#064e3b] to-[#0a3d2e]', image: '/images/gift-cards/gc-crescent.png' },
  { id: 2, name: 'Midnight over Abuja', icon: 'dark_mode', color: 'from-[#1e3a5f] to-[#0c1929]', image: '/images/gift-cards/gc-midnight.png' },
  { id: 3, name: 'Traditional Lanterns', icon: 'celebration', color: 'from-[#7c2d12] to-[#431407]', image: '/images/gift-cards/gc-lanterns.png' },
  { id: 4, name: 'Royal Gold', icon: 'workspace_premium', color: 'from-[#4a1d6e] to-[#2d0a4e]', image: '/images/gift-cards/gc-royal.png' },
  { id: 5, name: 'Emerald Heritage', icon: 'nature', color: 'from-[#14532d] to-[#052e16]', image: '/images/gift-cards/gc-emerald.png' },
  { id: 6, name: 'Marble Elegance', icon: 'auto_awesome', color: 'from-[#374151] to-[#1f2937]', image: '/images/gift-cards/gc-marble.png' },
];

// Gift Card Moods
export const giftCardMoods = [
  { id: 'formal', name: 'Formal', icon: 'business_center' },
  { id: 'family', name: 'Family', icon: 'family_restroom' },
  { id: 'friends', name: 'Friends', icon: 'waving_hand' },
];

// Gift Card Blessings
export const giftCardBlessings = [
  'May Allah accept your fasts and prayers this Ramadan. Ramadan Mubarak!',
  'Wishing you a blessed Ramadan filled with peace, joy, and good health.',
  'May this holy month bring you closer to Allah and fill your heart with gratitude.',
];

// Gift Card Amount Presets
export const giftCardAmountPresets = [5000, 10000, 25000, 50000, 75000, 100000];

// Charity Items
export const charityItems = [
  { id: 1, name: 'Feed the Fasting', icon: 'volunteer_activism', description: 'Sponsor an Iftar meal', amount: 2500, mealsProvided: 1 },
  { id: 2, name: 'Zakat Calculator', icon: 'calculate', description: 'Calculate your Zakat', amount: 0, mealsProvided: 0 },
  { id: 3, name: 'Mosque Fund', icon: 'mosque', description: 'Support local mosques', amount: 5000, mealsProvided: 2 },
  { id: 4, name: 'Orphan Care', icon: 'child_care', description: 'Help orphaned children', amount: 3000, mealsProvided: 1 },
  { id: 5, name: 'Water Project', icon: 'water_drop', description: 'Clean water for all', amount: 10000, mealsProvided: 5 },
  { id: 6, name: 'Education Fund', icon: 'school', description: 'Support Islamic education', amount: 7500, mealsProvided: 3 },
];

// Charity Orphanages
export const charityOrphanages = [
  { id: 1, name: 'Al-Huda Orphanage', location: 'Ikeja, Lagos', progress: 72, goal: 500000, raised: 360000, mealsServed: 144 },
  { id: 2, name: 'Rahmatul Lil Alameen', location: 'Surulere, Lagos', progress: 45, goal: 300000, raised: 135000, mealsServed: 90 },
  { id: 3, name: 'Muslim Care Foundation', location: 'Yaba, Lagos', progress: 88, goal: 750000, raised: 660000, mealsServed: 220 },
];

// Mosques
export const mosques = [
  { id: 1, name: 'Lekki Central Mosque', address: '4 Admiralty Way, Lekki', distance: '0.8 km', iftarAvailable: true, jummah: true, sadaqah: true, capacity: 'Large', prayerTimes: { fajr: '5:23 AM', dhuhr: '12:45 PM', asr: '4:10 PM', maghrib: '6:45 PM', isha: '8:05 PM' } },
  { id: 2, name: 'Ikoyi Muslim Community', address: '15 Awolowo Rd, Ikoyi', distance: '2.3 km', iftarAvailable: true, jummah: true, sadaqah: false, capacity: 'Medium', prayerTimes: { fajr: '5:24 AM', dhuhr: '12:46 PM', asr: '4:11 PM', maghrib: '6:46 PM', isha: '8:06 PM' } },
  { id: 3, name: 'Victoria Island Mosque', address: '8 Akin Adesola St', distance: '3.1 km', iftarAvailable: false, jummah: true, sadaqah: true, capacity: 'Small', prayerTimes: { fajr: '5:22 AM', dhuhr: '12:44 PM', asr: '4:09 PM', maghrib: '6:44 PM', isha: '8:04 PM' } },
];

// Prayer times data
export const prayerTimes = [
  { name: 'Fajr', time: '5:23 AM', icon: 'dark_mode' },
  { name: 'Dhuhr', time: '12:45 PM', icon: 'light_mode' },
  { name: 'Asr', time: '4:10 PM', icon: 'wb_twilight' },
  { name: 'Maghrib', time: '6:45 PM', icon: 'nights_stay' },
  { name: 'Isha', time: '8:05 PM', icon: 'dark_mode' },
];

// All Products (combined for search and product detail)
export const allProducts = [
  {
    id: 100,
    name: 'The Ultimate Ramadan Box',
    description: 'Curated Iftar & Sahur essentials box filled with premium rice, cooking oil, dates, fruits, and spices to keep you and your family energized throughout the blessed month.',
    originalPrice: 25000,
    salePrice: 17500,
    category: 'bundles',
    rating: 4.9,
    reviews: 234,
    deliveryTime: '25-35 min',
    inStock: true,
    image: '/images/products/ramadan-box-1.png',
    images: [
      '/images/products/ramadan-box-1.png',
      '/images/products/ramadan-box-2.png',
      '/images/products/ramadan-box-3.png',
      '/images/products/ramadan-box-4.png',
    ],
    contents: '12 Premium Items',
  },
  ...trendingMeals.map(meal => ({
    id: meal.id,
    name: meal.name,
    description: meal.description,
    price: meal.price,
    category: meal.category?.toLowerCase() || 'meals',
    rating: meal.rating,
    reviews: meal.reviews,
    deliveryTime: meal.deliveryTime,
    inStock: true,
    image: meal.image,
    images: [meal.image],
  })),
  ...flashSales.map(sale => ({
    id: sale.id + 200,
    name: sale.name,
    description: `Limited time offer - ${sale.discount}% off! Don't miss this flash sale.`,
    originalPrice: sale.originalPrice,
    salePrice: sale.salePrice,
    category: 'flash-sale',
    rating: 4.7,
    reviews: 98,
    deliveryTime: '20-30 min',
    inStock: true,
    image: sale.image,
    images: [sale.image],
  })),
  // Ramadan Box Bundles
  {
    id: 101,
    name: 'Mini Iftar Box',
    description: 'Perfect for 1-2 people. Includes rice, chicken, dates, and zobo drink.',
    originalPrice: 12000,
    salePrice: 8500,
    category: 'bundles',
    rating: 4.6,
    reviews: 145,
    deliveryTime: '20-30 min',
    inStock: true,
    image: '/images/products/ramadan-box-2.png',
    images: ['/images/products/ramadan-box-2.png'],
    contents: '6 Items',
  },
  {
    id: 102,
    name: 'Family Size Ramadan Box',
    description: 'Feed the whole family with this generous bundle of iftar essentials.',
    originalPrice: 45000,
    salePrice: 32000,
    category: 'bundles',
    rating: 4.8,
    reviews: 189,
    deliveryTime: '30-40 min',
    inStock: true,
    image: '/images/products/ramadan-box-3.png',
    images: ['/images/products/ramadan-box-3.png'],
    contents: '20 Premium Items',
  },
  {
    id: 103,
    name: 'Sadaqah Charity Box',
    description: 'Sponsor an iftar meal for those in need. 100% goes to feeding the fasting.',
    price: 5000,
    category: 'charity',
    rating: 5.0,
    reviews: 312,
    deliveryTime: 'Immediate',
    inStock: true,
    image: '/images/products/ramadan-box-4.png',
    images: ['/images/products/ramadan-box-4.png'],
    contents: 'Feeds 2 People',
  },
  // Bulk Items
  {
    id: 301,
    name: '50kg Bag of Rice',
    description: 'Premium long grain rice. Perfect for bulk ordering and group buy.',
    price: 45000,
    category: 'groceries',
    rating: 4.5,
    reviews: 67,
    deliveryTime: '1-2 days',
    inStock: true,
    image: '/images/categories/cat-groceries.png',
    images: ['/images/categories/cat-groceries.png'],
  },
  {
    id: 302,
    name: '25L Premium Cooking Oil',
    description: 'High quality vegetable oil for all your cooking needs.',
    price: 28000,
    category: 'groceries',
    rating: 4.4,
    reviews: 45,
    deliveryTime: '1-2 days',
    inStock: true,
    image: '/images/categories/cat-groceries.png',
    images: ['/images/categories/cat-groceries.png'],
  },
];

// Popular search terms
export const popularSearches = ['Jollof Rice', 'Dates', 'Iftar Box', 'Sahur', 'Zobo', 'Suya', 'Ramadan Bundle', 'Fruits'];

// Group Buy Deals
export const groupBuyDeals = [
  {
    id: 1,
    name: 'Whole Cow Split',
    description: 'Premium cow, freshly slaughtered. Split with your neighbors and save big!',
    image: '/images/meals/meal-suya.png',
    originalPrice: 350000,
    salePrice: 245000,
    perPersonPrice: 17500,
    totalSlots: 14,
    filledSlots: 9,
    guaranteedDelivery: 'Friday, Mar 15',
    category: 'Livestock',
  },
  {
    id: 2,
    name: '50kg Rice Bulk Split',
    description: 'Premium long grain rice. 14 people, each gets ~3.5kg.',
    image: '/images/categories/cat-groceries.png',
    originalPrice: 45000,
    salePrice: 32000,
    perPersonPrice: 2286,
    totalSlots: 14,
    filledSlots: 11,
    guaranteedDelivery: 'Thursday, Mar 14',
    category: 'Grains',
  },
  {
    id: 3,
    name: 'Cooking Oil 25L Split',
    description: 'Premium vegetable oil. Each person gets ~1.8L.',
    image: '/images/categories/cat-groceries.png',
    originalPrice: 28000,
    salePrice: 20000,
    perPersonPrice: 1429,
    totalSlots: 14,
    filledSlots: 6,
    guaranteedDelivery: 'Saturday, Mar 16',
    category: 'Oils',
  },
  {
    id: 4,
    name: 'Dates Premium 10kg Split',
    description: 'Medjool dates, direct from Saudi. Each gets ~700g.',
    image: '/images/categories/cat-dates.png',
    originalPrice: 35000,
    salePrice: 25000,
    perPersonPrice: 1786,
    totalSlots: 14,
    filledSlots: 4,
    guaranteedDelivery: 'Wednesday, Mar 13',
    category: 'Dates',
  },
];

// Party & Bulk Categories
export const partyCategories = [
  { id: 'all', name: 'All' },
  { id: 'livestock', name: 'Livestock' },
  { id: 'grains', name: 'Grains' },
  { id: 'drinks', name: 'Drinks' },
  { id: 'party-packs', name: 'Party Packs' },
];

// Recipes
export const recipes = [
  {
    id: 1,
    name: 'Quick Asaro (Yam Porridge)',
    category: '15-Min Sahur',
    image: '/images/meals/meal-jollof.png',
    prepTime: '15 min',
    servings: 4,
    difficulty: 'Easy',
    ingredients: [
      { name: 'Yam (1 medium tuber)', productId: null, price: 2500 },
      { name: 'Palm Oil (2 cooking spoons)', productId: 302, price: 500 },
      { name: 'Crayfish (2 tbsp)', productId: null, price: 300 },
      { name: 'Smoked Fish', productId: null, price: 800 },
      { name: 'Seasoning cubes', productId: null, price: 200 },
    ],
    steps: [
      'Peel and cut yam into medium chunks',
      'Boil yam in salted water until slightly soft',
      'Add palm oil, crayfish, and smoked fish',
      'Mash slightly and stir. Add seasoning to taste',
      'Simmer for 5 minutes and serve hot',
    ],
  },
  {
    id: 2,
    name: 'Traditional Jollof Rice',
    category: 'Traditional Iftar',
    image: '/images/meals/meal-jollof.png',
    prepTime: '45 min',
    servings: 6,
    difficulty: 'Medium',
    ingredients: [
      { name: 'Long Grain Rice (3 cups)', productId: 301, price: 3000 },
      { name: 'Tomato Paste (1 tin)', productId: null, price: 400 },
      { name: 'Scotch Bonnet Peppers (5)', productId: null, price: 200 },
      { name: 'Vegetable Oil', productId: 302, price: 500 },
      { name: 'Chicken (1 whole)', productId: null, price: 5000 },
    ],
    steps: [
      'Blend tomatoes, peppers, and onions into a smooth paste',
      'Fry the tomato paste in oil for 15 minutes until reduced',
      'Season with curry, thyme, bay leaves, and salt',
      'Add washed rice and stock, cover tightly',
      'Cook on low heat for 25 minutes until rice is done',
    ],
  },
  {
    id: 3,
    name: 'Kunun Gyada (Groundnut Drink)',
    category: 'Drinks',
    image: '/images/meals/meal-smoothie.png',
    prepTime: '20 min',
    servings: 4,
    difficulty: 'Easy',
    ingredients: [
      { name: 'Groundnut Paste (1 cup)', productId: null, price: 600 },
      { name: 'Rice Flour (1/2 cup)', productId: null, price: 300 },
      { name: 'Sugar to taste', productId: null, price: 100 },
      { name: 'Ginger (1 inch)', productId: null, price: 50 },
    ],
    steps: [
      'Soak groundnut paste in warm water for 10 minutes',
      'Blend with ginger until smooth and strain',
      'Mix rice flour with cold water, then add to the groundnut milk',
      'Heat gently, stirring continuously until it thickens slightly',
      'Sweeten to taste. Serve warm or chilled',
    ],
  },
  {
    id: 4,
    name: 'Moi Moi (Steamed Bean Pudding)',
    category: 'Traditional Iftar',
    image: '/images/meals/meal-moimoi.png',
    prepTime: '60 min',
    servings: 6,
    difficulty: 'Medium',
    ingredients: [
      { name: 'Beans (2 cups)', productId: null, price: 800 },
      { name: 'Red Bell Pepper (2)', productId: null, price: 300 },
      { name: 'Onions (2 medium)', productId: null, price: 150 },
      { name: 'Boiled Eggs (6)', productId: null, price: 600 },
      { name: 'Palm Oil (4 tbsp)', productId: 302, price: 400 },
    ],
    steps: [
      'Soak beans for 30 minutes and peel off the skin',
      'Blend beans with peppers and onions into a smooth paste',
      'Add palm oil, seasoning, and salt. Mix well',
      'Pour into foil bags or banana leaves, add boiled egg to each',
      'Steam for 45 minutes until set. Serve hot or cold',
    ],
  },
];

// Recipe categories
export const recipeCategories = [
  { id: 'all', name: 'All' },
  { id: '15-Min Sahur', name: '15-Min Sahur' },
  { id: 'Traditional Iftar', name: 'Traditional Iftar' },
  { id: 'Healthy Fasting', name: 'Healthy Fasting' },
  { id: 'Drinks', name: 'Drinks' },
];

// Loyalty Rewards
export const loyaltyRewards = [
  { id: 1, name: 'Donate Iftar Meal', points: 2500, icon: 'volunteer_activism', category: 'Ramadan', description: 'Sponsor an iftar meal for someone in need' },
  { id: 2, name: 'Free Sahur Meal', points: 1500, icon: 'free_breakfast', category: 'Meals', description: 'Get a free sahur meal delivered' },
  { id: 3, name: '₦2,000 Gift Voucher', points: 2000, icon: 'card_giftcard', category: 'Swift', description: '₦2,000 off your next order' },
  { id: 4, name: 'Free Delivery Pass', points: 1000, icon: 'local_shipping', category: 'Swift', description: 'Free delivery on your next 3 orders' },
  { id: 5, name: '15% Off Flash Sale', points: 3000, icon: 'flash_on', category: 'Ramadan', description: 'Extra 15% off any flash sale item' },
  { id: 6, name: 'Ramadan Box Upgrade', points: 5000, icon: 'upgrade', category: 'Ramadan', description: 'Free upgrade to Premium Ramadan Box' },
];

// Loyalty Tiers
export const loyaltyTiers = [
  { id: 'bronze', name: 'Bronze', minPoints: 0, maxPoints: 2000, color: '#CD7F32', benefits: ['Standard delivery', 'Basic rewards access', 'Birthday bonus 100 points'] },
  { id: 'silver', name: 'Silver', minPoints: 2000, maxPoints: 5000, color: '#C0C0C0', benefits: ['Free delivery ₦3K+', '5% cashback group buy', 'Early flash sale access', 'Birthday bonus 250 points'] },
  { id: 'gold', name: 'Gold', minPoints: 5000, maxPoints: 10000, color: '#F5C451', benefits: ['Free delivery ₦5K+', 'Priority iftar slots', '5% cashback group buy', 'Early flash sale access', 'Birthday bonus 500 points', 'Exclusive gold deals'] },
  { id: 'platinum', name: 'Platinum', minPoints: 10000, maxPoints: 999999, color: '#E5E4E2', benefits: ['Unlimited free delivery', '24/7 priority support', 'Bulk order concierge', 'First access to flash sales', '15% logistics discount', 'Birthday bonus 1000 points', 'Platinum-only deals', 'Personal account manager'] },
];

// Point Earning Activities
export const pointEarningActivities = [
  { id: 1, activity: 'Place an order', points: '10 pts per ₦1K', icon: 'shopping_cart' },
  { id: 2, activity: 'Join a Group Buy', points: '50 pts', icon: 'groups' },
  { id: 3, activity: 'Charity donation', points: '2x points', icon: 'volunteer_activism' },
  { id: 4, activity: 'Daily login streak', points: '25-50 pts', icon: 'event_available' },
  { id: 5, activity: 'Refer a friend', points: '100 pts', icon: 'person_add' },
  { id: 6, activity: 'Write a review', points: '30 pts', icon: 'rate_review' },
  { id: 7, activity: 'Share flash sale', points: '15 pts', icon: 'share' },
  { id: 8, activity: 'Complete Ramadan challenges', points: '200 pts', icon: 'emoji_events' },
];

// BNPL Plans
export const bnplPlans = [
  { months: 2, label: '2 Months', interestRate: 0, ramadanOffer: true },
  { months: 4, label: '4 Months', interestRate: 2.5, ramadanOffer: false },
  { months: 6, label: '6 Months', interestRate: 5, ramadanOffer: false },
];

// Address Book
export const addressBook = [
  { id: 1, label: 'Home', address: '12 Admiralty Way, Lekki Phase 1, Lagos', isDefault: true },
  { id: 2, label: 'Office', address: '8 Marina Street, Lagos Island', isDefault: false },
];

// Community Forum Posts
export const communityPosts = [
  {
    id: 1,
    author: 'Amina B.',
    avatar: 'A',
    time: '2h ago',
    content: 'Just tried the Jollof Rice from The Food Hub - absolutely amazing! Perfect for iftar. Highly recommend! 🍚',
    likes: 24,
    replies: 8,
    category: 'Reviews',
  },
  {
    id: 2,
    author: 'Ibrahim K.',
    avatar: 'I',
    time: '4h ago',
    content: 'Who wants to join a group buy for the 50kg rice split? We need 3 more people in Lekki area!',
    likes: 15,
    replies: 12,
    category: 'Group Buy',
  },
  {
    id: 3,
    author: 'Fatima M.',
    avatar: 'F',
    time: '6h ago',
    content: 'Alhamdulillah, just donated iftar meals through the app. May Allah accept it from all of us. 🤲',
    likes: 42,
    replies: 5,
    category: 'Charity',
  },
  {
    id: 4,
    author: 'Yusuf A.',
    avatar: 'Y',
    time: '1d ago',
    content: 'Sahur meal suggestions? Looking for something light but filling. The overnight oats are great but want variety.',
    likes: 18,
    replies: 22,
    category: 'Recipes',
  },
];

// Notifications mock
export const notificationsMock = [
  { id: 1, title: 'Order In Transit', message: 'Your Jollof Rice & Chicken is on the way!', time: '5 min ago', read: false, type: 'order' },
  { id: 2, title: 'Flash Sale Alert! 🎉', message: 'Premium Dates Box - 38% off! Ends in 2 hours', time: '15 min ago', read: false, type: 'promo' },
  { id: 3, title: 'Iftar Reminder', message: 'Maghrib is in 45 minutes. Time to prepare!', time: '1h ago', read: false, type: 'reminder' },
  { id: 4, title: 'Reward Earned 🎁', message: 'You earned 50 Hasanat Points from your daily login!', time: '3h ago', read: true, type: 'reward' },
  { id: 5, title: 'Group Buy Update', message: 'The Whole Cow Split is 60% filled! 5 slots left', time: '5h ago', read: true, type: 'social' },
  { id: 6, title: 'New Recipe Available', message: 'Try the Quick Asaro recipe - perfect for Sahur!', time: '1d ago', read: true, type: 'promo' },
];

// Delivery Locations (for map)
export const deliveryLocations = [
  { id: 1, name: 'Home', address: '12 Admiralty Way, Lekki Phase 1', lat: 6.4281, lng: 3.4217 },
  { id: 2, name: 'Office', address: '8 Marina Street, Lagos Island', lat: 6.4500, lng: 3.4000 },
  { id: 3, name: "Partner's Place", address: '5 Akin Adesola, Victoria Island', lat: 6.4315, lng: 3.4150 },
];

// Payment Methods
export const paymentMethods = [
  { id: 'card', name: 'Debit/Credit Card', icon: 'credit_card', providers: ['Paystack', 'Flutterwave'] },
  { id: 'transfer', name: 'Bank Transfer', icon: 'account_balance', providers: ['GTBank', 'Access Bank'] },
  { id: 'bnpl', name: 'Pay Small-Small (BNPL)', icon: 'payments', providers: ['OPay', 'Moniepoint'] },
  { id: 'cash', name: 'Cash on Delivery', icon: 'money', providers: [] },
];

// Eco Impact Data
export const ecoImpactData = {
  co2Saved: '8.2kg',
  ecoOrders: 15,
  amountDonated: 3000,
  treesEquivalent: 2,
  plasticAvoided: '3.5kg',
  waterSaved: '120L',
};

// Ramadan Daily Dua
export const dailyDuas = [
  'O Allah, make the month of Ramadan a means of forgiveness for us.',
  'O Allah, accept our fasting and prayers in this blessed month.',
  'O Allah, grant us the strength to worship You throughout Ramadan.',
  'O Allah, make the Quran a companion in our lives this Ramadan.',
  'O Allah, bless us with good health and sustenance this Ramadan.',
];

// ──────────── RIDER DATA ────────────

export const riderDeliveryRequests = [
  {
    id: 'DEL-8829',
    customer: 'Ahmed K.',
    address: '12 Admiralty Way, Lekki Phase 1',
    items: '1x Jollof Rice & Lamb Platter, 2x Zobo',
    amount: 8500,
    deliveryFee: 1200,
    iftarDeadline: '6:42 PM',
    minutesUntilIftar: 22,
    distance: '3.2 km',
    pickupAddress: 'Suya Central, Victoria Island',
    priority: 'iftar' as const,
  },
  {
    id: 'DEL-8831',
    customer: 'Fatima B.',
    address: '8 Akin Adesola St, Victoria Island',
    items: 'Large Suya Sampler, 4x Masa Cakes',
    amount: 6700,
    deliveryFee: 1000,
    iftarDeadline: '6:45 PM',
    minutesUntilIftar: 25,
    distance: '2.1 km',
    pickupAddress: 'The Food Hub, Ikoyi',
    priority: 'iftar' as const,
  },
  {
    id: 'DEL-8835',
    customer: 'Yusuf M.',
    address: '5 Awolowo Rd, Ikoyi',
    items: '2x Date Smoothie, 1x Moi Moi',
    amount: 5200,
    deliveryFee: 900,
    iftarDeadline: '7:00 PM',
    minutesUntilIftar: 40,
    distance: '4.5 km',
    pickupAddress: 'Lagos Fresh Mart, Surulere',
    priority: 'standard' as const,
  },
];

export const riderActiveDeliveries = [
  {
    id: 'DEL-8825',
    customer: 'Amina O.',
    address: '15 Bourdillon Rd, Ikoyi',
    items: 'Ramadan Box Premium',
    amount: 17500,
    status: 'picked_up' as const,
    progress: 65,
    eta: '8 min',
    customerPhone: '+234 801 234 5678',
  },
];

export const riderEarningsBreakdown = {
  today: 24500,
  basePay: 15000,
  iftarBonuses: 6500,
  tips: 3000,
  completedDeliveries: 12,
  gratefulCustomers: 9,
  onTimeRate: 98,
  avgRating: 4.9,
  hourlyData: [
    { hour: '10am', amount: 2000, pct: 17 },
    { hour: '1pm', amount: 1500, pct: 12 },
    { hour: '4pm', amount: 4000, pct: 33 },
    { hour: 'Iftar', amount: 12000, pct: 100 },
    { hour: '10pm', amount: 3000, pct: 25 },
  ],
};

export const riderPerformanceMetrics = {
  completionRate: 99.2,
  completionTrend: '+2.1%',
  rating: 4.98,
  ratingTrend: '+0.05',
  compliments: 128,
  complimentsTrend: '+12',
  incentiveProgress: 85,
  incentiveGoal: '₦15,000 Ramadan Bonus',
  incentiveRemaining: '12 more deliveries',
  topCompliments: [
    { icon: 'speed', title: 'Super Fast Delivery', quote: 'Arrived just in time for Iftar! Truly appreciate the speed.' },
    { icon: 'chat_bubble', title: 'Very Polite', quote: 'Excellent service and very respectful attitude. 5 stars!' },
    { icon: 'restaurant_menu', title: 'Careful Handling', quote: 'Food arrived hot and perfectly packaged. Great care!' },
  ],
};

// ──────────── VENDOR DATA ────────────

export const vendorIncomingOrders = [
  {
    id: 'RAM-4829',
    customer: 'Ahmed K.',
    area: 'Lekki Phase 1',
    items: [{ name: 'Jollof Rice & Lamb Platter', qty: 1, price: 6500 }, { name: 'Zobo Drink', qty: 2, price: 2000 }],
    total: 8500,
    minutesUntilIftar: 22,
    status: 'incoming' as const,
    image: '/images/meals/meal-jollof.png',
  },
  {
    id: 'RAM-4831',
    customer: 'Fatima B.',
    area: 'Victoria Island',
    items: [{ name: 'Large Suya Sampler', qty: 1, price: 4200 }, { name: 'Masa Cakes', qty: 4, price: 2500 }],
    total: 6700,
    minutesUntilIftar: 25,
    status: 'incoming' as const,
    image: '/images/meals/meal-suya.png',
  },
  {
    id: 'RAM-4833',
    customer: 'Bolaji A.',
    area: 'Ikoyi',
    items: [{ name: 'Ramadan Box Premium', qty: 1, price: 17500 }],
    total: 17500,
    minutesUntilIftar: 35,
    status: 'incoming' as const,
    image: '/images/products/ramadan-box-1.png',
  },
];

export const vendorProcessingOrders = [
  {
    id: 'RAM-4825',
    customer: 'Amina O.',
    area: 'Ikoyi',
    items: [{ name: 'Suya Platter (Family)', qty: 1, price: 8000 }],
    total: 8000,
    startedAt: '6:10 PM',
    estimatedReady: '6:30 PM',
    status: 'processing' as const,
  },
];

export const vendorTransactions = [
  { id: 'TXN-001', reference: 'Order #RAM-4829', type: 'credit' as const, amount: 12500, status: 'completed' as const, date: 'Today, 2:45 PM' },
  { id: 'TXN-002', reference: 'Payout to GT Bank', type: 'debit' as const, amount: 50000, status: 'processing' as const, date: 'Yesterday, 10:15 AM' },
  { id: 'TXN-003', reference: 'Order #RAM-4811', type: 'credit' as const, amount: 8200, status: 'completed' as const, date: 'Mar 22, 2024' },
  { id: 'TXN-004', reference: 'Refunded Order #RAM-4702', type: 'refund' as const, amount: 4500, status: 'refunded' as const, date: 'Mar 21, 2024' },
  { id: 'TXN-005', reference: 'Order #RAM-4798', type: 'credit' as const, amount: 15800, status: 'completed' as const, date: 'Mar 21, 2024' },
];

export const vendorMenuItems = [
  { id: 1, name: 'Jollof Rice & Chicken', price: 4500, category: 'Iftar Meals', available: true, orders: 234, image: '/images/meals/meal-jollof.png' },
  { id: 2, name: 'Suya Platter', price: 3200, category: 'Grills', available: true, orders: 203, image: '/images/meals/meal-suya.png' },
  { id: 3, name: 'Moi Moi & Pap', price: 2800, category: 'Sahur', available: true, orders: 156, image: '/images/meals/meal-moimoi.png' },
  { id: 4, name: 'Date Smoothie', price: 1800, category: 'Drinks', available: false, orders: 178, image: '/images/meals/meal-smoothie.png' },
  { id: 5, name: 'Ramadan Box Premium', price: 17500, category: 'Bundles', available: true, orders: 312, image: '/images/products/ramadan-box-1.png' },
  { id: 6, name: 'Zobo Drink (1L)', price: 1000, category: 'Drinks', available: true, orders: 89, image: '/images/meals/meal-smoothie.png' },
];

export const vendorSalesInsights = {
  todayRevenue: 87500,
  todayOrders: 24,
  avgOrderValue: 3646,
  ramadanRevenue: 1280000,
  ramadanOrders: 847,
  topSellingItem: 'Ramadan Box Premium',
  peakHour: '5:30 PM - 7:00 PM',
  customerRetention: 78,
  dailyTrend: [
    { day: 'Mon', revenue: 65000 },
    { day: 'Tue', revenue: 72000 },
    { day: 'Wed', revenue: 87500 },
    { day: 'Thu', revenue: 91000 },
    { day: 'Fri', revenue: 105000 },
    { day: 'Sat', revenue: 98000 },
    { day: 'Sun', revenue: 82000 },
  ],
};
