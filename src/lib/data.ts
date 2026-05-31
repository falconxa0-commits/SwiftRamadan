// Mock data for SwiftRamadan app

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

// Hero Slides
export const heroSlides = [
  {
    id: 1,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6dMqH1f-0aFHGQvO2x0_7vvCNzBXaBqJmMl1pJ7Pf3XjKqg3cU8rE5vW2nL9oK4fH7gQ1sT3uV6x0Y8bN2kP5mR4cJ7fA',
    title: 'Iftar Special: Jollof Rice & Grilled Chicken',
    subtitle: 'Delivered before Maghrib',
    badge: 'Best Seller',
  },
  {
    id: 2,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhJ_xT8nP1mG0rK4vW2qL5nY8pS1aD3fE6gH9iJ0kM2nO5qR8sU1vX4yZ7wA0bC3dF6gI9jL2oK5nQ8r',
    title: 'Sahur Box: Overnight Oats & Dates',
    subtitle: 'Pre-dawn energy boost',
    badge: 'New',
  },
  {
    id: 3,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCjL2oP5nQ8rT1vX4yZ7wA0bD3eF6gH9iK2mN5oR8sU1vX4yZ7wA0bC3dF6gI9jL2oK5nQ8rT1uW4xY7z',
    title: 'Family Iftar Bundle for 6',
    subtitle: 'Save 30% with group pricing',
    badge: 'Group Buy',
  },
];

