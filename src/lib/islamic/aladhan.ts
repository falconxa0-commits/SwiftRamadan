// Aladhan API — Accurate prayer times by location
// Docs: https://aladhan.com/prayer-times-api

const ALADHAN_BASE_URL = process.env.ALADHAN_API_BASE || 'http://api.aladhan.com/v1';

export interface PrayerTime {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  imsak: string;
  date: string;
  hijriDate: string;
  hijriMonth: string;
  hijriYear: number;
}

export interface HijriDate {
  date: string;
  day: number;
  month: { number: number; en: string; ar: string };
  year: number;
  designation: { abbreviated: string; expanded: string };
  holidays: string[];
}

// Get prayer times by coordinates
export async function getPrayerTimesByCoords({
  lat,
  lng,
  method = 3, // 3 = Muslim World League (common for West Africa)
  date,
}: {
  lat: number;
  lng: number;
  method?: number;
  date?: string; // DD-MM-YYYY format
}): Promise<PrayerTime | null> {
  try {
    const dateParam = date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    const response = await fetch(
      `${ALADHAN_BASE_URL}/timings/${dateParam}?latitude=${lat}&longitude=${lng}&method=${method}&school=0`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) throw new Error(`Aladhan API returned ${response.status}`);

    const data = await response.json();

    if (data.code === 200 && data.data) {
      const timings = data.data.timings;
      const hijri = data.data.date.hijri;

      return {
        fajr: timings.Fajr?.replace(/\s*\(.*\)/, '') || '05:15',
        sunrise: timings.Sunrise?.replace(/\s*\(.*\)/, '') || '06:30',
        dhuhr: timings.Dhuhr?.replace(/\s*\(.*\)/, '') || '12:45',
        asr: timings.Asr?.replace(/\s*\(.*\)/, '') || '15:55',
        maghrib: timings.Maghrib?.replace(/\s*\(.*\)/, '') || '18:40',
        isha: timings.Isha?.replace(/\s*\(.*\)/, '') || '20:00',
        imsak: timings.Imsak?.replace(/\s*\(.*\)/, '') || '05:05',
        date: data.data.date.readable || '',
        hijriDate: `${hijri.day} ${hijri.month.en} ${hijri.year}`,
        hijriMonth: hijri.month.en,
        hijriYear: parseInt(hijri.year),
      };
    }
    return null;
  } catch (error) {
    console.error('[Aladhan] Prayer times error:', error);
    // Fallback: return Lagos defaults
    return {
      fajr: '05:15',
      sunrise: '06:30',
      dhuhr: '12:45',
      asr: '15:55',
      maghrib: '18:40',
      isha: '20:00',
      imsak: '05:05',
      date: new Date().toLocaleDateString('en-GB'),
      hijriDate: '',
      hijriMonth: '',
      hijriYear: 1447,
    };
  }
}

// Get prayer times by city
export async function getPrayerTimesByCity({
  city = 'Lagos',
  country = 'Nigeria',
  method = 3,
}: {
  city?: string;
  country?: string;
  method?: number;
}): Promise<PrayerTime | null> {
  try {
    const dateParam = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
    const response = await fetch(
      `${ALADHAN_BASE_URL}/timingsByCity/${dateParam}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) throw new Error(`Aladhan API returned ${response.status}`);

    const data = await response.json();
    if (data.code === 200 && data.data) {
      const timings = data.data.timings;
      const hijri = data.data.date.hijri;

      return {
        fajr: timings.Fajr?.replace(/\s*\(.*\)/, '') || '05:15',
        sunrise: timings.Sunrise?.replace(/\s*\(.*\)/, '') || '06:30',
        dhuhr: timings.Dhuhr?.replace(/\s*\(.*\)/, '') || '12:45',
        asr: timings.Asr?.replace(/\s*\(.*\)/, '') || '15:55',
        maghrib: timings.Maghrib?.replace(/\s*\(.*\)/, '') || '18:40',
        isha: timings.Isha?.replace(/\s*\(.*\)/, '') || '20:00',
        imsak: timings.Imsak?.replace(/\s*\(.*\)/, '') || '05:05',
        date: data.data.date.readable || '',
        hijriDate: `${hijri.day} ${hijri.month.en} ${hijri.year}`,
        hijriMonth: hijri.month.en,
        hijriYear: parseInt(hijri.year),
      };
    }
    return null;
  } catch (error) {
    console.error('[Aladhan] City prayer times error:', error);
    return getPrayerTimesByCoords({ lat: 6.5244, lng: 3.3792, method }); // Fallback to Lagos coords
  }
}

// Get Hijri calendar for a month
export async function getHijriCalendar({
  month,
  year,
}: {
  month: number; // Hijri month 1-12
  year: number; // Hijri year
}): Promise<Array<HijriDate & { gregorianDate: string }>> {
  try {
    const response = await fetch(
      `${ALADHAN_BASE_URL}/hijriCalendarByAddress/${month}/${year}?address=Lagos,Nigeria&method=3`,
      { next: { revalidate: 86400 } }
    );

    if (!response.ok) throw new Error(`Aladhan calendar API returned ${response.status}`);

    const data = await response.json();
    if (data.code === 200 && data.data) {
      return data.data.map((entry: Record<string, unknown>) => {
        const hijri = entry.date as Record<string, unknown>;
        const hijriDate = hijri?.hijri as Record<string, unknown>;
        const hijriMonth = hijriDate?.month as Record<string, string>;
        const hijriDesignation = hijriDate?.designation as Record<string, string>;
        return {
          date: (hijriDate?.date as string) || '',
          day: parseInt((hijriDate?.day as string) || '1'),
          month: {
            number: hijriMonth?.number ? parseInt(String(hijriMonth.number)) : month,
            en: (hijriMonth?.en as string) || '',
            ar: (hijriMonth?.ar as string) || '',
          },
          year: parseInt(String(hijriDate?.year || year)),
          designation: {
            abbreviated: (hijriDesignation?.abbreviated as string) || '',
            expanded: (hijriDesignation?.expanded as string) || '',
          },
          holidays: (Array.isArray(hijriDate?.holidays) ? hijriDate.holidays : []) as string[],
          gregorianDate: (hijri?.readable as string) || '',
        };
      });
    }
    return [];
  } catch (error) {
    console.error('[Aladhan] Hijri calendar error:', error);
    return [];
  }
}

// Check if today is Ramadan
export function isRamadan(hijriMonth: string): boolean {
  const ramadanNames = ['Ramadhan', 'Ramadan', 'Ramaḍān'];
  return ramadanNames.some(name => hijriMonth.toLowerCase().includes(name.toLowerCase()));
}

// Get Ramadan day number (1-30)
export function getRamadanDay(hijriDate: string): number | null {
  const match = hijriDate.match(/^(\d+)\s/);
  return match ? parseInt(match[1]) : null;
}
