import { NextRequest, NextResponse } from 'next/server';
import { getDuaOfDay, getDuasByCategory, getRandomDua } from '@/lib/islamic/dua';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const random = searchParams.get('random');

    if (random === 'true') {
      const dua = getRandomDua();
      return NextResponse.json({ dua });
    }

    if (category) {
      const duas = getDuasByCategory(category);
      return NextResponse.json({ duas });
    }

    const dua = getDuaOfDay();
    return NextResponse.json({ dua });
  } catch (error) {
    return NextResponse.json({ dua: null, error: "Failed to get du'a" }, { status: 500 });
  }
}
