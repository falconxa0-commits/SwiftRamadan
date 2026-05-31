import { NextResponse } from 'next/server';

const orders = [
  { id: "SR-2024-001", status: "In Transit", item: "Ramadan Family Box", eta: "Arriving in 15 min", rider: "Ibrahim K.", total: 38500, items: [{ name: "Ramadan Family Box", qty: 1, price: 38500 }], progress: 75 },
  { id: "SR-2024-002", status: "Preparing", item: "Spicy Gizdodo x2", eta: "Est. 20 min", rider: null, total: 8400, items: [{ name: "Spicy Gizdodo", qty: 2, price: 4200 }], progress: 35 },
  { id: "SR-2024-003", status: "Delivered", item: "Groceries Bundle", eta: "Delivered yesterday", rider: "Adebayo S.", total: 22500, items: [{ name: "Groceries Bundle", qty: 1, price: 22500 }], progress: 100 },
  { id: "SR-2024-004", status: "Delivered", item: "Dates & Fruit Box", eta: "Delivered 2 days ago", rider: "Chidi O.", total: 5900, items: [{ name: "Dates & Fruit Box", qty: 1, price: 5900 }], progress: 100 },
];

export async function GET() {
  return NextResponse.json({ orders });
}
