import { NextRequest, NextResponse } from 'next/server';

/* ─── Mock finance data ─── */
const periodData: Record<string, {
  totalRevenue: number;
  platformCommission: number;
  vendorPayouts: number;
  netProfit: number;
  transactions: { id: string; type: 'commission' | 'payout' | 'refund' | 'fee'; amount: number; description: string; date: string; status: 'completed' | 'pending' | 'failed' }[];
}> = {
  Today: {
    totalRevenue: 8750000,
    platformCommission: 1050000,
    vendorPayouts: 7350000,
    netProfit: 350000,
    transactions: [
      { id: 'txn-001', type: 'commission', amount: 245000, description: 'Commission from Mama Aisha Kitchen', date: 'Today, 2:45 PM', status: 'completed' },
      { id: 'txn-002', type: 'payout', amount: 1850000, description: 'Payout to Lagos Bites', date: 'Today, 1:30 PM', status: 'completed' },
      { id: 'txn-003', type: 'refund', amount: 3500, description: 'Refund for order #D4E5F6', date: 'Today, 12:15 PM', status: 'completed' },
      { id: 'txn-004', type: 'fee', amount: 15000, description: 'Platform fee - Iftar Express', date: 'Today, 11:00 AM', status: 'pending' },
      { id: 'txn-005', type: 'commission', amount: 178000, description: 'Commission from Suya Palace', date: 'Today, 10:30 AM', status: 'completed' },
    ],
  },
  'This Week': {
    totalRevenue: 52800000,
    platformCommission: 6336000,
    vendorPayouts: 44354000,
    netProfit: 2110000,
    transactions: [
      { id: 'txn-101', type: 'commission', amount: 1250000, description: 'Weekly commission - Mama Aisha Kitchen', date: 'Mon, Mar 15', status: 'completed' },
      { id: 'txn-102', type: 'payout', amount: 8750000, description: 'Weekly payout - Lagos Bites', date: 'Mon, Mar 15', status: 'pending' },
      { id: 'txn-103', type: 'commission', amount: 890000, description: 'Weekly commission - Iftar Express', date: 'Sun, Mar 14', status: 'completed' },
      { id: 'txn-104', type: 'refund', amount: 28400, description: 'Batch refund - 8 cancelled orders', date: 'Sat, Mar 13', status: 'completed' },
      { id: 'txn-105', type: 'fee', amount: 45000, description: 'Platform fees - 5 vendors', date: 'Fri, Mar 12', status: 'completed' },
      { id: 'txn-106', type: 'payout', amount: 6320000, description: 'Weekly payout - Fresh Fruits NG', date: 'Fri, Mar 12', status: 'completed' },
      { id: 'txn-107', type: 'commission', amount: 520000, description: 'Weekly commission - Suya Palace', date: 'Thu, Mar 11', status: 'completed' },
      { id: 'txn-108', type: 'payout', amount: 4100000, description: 'Weekly payout - Suya Palace', date: 'Thu, Mar 11', status: 'failed' },
    ],
  },
  'This Month': {
    totalRevenue: 287500000,
    platformCommission: 34500000,
    vendorPayouts: 241250000,
    netProfit: 11750000,
    transactions: [
      { id: 'txn-201', type: 'commission', amount: 5250000, description: 'Monthly commission - Mama Aisha Kitchen', date: 'Mar 15', status: 'completed' },
      { id: 'txn-202', type: 'payout', amount: 36750000, description: 'Monthly payout - Mama Aisha Kitchen', date: 'Mar 14', status: 'completed' },
      { id: 'txn-203', type: 'commission', amount: 4180000, description: 'Monthly commission - Lagos Bites', date: 'Mar 14', status: 'completed' },
      { id: 'txn-204', type: 'payout', amount: 29260000, description: 'Monthly payout - Lagos Bites', date: 'Mar 13', status: 'pending' },
      { id: 'txn-205', type: 'commission', amount: 3520000, description: 'Monthly commission - Iftar Express', date: 'Mar 12', status: 'completed' },
      { id: 'txn-206', type: 'refund', amount: 145000, description: 'Monthly refunds - 42 orders', date: 'Mar 11', status: 'completed' },
      { id: 'txn-207', type: 'fee', amount: 125000, description: 'Monthly platform fees - 12 vendors', date: 'Mar 10', status: 'completed' },
      { id: 'txn-208', type: 'payout', amount: 24640000, description: 'Monthly payout - Iftar Express', date: 'Mar 9', status: 'completed' },
      { id: 'txn-209', type: 'commission', amount: 2710000, description: 'Monthly commission - Suya Palace', date: 'Mar 8', status: 'completed' },
      { id: 'txn-210', type: 'payout', amount: 18970000, description: 'Monthly payout - Suya Palace', date: 'Mar 7', status: 'failed' },
    ],
  },
  'All Time': {
    totalRevenue: 1245000000,
    platformCommission: 149400000,
    vendorPayouts: 1045800000,
    netProfit: 49800000,
    transactions: [
      { id: 'txn-301', type: 'commission', amount: 149400000, description: 'All-time platform commission', date: 'Oct 2025 - Present', status: 'completed' },
      { id: 'txn-302', type: 'payout', amount: 1045800000, description: 'All-time vendor payouts', date: 'Oct 2025 - Present', status: 'completed' },
      { id: 'txn-303', type: 'refund', amount: 3250000, description: 'All-time refunds - 891 orders', date: 'Oct 2025 - Present', status: 'completed' },
      { id: 'txn-304', type: 'fee', amount: 2450000, description: 'All-time platform fees', date: 'Oct 2025 - Present', status: 'completed' },
    ],
  },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'This Month';

    const data = periodData[period] || periodData['This Month'];

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Admin Finance] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch finance data' }, { status: 500 });
  }
}
