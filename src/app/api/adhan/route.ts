import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

// Lagos prayer times (mock data — approx March 2025 Ramadan timings)
const prayerSchedule = {
  fajr: '5:23 AM',
  dhuhr: '12:45 PM',
  asr: '4:10 PM',
  maghrib: '6:45 PM',
  isha: '8:05 PM',
  sunrise: '6:45 AM',
};

// Time in 24h format for calculation
const prayer24h: Record<string, { h: number; m: number }> = {
  fajr: { h: 5, m: 23 },
  sunrise: { h: 6, m: 45 },
  dhuhr: { h: 12, m: 45 },
  asr: { h: 16, m: 10 },
  maghrib: { h: 18, m: 45 },
  isha: { h: 20, m: 5 },
};

function timeToMinutes(h: number, m: number): number {
  return h * 60 + m;
}

export async function GET(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimitResponse) return rateLimitResponse;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Find next prayer
  const prayers = Object.entries(prayer24h) as [string, { h: number; m: number }][];
  let nextPrayer = prayers[0];
  let nextPrayerMinutes = Infinity;

  for (const [name, time] of prayers) {
    const mins = timeToMinutes(time.h, time.m);
    if (mins > currentMinutes && mins < nextPrayerMinutes) {
      nextPrayerMinutes = mins;
      nextPrayer = [name, time];
    }
  }

  // If no prayer left today, next is Fajr tomorrow
  if (nextPrayerMinutes === Infinity) {
    nextPrayer = prayers[0];
    nextPrayerMinutes = timeToMinutes(prayers[0][1].h, prayers[0][1].m) + 24 * 60;
  }

  const minutesUntilNext = nextPrayerMinutes - currentMinutes;

  // Calculate seconds until Maghrib specifically
  const maghribMinutes = timeToMinutes(prayer24h.maghrib.h, prayer24h.maghrib.m);
  const secondsUntilMaghrib = (maghribMinutes - currentMinutes) * 60 - now.getSeconds();

  return NextResponse.json({
    date: now.toISOString().split('T')[0],
    location: 'Lagos, Nigeria',
    prayers: {
      Fajr: prayerSchedule.fajr,
      Sunrise: prayerSchedule.sunrise,
      Dhuhr: prayerSchedule.dhuhr,
      Asr: prayerSchedule.asr,
      Maghrib: prayerSchedule.maghrib,
      Isha: prayerSchedule.isha,
    },
    nextPrayer: {
      name: nextPrayer[0].charAt(0).toUpperCase() + nextPrayer[0].slice(1),
      time: prayerSchedule[nextPrayer[0] as keyof typeof prayerSchedule],
      minutesUntil: minutesUntilNext,
    },
    maghribCountdown: {
      secondsUntil: secondsUntilMaghrib,
      isIftarTime: secondsUntilMaghrib <= 60 && secondsUntilMaghrib > -300,
    },
  });
}
