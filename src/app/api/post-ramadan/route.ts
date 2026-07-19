import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    eidGreeting: 'Eid Mubarak! 🎉',
    ramadanReview: {
      fastsCompleted: 30,
      mealsOrdered: 42,
      newDishesTried: 8,
      giftsSent: 3,
      totalSpent: 285000,
      favoriteMeal: 'Jollof Rice & Grilled Chicken',
      mostOrderedCategory: 'Iftar Meals',
      longestStreak: 14,
      communityMealsShared: 5,
      prayersLogged: 87,
      charitiesGiven: 3,
      totalHasanatEarned: 2450,
    },
    eidBundles: [
      {
        id: 'eid-1',
        name: 'Eid Celebration Box',
        description: 'Complete festive meal for the whole family',
        price: 35000,
        originalPrice: 45000,
        image: '/images/products/ramadan-box-1.png',
        items: ['Rice Platter (6)', 'Suya Platter', 'Chapman (6)', 'Dates Box', 'Dessert Platter'],
      },
      {
        id: 'eid-2',
        name: 'Eid Gift Hamper',
        description: 'Beautiful gift package for loved ones',
        price: 15000,
        originalPrice: 20000,
        image: '/images/products/ramadan-box-2.png',
        items: ['Premium Dates', 'Arabic Perfume', 'Prayer Beads', 'Gift Card ₦5000'],
      },
      {
        id: 'eid-3',
        name: 'Kids Eid Special',
        description: 'Fun meals and treats for the little ones',
        price: 8000,
        originalPrice: 12000,
        image: '/images/products/ramadan-box-3.png',
        items: ['Mini Pizza (4)', 'Fruit Punch', 'Chocolate Box', 'Party Pack'],
      },
    ],
    confettiColors: ['#10E07A', '#F5C451', '#A78BFA', '#FB7185', '#38BDF8'],
  });
}
