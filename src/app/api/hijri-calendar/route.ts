import { NextRequest, NextResponse } from 'next/server';
import { getHijriCalendar, isRamadan } from '@/lib/islamic/aladhan';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || '9'); // Default: Ramadan
    const year = parseInt(searchParams.get('year') || '1447');

    const calendar = await getHijriCalendar({ month, year });
    const ramadanStatus = calendar.length > 0 ? isRamadan(calendar[0]?.month?.en || '') : false;

    return NextResponse.json({
      success: true,
      month,
      year,
      isRamadan: ramadanStatus,
      calendar,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Hijri calendar error' }, { status: 500 });
  }
}
