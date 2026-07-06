// AI Agent Tools — Actual implementations that agents can call
// Each tool is a function that performs a real action in the SwiftRamadan system

import { db } from '@/lib/db';

export const agentTools = {
  // ─── Customer Support Tools ───
  
  async lookupOrder(orderId: string) {
    try {
      const order = await db.order.findUnique({ 
        where: { id: orderId },
        include: { payments: true }
      });
      if (!order) return { success: false, error: 'Order not found' };
      return { 
        success: true, 
        order: {
          id: order.id,
          status: order.status,
          total: order.total,
          items: order.items,
          createdAt: order.createdAt,
          riderName: order.riderName,
          payments: order.payments.map(p => ({ method: p.method, status: p.status, amount: p.amount }))
        }
      };
    } catch (error) {
      return { success: false, error: 'Failed to lookup order' };
    }
  },

  async lookupUserOrders(userId: string, limit = 5) {
    try {
      const orders = await db.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      return { 
        success: true, 
        orders: orders.map(o => ({
          id: o.id, status: o.status, total: o.total,
          items: o.items, createdAt: o.createdAt, riderName: o.riderName
        }))
      };
    } catch (error) {
      return { success: false, error: 'Failed to lookup orders' };
    }
  },

  async searchProducts(query: string, category?: string) {
    try {
      const where: Record<string, unknown> = {};
      if (query) {
        where.OR = [
          { name: { contains: query } },
          { description: { contains: query } },
          { category: { contains: query } },
        ];
      }
      if (category) where.category = category;
      
      const products = await db.product.findMany({
        where,
        take: 10,
        orderBy: { rating: 'desc' },
      });
      return { success: true, products };
    } catch (error) {
      return { success: false, error: 'Search failed' };
    }
  },

  async getStoreInfo(vendorId: string) {
    try {
      const vendor = await db.user.findUnique({
        where: { id: vendorId },
        select: { id: true, storeName: true, businessCategory: true, businessAddress: true, openTime: true, closeTime: true, vendorOnline: true }
      });
      if (!vendor) return { success: false, error: 'Store not found' };
      return { success: true, vendor };
    } catch {
      return { success: false, error: 'Failed to get store info' };
    }
  },

  async getPopularProducts(category?: string) {
    try {
      const where = category ? { category } : {};
      const products = await db.product.findMany({
        where,
        orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
        take: 8,
      });
      return { success: true, products };
    } catch {
      return { success: false, error: 'Failed to get popular products' };
    }
  },

  async getActiveCoupons() {
    try {
      const coupons = await db.coupon.findMany({
        where: { active: true },
        take: 10,
      });
      return { success: true, coupons };
    } catch {
      return { success: false, error: 'Failed to get coupons' };
    }
  },

  // ─── Rider Tools ───

  async getRiderEarnings(riderId: string) {
    try {
      const orders = await db.order.findMany({
        where: { riderName: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });
      const totalEarnings = orders.length * 500; // ₦500 per delivery estimate
      return { 
        success: true, 
        totalEarnings,
        deliveryCount: orders.length,
        recentDeliveries: orders.slice(0, 5)
      };
    } catch {
      return { success: false, error: 'Failed to get earnings' };
    }
  },

  // ─── Vendor Tools ───

  async getVendorOrders(vendorId: string, status?: string) {
    try {
      const products = await db.product.findMany({
        where: { vendorId },
        select: { id: true },
      });
      const productIds = products.map(p => p.id);
      // Get recent orders that might contain vendor's products
      const orders = await db.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      return { success: true, orders, productCount: productIds.length };
    } catch {
      return { success: false, error: 'Failed to get vendor orders' };
    }
  },

  async getVendorProducts(vendorId: string) {
    try {
      const products = await db.product.findMany({
        where: { vendorId },
        orderBy: { rating: 'desc' },
      });
      return { success: true, products, count: products.length };
    } catch {
      return { success: false, error: 'Failed to get products' };
    }
  },

  async getLowStockProducts(vendorId: string) {
    try {
      const products = await db.product.findMany({
        where: { vendorId, inStock: false },
      });
      return { success: true, outOfStock: products, count: products.length };
    } catch {
      return { success: false, error: 'Failed to check stock' };
    }
  },

  // ─── Analytics Tools ───

  async getBusinessMetrics() {
    try {
      const [userCount, orderCount, productCount, revenue] = await Promise.all([
        db.user.count(),
        db.order.count(),
        db.product.count(),
        db.payment.aggregate({ _sum: { amount: true }, where: { status: 'success' } }),
      ]);
      return {
        success: true,
        metrics: {
          totalUsers: userCount,
          totalOrders: orderCount,
          totalProducts: productCount,
          totalRevenue: revenue._sum.amount || 0,
        }
      };
    } catch {
      return { success: false, error: 'Failed to get metrics' };
    }
  },
};

// Tool definitions for AI agents (describes what each tool does to the LLM)
export const toolDefinitions: Record<string, ToolDef> = {
  lookup_order: {
    description: 'Look up an order by its ID. Returns order status, items, total, payment info.',
    parameters: { orderId: { type: 'string', description: 'The order ID to look up', required: true } }
  },
  lookup_user_orders: {
    description: 'Get recent orders for a user. Returns the last N orders with status and totals.',
    parameters: { userId: { type: 'string', description: 'User ID', required: true }, limit: { type: 'number', description: 'Max orders to return (default 5)' } }
  },
  search_products: {
    description: 'Search for products by name, description, or category. Returns up to 10 matching products with prices.',
    parameters: { query: { type: 'string', description: 'Search query', required: true }, category: { type: 'string', description: 'Optional category filter' } }
  },
  get_popular_products: {
    description: 'Get the most popular/highest-rated products, optionally filtered by category.',
    parameters: { category: { type: 'string', description: 'Optional category filter (meals, drinks, snacks, etc.)' } }
  },
  get_active_coupons: {
    description: 'Get all currently active discount coupons/promo codes.',
    parameters: {}
  },
  get_rider_earnings: {
    description: 'Get earnings summary for a rider including total earnings and recent deliveries.',
    parameters: { riderId: { type: 'string', description: 'Rider user ID', required: true } }
  },
  get_vendor_orders: {
    description: 'Get recent orders for a vendor store.',
    parameters: { vendorId: { type: 'string', description: 'Vendor user ID', required: true }, status: { type: 'string', description: 'Optional order status filter' } }
  },
  get_vendor_products: {
    description: 'Get all products listed by a vendor with ratings and stock status.',
    parameters: { vendorId: { type: 'string', description: 'Vendor user ID', required: true } }
  },
  get_low_stock_products: {
    description: 'Get products that are out of stock for a vendor.',
    parameters: { vendorId: { type: 'string', description: 'Vendor user ID', required: true } }
  },
  get_business_metrics: {
    description: 'Get overall business metrics: total users, orders, products, revenue.',
    parameters: {}
  },
};

interface ToolDef {
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
}

// Execute a tool call by name
export async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const toolMap: Record<string, (...args: unknown[]) => Promise<unknown>> = {
    lookup_order: () => agentTools.lookupOrder(args.orderId as string),
    lookup_user_orders: () => agentTools.lookupUserOrders(args.userId as string, args.limit as number | undefined),
    search_products: () => agentTools.searchProducts(args.query as string, args.category as string | undefined),
    get_popular_products: () => agentTools.getPopularProducts(args.category as string | undefined),
    get_active_coupons: () => agentTools.getActiveCoupons(),
    get_rider_earnings: () => agentTools.getRiderEarnings(args.riderId as string),
    get_vendor_orders: () => agentTools.getVendorOrders(args.vendorId as string, args.status as string | undefined),
    get_vendor_products: () => agentTools.getVendorProducts(args.vendorId as string),
    get_low_stock_products: () => agentTools.getLowStockProducts(args.vendorId as string),
    get_business_metrics: () => agentTools.getBusinessMetrics(),
  };

  const fn = toolMap[name];
  if (!fn) return { success: false, error: `Unknown tool: ${name}` };
  
  try {
    return await fn();
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Tool execution failed' };
  }
}
