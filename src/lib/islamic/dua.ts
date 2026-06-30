// Du'a (Supplication) database — Quranic and prophetic supplications for Ramadan
// Source: Hisnul Muslim (Fortress of the Muslim) + Ramadan-specific duas

export interface Dua {
  id: number;
  arabic: string;
  transliteration: string;
  translation: string;
  category: string; // iftar, sahur, prayer, gratitude, patience, guidance
  source: string;
  occasion?: string;
}

const RAMADAN_DUAS: Dua[] = [
  {
    id: 1,
    arabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
    transliteration: "Allahumma innaka 'afuwwun tuhibbul 'afwa fa'fu 'anni",
    translation: 'O Allah, You are the One who pardons greatly, and You love to pardon, so pardon me.',
    category: 'iftar',
    source: 'Tirmidhi',
    occasion: 'Last 10 nights of Ramadan',
  },
  {
    id: 2,
    arabic: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ',
    transliteration: "Dhahaba al-zama' wa abtallatil-urooqu wa thabatal-ajru insha Allah",
    translation: 'Thirst has gone, the veins are moistened and the reward is confirmed, if Allah wills.',
    category: 'iftar',
    source: 'Abu Dawud',
    occasion: 'When breaking fast',
  },
  {
    id: 3,
    arabic: 'بِسْمِ اللَّهِ اللَّهُمَّ لَكَ صُمْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ',
    transliteration: "Bismillah. Allahumma laka sumtu wa 'ala rizqika aftartu",
    translation: 'In the name of Allah. O Allah, for You I have fasted and upon Your provision I break my fast.',
    category: 'iftar',
    source: 'Abu Dawud',
    occasion: 'When breaking fast',
  },
  {
    id: 4,
    arabic: 'اللَّهُمَّ لَكَ صُمْتُ وَبِكَ آمَنْتُ وَعَلَيْكَ تَوَكَّلْتُ وَمِنْ رِزْقِكَ أَفْطَرْتُ',
    transliteration: "Allahumma laka sumtu wa bika aamantu wa 'alaika tawakkaltu wa min rizqika aftartu",
    translation: 'O Allah, for You I have fasted, in You I believe, upon You I rely, and from Your provision I break my fast.',
    category: 'iftar',
    source: 'Ibn Majah',
    occasion: 'When breaking fast',
  },
  {
    id: 5,
    arabic: 'اللَّهُمَّ بَارِكْ لَنَا فِي رَجَبٍ وَشَعْبَانَ وَبَلِّغْنَا رَمَضَانَ',
    transliteration: "Allahumma barik lana fi Rajab wa Sha'ban wa ballighna Ramadan",
    translation: "O Allah, bless us in Rajab and Sha'ban and let us reach Ramadan.",
    category: 'prayer',
    source: 'Ahmad',
    occasion: 'Before Ramadan',
  },
  {
    id: 6,
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar",
    translation: 'Our Lord, give us good in this world and good in the Hereafter, and save us from the punishment of the Fire.',
    category: 'prayer',
    source: 'Quran 2:201',
  },
  {
    id: 7,
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى',
    transliteration: "Allahumma inni as'alukal-huda wat-tuqa wal-'afafa wal-ghina",
    translation: 'O Allah, I ask You for guidance, piety, chastity, and self-sufficiency.',
    category: 'guidance',
    source: 'Muslim',
  },
  {
    id: 8,
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَالْعَجْزِ وَالْكَسَلِ وَالْبُخْلِ وَالْجُبْنِ وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ',
    transliteration: "Allahumma inni a'udhu bika minal-hammi wal-hazan wal-'ajzi wal-kasali wal-bukhli wal-jubni wa da'lid-dayni wa ghalabatir-rijal",
    translation: 'O Allah, I seek refuge in You from anxiety and sorrow, weakness and laziness, stinginess and cowardice, and the burden of debt and the domination of men.',
    category: 'patience',
    source: 'Bukhari',
  },
  {
    id: 9,
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ',
    transliteration: "Subhanallahi wa bihamdihi subhanallahil-'azim",
    translation: 'Glory be to Allah and all praise; glory be to Allah the Supreme.',
    category: 'gratitude',
    source: 'Bukhari & Muslim',
  },
  {
    id: 10,
    arabic: 'اللَّهُمَّ اغْفِرْ لِي وَارْحَمْنِي وَاهْدِنِي وَعَافِنِي وَارْزُقْنِي',
    transliteration: "Allahummaghfir li warhamni wahdini wa'afini warzuqni",
    translation: 'O Allah, forgive me, have mercy on me, guide me, grant me well-being, and provide for me.',
    category: 'sahur',
    source: 'Muslim',
    occasion: 'Sahur time',
  },
];

// Get du'a of the day (cycles through by day of year)
export function getDuaOfDay(date?: Date): Dua {
  const targetDate = date || new Date();
  const dayOfYear = Math.floor(
    (targetDate.getTime() - new Date(targetDate.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const index = dayOfYear % RAMADAN_DUAS.length;
  return RAMADAN_DUAS[index];
}

// Get duas by category
export function getDuasByCategory(category: string): Dua[] {
  return RAMADAN_DUAS.filter(d => d.category === category);
}

// Get all duas
export function getAllDuas(): Dua[] {
  return RAMADAN_DUAS;
}

// Get random du'a
export function getRandomDua(): Dua {
  return RAMADAN_DUAS[Math.floor(Math.random() * RAMADAN_DUAS.length)];
}
