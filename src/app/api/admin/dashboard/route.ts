// /api/admin/dashboard — Platform-wide metrics
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import * as usersService from '@/services/users/users.service';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    // MIGRATED (Phase 11): defense-in-depth admin user existence check via
    // `usersService.getUserById`. `requireAdmin` verifies the JWT and admin
    // role but does NOT verify the user still exists in the DB. Returns a
    // clean 404 if the admin was deleted between JWT issuance and this
    // request. Mirrors `/api/cart/route.ts`.
    const adminUser = await usersService.getUserById(auth.userId);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 },
      );
    }

    // ── Core counts ──
    const [
      totalUsers,
      totalOrders,
      totalVendors,
      totalRiders,
      allOrders,
      allPayments,
    ] = await Promise.all([
      db.user.count(),
      db.order.count(),
      db.user.count({ where: { role: 'vendor' } }),
      db.user.count({ where: { role: 'rider' } }),
      db.order.findMany({ select: { id: true, status: true, total: true, createdAt: true } }),
      db.payment.findMany({ where: { status: 'success' }, select: { amount: true, createdAt: true } }),
    ]);

    // ── Total revenue (sum of all successful payments) ──
    const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);

    // ── Orders by status ──
    const ordersByStatus: Record<string, number> = {};
    for (const order of allOrders) {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    }

    // ── Revenue trend (last 7 days) ──
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentPayments = allPayments.filter((p) => new Date(p.createdAt) >= sevenDaysAgo);

    const revenueTrend: { date: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = day.toISOString().split('T')[0];
      const dayRevenue = recentPayments
        .filter((p) => new Date(p.createdAt).toISOString().split('T')[0] === dayStr)
        .reduce((sum, p) => sum + p.amount, 0);
      revenueTrend.push({ date: dayStr, revenue: dayRevenue });
    }

    // ── Top vendors by revenue ──
    const vendorOrders = await db.order.findMany({
      where: { status: { notIn: ['cancelled', 'refunded'] } },
      select: { id: true, total: true, userId: true, user: { select: { id: true, name: true, storeName: true } } },
    });

    const vendorRevenueMap: Record<string, { name: string; storeName: string | null; revenue: number; orderCount: number }> = {};
    for (const order of vendorOrders) {
      const vid = order.user?.id;
      if (!vid) continue;
      if (!vendorRevenueMap[vid]) {
        vendorRevenueMap[vid] = {
          name: order.user?.name || 'Unknown',
          storeName: order.user?.storeName || null,
          revenue: 0,
          orderCount: 0,
        };
      }
      vendorRevenueMap[vid].revenue += order.total;
      vendorRevenueMap[vid].orderCount += 1;
    }

    const topVendors = Object.entries(vendorRevenueMap)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalOrders,
        totalRevenue,
        totalVendors,
        totalRiders,
        ordersByStatus,
        revenueTrend,
        topVendors,
      },
    });
  } catch (error) {
    console.error('[Admin Dashboard] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 },
    );
  }
}
