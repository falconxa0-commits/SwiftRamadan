import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { captureException } from '@/lib/monitoring/sentry';

const searchableItems = [
  // Products
  { id: 100, name: 'The Ultimate Ramadan Box', type: 'product', category: 'bundles', price: 17500, image: '/images/products/ramadan-box-1.png' },
  { id: 1, name: 'Jollof Rice & Chicken', type: 'product', category: 'Iftar Meals', price: 4500, image: '/images/meals/meal-jollof.png' },
  { id: 2, name: 'Suya Platter', type: 'product', category: 'Iftar Meals', price: 3200, image: '/images/meals/meal-suya.png' },
  { id: 3, name: 'Moi Moi & Pap', type: 'product', category: 'Sahur', price: 2800, image: '/images/meals/meal-moimoi.png' },
  { id: 4, name: 'Date & Nut Smoothie', type: 'product', category: 'Drinks', price: 1800, image: '/images/meals/meal-smoothie.png' },
  { id: 201, name: 'Premium Dates Box', type: 'product', category: 'flash-sale', price: 7500, image: '/images/flash-sales/flash-dates.png' },
  { id: 202, name: 'Iftar Family Bundle', type: 'product', category: 'flash-sale', price: 11000, image: '/images/flash-sales/flash-iftar-bundle.png' },
  { id: 203, name: 'Zobo & Kunu Pack', type: 'product', category: 'flash-sale', price: 2800, image: '/images/flash-sales/flash-zobo-kunu.png' },
  { id: 101, name: 'Mini Iftar Box', type: 'product', category: 'bundles', price: 8500, image: '/images/products/ramadan-box-2.png' },
  { id: 102, name: 'Family Size Ramadan Box', type: 'product', category: 'bundles', price: 32000, image: '/images/products/ramadan-box-3.png' },
  { id: 103, name: 'Sadaqah Charity Box', type: 'product', category: 'charity', price: 5000, image: '/images/products/ramadan-box-4.png' },
  { id: 301, name: '50kg Bag of Rice', type: 'product', category: 'groceries', price: 45000, image: '/images/categories/cat-groceries.png' },
  { id: 302, name: '25L Premium Cooking Oil', type: 'product', category: 'groceries', price: 28000, image: '/images/categories/cat-groceries.png' },

  // Categories
  { id: 901, name: 'Iftar Meals', type: 'category', category: 'Iftar Meals', image: '/images/categories/cat-iftar.png' },
  { id: 902, name: 'Sahur', type: 'category', category: 'Sahur', image: '/images/categories/cat-sahur.png' },
  { id: 903, name: 'Dates', type: 'category', category: 'Dates', image: '/images/categories/cat-dates.png' },
  { id: 904, name: 'Drinks', type: 'category', category: 'Drinks', image: '/images/categories/cat-drinks.png' },
  { id: 905, name: 'Snacks', type: 'category', category: 'Snacks', image: '/images/categories/cat-snacks.png' },
  { id: 906, name: 'Fruits', type: 'category', category: 'Fruits', image: '/images/categories/cat-fruits.png' },
  { id: 907, name: 'Groceries', type: 'category', category: 'Groceries', image: '/images/categories/cat-groceries.png' },

  // Retailers
  { id: 801, name: 'The Food Hub', type: 'retailer', category: 'Iftar Meals', image: '/images/retailers/retailer-foodhub.png' },
  { id: 802, name: 'Lagos Fresh Mart', type: 'retailer', category: 'Groceries', image: '/images/retailers/retailer-freshmart.png' },
  { id: 803, name: 'Suya Palace', type: 'retailer', category: 'Grills', image: '/images/retailers/retailer-suyapalace.png' },
  { id: 804, name: 'Green Pharmacy', type: 'retailer', category: 'Pharmacy', image: '/images/retailers/retailer-pharmacy.png' },
];

export async function GET(request: NextRequest) {
  const rateLimited = await checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase().trim();

    if (!query) {
      return NextResponse.json({ results: { products: [], categories: [], retailers: [] }, query: '' });
    }

    const results = searchableItems.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );

    const products = results.filter(r => r.type === 'product');
    const categories = results.filter(r => r.type === 'category');
    const retailers = results.filter(r => r.type === 'retailer');

    return NextResponse.json({
      results: { products, categories, retailers },
      query,
      total: results.length,
    });
  } catch (error) {
    console.error('API error:', error);
    await captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { route: '/api/search' },
    });
    return NextResponse.json(
      { results: { products: [], categories: [], retailers: [] }, query: '', message: 'Search failed' },
      { status: 500 },
    );
  }
}
