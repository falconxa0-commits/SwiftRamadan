import { NextResponse } from 'next/server';

const notifications = [
  { id: 1, title: "Order Confirmed!", message: "Your Ramadan Family Box is being prepared.", time: "2 min ago", read: false, type: "order" },
  { id: 2, title: "Flash Sale Alert", message: "30% off all Dates & Fruit Boxes - 1 hour left!", time: "15 min ago", read: false, type: "promo" },
  { id: 3, title: "Iftar Reminder", message: "Maghrib is at 6:45 PM. Order your Iftar now!", time: "1 hr ago", read: true, type: "reminder" },
  { id: 4, title: "SwiftRewards", message: "You've earned 500 points from your last order!", time: "3 hrs ago", read: true, type: "reward" },
  { id: 5, title: "Group Buy Update", message: "Your group buy for Groceries is 80% filled.", time: "5 hrs ago", read: true, type: "social" },
  { id: 6, title: "Delivery Update", message: "Your rider Ibrahim is 5 mins away!", time: "8 hrs ago", read: true, type: "order" },
];

export async function GET() {
  return NextResponse.json({ notifications, unreadCount: notifications.filter(n => !n.read).length });
}
