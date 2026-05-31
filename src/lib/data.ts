// Mock data for SwiftRamadan app

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

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
  { id: 1, name: 'The Food Hub', category: 'Iftar Meals', deliveryTime: '25 min', image: '/images/retailers/retailer-foodhub.png' },
  { id: 2, name: 'Lagos Fresh Mart', category: 'Groceries', deliveryTime: '40 min', image: '/images/retailers/retailer-freshmart.png' },
  { id: 3, name: 'Suya Palace', category: 'Grills', deliveryTime: '30 min', image: '/images/retailers/retailer-suyapalace.png' },
  { id: 4, name: 'Green Pharmacy', category: 'Pharmacy', deliveryTime: '35 min', image: '/images/retailers/retailer-pharmacy.png' },
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
  },
  {
    id: 2,
    name: 'Iftar Family Bundle',
    image: '/images/flash-sales/flash-iftar-bundle.png',
    originalPrice: 18000,
    salePrice: 11000,
    discount: 39,
    endsIn: '1h 45m',
  },
  {
    id: 3,
    name: 'Zobo & Kunu Pack',
    image: '/images/flash-sales/flash-zobo-kunu.png',
    originalPrice: 5000,
    salePrice: 2800,
    discount: 44,
    endsIn: '3h 30m',
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
  { id: 1, name: 'Ramadan Kareem', icon: 'mosque', color: 'from-[#064e3b] to-[#0a3d2e]' },
  { id: 2, name: 'Iftar Surprise', icon: 'celebration', color: 'from-[#7c2d12] to-[#431407]' },
  { id: 3, name: 'Family Feast', icon: 'restaurant', color: 'from-[#1e3a5f] to-[#0c1929]' },
  { id: 4, name: 'Sweet Dates', icon: 'favorite', color: 'from-[#4a1d6e] to-[#2d0a4e]' },
];

// Charity Items
export const charityItems = [
  { id: 1, name: 'Feed the Fasting', icon: 'volunteer_activism', description: 'Sponsor an Iftar meal', amount: 2500 },
  { id: 2, name: 'Zakat Calculator', icon: 'calculate', description: 'Calculate your Zakat', amount: 0 },
  { id: 3, name: 'Mosque Fund', icon: 'mosque', description: 'Support local mosques', amount: 5000 },
  { id: 4, name: 'Orphan Care', icon: 'child_care', description: 'Help orphaned children', amount: 3000 },
  { id: 5, name: 'Water Project', icon: 'water_drop', description: 'Clean water for all', amount: 10000 },
  { id: 6, name: 'Education Fund', icon: 'school', description: 'Support Islamic education', amount: 7500 },
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
];

// Popular search terms
export const popularSearches = ['Jollof Rice', 'Dates', 'Iftar Box', 'Sahur', 'Zobo', 'Suya', 'Ramadan Bundle', 'Fruits'];

// Prayer times data
export const prayerTimes = [
  { name: 'Fajr', time: '5:23 AM', icon: 'dark_mode' },
  { name: 'Dhuhr', time: '12:45 PM', icon: 'light_mode' },
  { name: 'Asr', time: '4:10 PM', icon: 'wb_twilight' },
  { name: 'Maghrib', time: '6:45 PM', icon: 'nights_stay' },
  { name: 'Isha', time: '8:05 PM', icon: 'dark_mode' },
];
