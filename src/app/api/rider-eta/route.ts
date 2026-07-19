import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ───────── In-memory rider ETA data (fallback) ───────── */

interface RiderETA {
  orderId: string;
  riderName: string;
  riderRating: number;
  vehicleType: string;
  plateNumber: string;
  stage: 'placed' | 'preparing' | 'picked_up' | 'two_min_away' | 'delivered';
  etaMinutes: number;
  progressPercent: number;
  isGroupOrder: boolean;
  groupMembers: { name: string; status: string }[];
  lastUpdated: string;
}

const MOCK_ETA: RiderETA = {
  orderId: 'ORD-2026-RMD-001',
  riderName: 'Ibrahim A.',
  riderRating: 4.9,
  vehicleType: 'Motorcycle',
  plateNumber: 'EKY-482QX',
  stage: 'picked_up',
  etaMinutes: 7,
  progressPercent: 60,
  isGroupOrder: true,
  groupMembers: [
    { name: 'Amina K.', status: 'two_min_away' },
    { name: 'Tunde B.', status: 'two_min_away' },
    { name: 'Fatima S.', status: 'two_min_away' },
    { name: 'Yusuf M.', status: 'two_min_away' },
  ],
  lastUpdated: new Date().toISOString(),
};

/* ───────── GET: Return rider ETA and progress ───────── */

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const orderId = searchParams.get('orderId');

  // Try DB first
  try {
    if (orderId) {
      const dbETA = await db.riderETAParty.findFirst({
        where: { orderId },
      });

      if (dbETA) {
        const stageMap: Record<string, RiderETA['stage']> = {
          'en_route': 'picked_up',
          'arriving': 'two_min_away',
          'delivered': 'delivered',
        };

        const simulatedETA: RiderETA = {
          orderId: dbETA.orderId,
          riderName: dbETA.riderName,
          riderRating: 4.9,
          vehicleType: 'Motorcycle',
          plateNumber: 'EKY-482QX',
          stage: stageMap[dbETA.status] || 'picked_up',
          etaMinutes: dbETA.eta,
          progressPercent: Math.min(100, Math.max(0, 100 - dbETA.eta * 10)),
          isGroupOrder: dbETA.viewers > 1,
          groupMembers: Array.from({ length: dbETA.viewers }, (_, i) => ({
            name: `Member ${i + 1}`,
            status: dbETA.status === 'arriving' ? 'two_min_away' : 'preparing',
          })),
          lastUpdated: dbETA.createdAt.toISOString(),
        };

        return NextResponse.json({
          success: true,
          data: simulatedETA,
          partyMode: simulatedETA.stage === 'two_min_away',
        });
      }
    }

    // Try any ETA party record
    const anyETA = await db.riderETAParty.findFirst();
    if (anyETA) {
      const stageMap: Record<string, RiderETA['stage']> = {
        'en_route': 'picked_up',
        'arriving': 'two_min_away',
        'delivered': 'delivered',
      };

      const simulatedETA: RiderETA = {
        orderId: orderId || anyETA.orderId,
        riderName: anyETA.riderName,
        riderRating: 4.9,
        vehicleType: 'Motorcycle',
        plateNumber: 'EKY-482QX',
        stage: stageMap[anyETA.status] || 'picked_up',
        etaMinutes: anyETA.eta,
        progressPercent: Math.min(100, Math.max(0, 100 - anyETA.eta * 10)),
        isGroupOrder: anyETA.viewers > 1,
        groupMembers: Array.from({ length: anyETA.viewers }, (_, i) => ({
          name: `Member ${i + 1}`,
          status: anyETA.status === 'arriving' ? 'two_min_away' : 'preparing',
        })),
        lastUpdated: anyETA.createdAt.toISOString(),
      };

      return NextResponse.json({
        success: true,
        data: simulatedETA,
        partyMode: simulatedETA.stage === 'two_min_away',
      });
    }
  } catch {
    // Fallback to mock
  }

  // Fallback: mock data with slight randomization
  const stages: RiderETA['stage'][] = ['placed', 'preparing', 'picked_up', 'two_min_away', 'delivered'];
  const stageIndex = stages.indexOf(MOCK_ETA.stage);

  const simulatedETA: RiderETA = {
    ...MOCK_ETA,
    orderId: orderId || MOCK_ETA.orderId,
    etaMinutes: Math.max(0, MOCK_ETA.etaMinutes - Math.floor(Math.random() * 2)),
    progressPercent: Math.min(100, stageIndex * 25 + Math.floor(Math.random() * 10)),
    lastUpdated: new Date().toISOString(),
  };

  return NextResponse.json({
    success: true,
    data: simulatedETA,
    partyMode: simulatedETA.stage === 'two_min_away',
  });
}
