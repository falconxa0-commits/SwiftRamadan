import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

/* ─── Mock disputes data ─── */
const mockDisputes = [
  { id: 'dsp-001', orderId: 'ord-d4e5f6g7h8i9', type: 'refund' as const, status: 'open' as const, description: 'Customer requested refund for cancelled order. Vendor never confirmed the order but payment was processed.', date: 'Mar 15, 2026', amount: 3500 },
  { id: 'dsp-002', orderId: 'ord-a1b2c3d4e5f6', type: 'quality' as const, status: 'investigating' as const, description: 'Food was cold upon delivery. Customer reports jollof rice arrived below acceptable temperature.', date: 'Mar 14, 2026', amount: 8500 },
  { id: 'dsp-003', orderId: 'ord-c3d4e5f6g7h8', type: 'delivery' as const, status: 'resolved' as const, description: 'Order delivered to wrong address. Rider delivered to a different flat number.', date: 'Mar 12, 2026', amount: 15700 },
  { id: 'dsp-004', orderId: 'ord-b2c3d4e5f6g7', type: 'refund' as const, status: 'escalated' as const, description: 'Double charge on customer card. Payment was debited twice for a single order.', date: 'Mar 13, 2026', amount: 4200 },
  { id: 'dsp-005', orderId: 'ord-e5f6g7h8i9j0', type: 'other' as const, status: 'open' as const, description: 'Vendor claims order was never picked up by rider despite being marked as dispatched.', date: 'Mar 15, 2026', amount: 12000 },
];

export async function GET() {
  // Note: Admin auth should be enforced at middleware level for GET requests
  try {
    return NextResponse.json({ success: true, data: mockDisputes });
  } catch (error) {
    console.error('[Admin Disputes] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch disputes' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // Admin authentication required
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { disputeId, action } = body;

    if (!disputeId || !action) {
      return NextResponse.json({ success: false, error: 'disputeId and action required' }, { status: 400 });
    }

    const dispute = mockDisputes.find((d) => d.id === disputeId);
    if (!dispute) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    switch (action) {
      case 'investigate':
        dispute.status = 'investigating';
        break;
      case 'resolve':
        dispute.status = 'resolved';
        break;
      case 'escalate':
        dispute.status = 'escalated';
        break;
      case 'refund':
        dispute.status = 'resolved';
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: dispute });
  } catch (error) {
    console.error('[Admin Disputes PUT] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update dispute' }, { status: 500 });
  }
}