// Categories
export const categories = [
  { id: 1, name: 'Iftar Meals', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDd5Q-Iz-Fq7uEuNkHGlcinxW7wZELtwy_IRSWnLlb1qwwcGPTg2_G7awF13kr5I52KHXlPPsI3pY_xy6j1SybFEVqTiOZeNTAJbX2B34Fe', active: true },
  { id: 2, name: 'Sahur', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuE1fXSKuiYobyjy9Zoi3IIe11uiZvo5_ehJm8r2Q1XnPxIJ3OI1n9mk3BJtSvZjqDFrWMm_x9KONVZ43IOkiHMRWJ9Q-N_u5PdLdRZp31i3-ioWbJLOiO2peOFhDrRmi5G7', active: false },
  { id: 3, name: 'Dates', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuF2gYvhGxKFilETsLQuDHTS0XZ7yPSqI92EMm27uldl8SczSgPb78xUST3CjkFC41kRKNKIqWfYWGLyT0wnIzFQfeeh0vg0GMg6LL8', active: false },
  { id: 4, name: 'Drinks', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuG3hJ0kM2nO5qR8sU1vX4yZ7wA0bD3eF6gH9iK2mN5oR8sU1vX4yZ7wA0bC3dF6gI9jL2oK5nQ8rT1uW4xY7zB0cE3f', active: false },
  { id: 5, name: 'Snacks', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuH4iK2mN5oR8sU1vX4yZ7wA0bD3eF6gH9iJ0kM2nO5qR8sU1vX4yZ7wA0bC3dF6gI9jL2oK5nQ8rT1vW4xY7z', active: false },
  { id: 6, name: 'Fruits', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuI5jL0kM2nO5qR8sU1vX4yZ7wA0bD3eF6gH9iK2mN5oR8sU1vX4yZ7wA0bC3dF6gI9jL2oK5nQ8rT1uW4xY7z', active: false },
  { id: 7, name: 'Groceries', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuJ6kM2nO5qR8sU1vX4yZ7wA0bD3eF6gH9iK2mN5oR8sU1vX4yZ7wA0bC3dF6gI9jL2oK5nQ8rT1uW4xY7z', active: false },
];

// Ramadan Box
export const ramadanBox = {
  title: 'The Ultimate Ramadan Box',
  originalPrice: 25000,
  salePrice: 17500,
  images: [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuK7nO5qR8sU1vX4yZ7wA0bD3eF6gH9iK2mN5oR8sU1vX4yZ7wA0bC3dF6gI9jL2oK5nQ8rT1uW4xY7z',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuL8oR8sU1vX4yZ7wA0bD3eF6gH9iK2mN5oR8sU1vX4yZ7wA0bC3dF6gI9jL2oK5nQ8rT1uW4xY7zA0bD3e',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuM9pR8sU1vX4yZ7wA0bD3eF6gH9iK2mN5oR8sU1vX4yZ7wA0bC3dF6gI9jL2oK5nQ8rT1uW4xY7zB1cE4f',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuN0qR8sU1vX4yZ7wA0bD3eF6gH9iK2mN5oR8sU1vX4yZ7wA0bC3dF6gI9jL2oK5nQ8rT1uW4xY7zC2dF5g',
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
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuO1rS8sU1vX4yZ7wA0bD3eF6gH9iK2mN5oR8sU1vX4yZ7wA0bC3dF6gI9jL2oK5nQ8rT1uW4xY7z',
    deliveryTime: '25 min',
    rating: 4.9,
  },
  {
    id: 2,
    name: 'Suya Platter',
    description: 'Spicy beef suya with fresh onions and tomatoes',
    price: 3200,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuP2sU1vX4yZ7wA0bD3eF6gH9iK2mN5oR8sU1vX4yZ7wA0bC3dF6gI9jL2oK5nQ8rT1uW4xY7zA0bD3e',
    deliveryTime: '30 min',
    rating: 4.8,
  },
  {
    id: 3,
    name: 'Moi Moi & Pap',
    description: 'Steamed bean pudding with creamy corn pap',
    price: 2800,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuQ3tU1vX4yZ7wA0bD3eF6gH9iK2mN5oR8sU1vX4yZ7wA0bC3dF6gI9jL2oK5nQ8rT1uW4xY7zB1cE4f',
    deliveryTime: '20 min',
    rating: 4.7,
  },
  {
    id: 4,
    name: 'Date & Nut Smoothie',
    description: 'Energy-packed date smoothie with groundnuts',
    price: 1800,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuR4uV1vX4yZ7wA0bD3eF6gH9iK2mN5oR8sU1vX4yZ7wA0bC3dF6gI9jL2oK5nQ8rT1uW4xY7zC2dF5g',
    deliveryTime: '15 min',
    rating: 4.9,
  },
];

// Category Hub Items
export const categoryHubItems = [
  { id: 1, name: 'Iftar Meals', subtitle: '200+ dishes', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuS5vW1vX4yZ7wA0bD3eF6gH9iK2mN5oR8sU1vX4yZ7wA0bC3dF6gI9jL2oK5nQ8rT1uW4xY7z', badge: 'Popular' },
  { id: 2, name: 'Groceries', subtitle: 'Bulk savings', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuT6wX4yZ7wA0bD3eF6gH9iK2mN5oR8sU1vX4yZ7wA0bC3dF6gI9jL2oK5nQ8rT1uW4xY7zA0bD3e', badge: 'Group Buy' },
  { id: 3, name: 'Pharmacy', subtitle: 'Health essentials', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuU7xY4yZ7wA0bD3eF6gH9iK2mN5oR8sU1vX4yZ7wA0bC3dF6gI9jL2oK5nQ8rT1uW4xY7zB1cE4f', badge: 'Fast' },
  { id: 4, name: 'Office Meals', subtitle: 'Corporate plans', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuV8yZ7wA0bD3eF6gH9iK2mN5oR8sU1vX4yZ7wA0bC3dF6gI9jL2oK5nQ8rT1uW4xY7zC2dF5g', badge: 'New' },
];

// Popular Retailers
export const popularRetailers = [
  { id: 1, name: 'The Food Hub', category: 'Iftar Meals', deliveryTime: '25 min', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuW9zA0bD3eF6gH9iK2mN5oR8sU1vX4yZ7wA0bC3dF6gI9jL2oK5nQ8rT1uW4xY7z' },
  { id: 2, name: 'Lagos Fresh Mart', category: 'Groceries', deliveryTime: '40 min', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuX0aB1cE4fG7hI0jK3mN6oP8qR1sT4uV5wX6yZ7wA0bC3dF6gI9jL2oK5nQ8rT1uW4xY7z' },
  { id: 3, name: 'Suya Palace', category: 'Grills', deliveryTime: '30 min', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuY1bC2dF5gH8iJ0kL3mN6oQ9rS2tU5vW6xY8zA1bD4eG7hI9jK2nO5qR8sU1vX4yZ7w' },
  { id: 4, name: 'Green Pharmacy', category: 'Pharmacy', deliveryTime: '35 min', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuZ2cD3eF6gI9jL2oN5qR8sU1vX4yZ7wA0bC3dF6gI9jL2oK5nQ8rT1uW4xY7zB1cE4f' },
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
  },
  {
    id: 'SWR-2846',
    item: 'Ramadan Box - Premium',
    status: 'Preparing',
    eta: 'Estimated 6:30 PM',
    total: 17500,
    rider: null,
  },
  {
    id: 'SWR-2839',
    item: 'Date Bundle (5kg)',
    status: 'Delivered',
    eta: 'Delivered Mar 12',
    total: 8500,
    rider: null,
  },
  {
    id: 'SWR-2832',
    item: 'Sahur Pack x3',
    status: 'Delivered',
    eta: 'Delivered Mar 11',
    total: 5400,
    rider: null,
  },
];

// Flash Sales
export const flashSales = [
  {
    id: 1,
    name: 'Premium Dates Box',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXua3dF6gI9jL2oK5nQ8rT1uW4xY7zB1cE4fG7hI0jK3mN6oP8qR1sT4uV5wX6yZ7wA0bC3d',
    originalPrice: 12000,
    salePrice: 7500,
    discount: 38,
    endsIn: '2h 15m',
  },
  {
    id: 2,
    name: 'Iftar Family Bundle',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXub4eG7hI0jK3mN6oP8qR1sT4uV5wX6yZ7wA0bC3dF6gI9jL2oK5nQ8rT1uW4xY7zB1cE4f',
    originalPrice: 18000,
    salePrice: 11000,
    discount: 39,
    endsIn: '1h 45m',
  },
  {
    id: 3,
    name: 'Zobo & Kunu Pack',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuc5fH8iJ0kL3mN6oQ9rS2tU5vW6xY8zA1bD4eG7hI9jK2nO5qR8sU1vX4yZ7wA0bC3dF6',
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
