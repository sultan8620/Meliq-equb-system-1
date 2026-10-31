import ethiopianDate from 'ethiopian-date';

export const ETHIOPIAN_MONTHS_AM = [
  '',
  'መስከረም',
  'ጥቅምት',
  'ኅዳር',
  'ታኅሣሥ',
  'ጥር',
  'የካቲት',
  'መጋቢት',
  'ሚያዝያ',
  'ግንቦት',
  'ሰኔ',
  'ሐምሌ',
  'ነሐሴ',
  'ጳጉሜ'
];

export const ETHIOPIAN_MONTHS_EN = [
  '',
  'Meskerem',
  'Tikimt',
  'Hidar',
  'Tahsas',
  'Tir',
  'Yekatit',
  'Megabit',
  'Miyazya',
  'Ginbot',
  'Sene',
  'Hamle',
  'Nehase',
  'Pagume'
];

export function parseToDate(input?: any): Date {
  if (!input) return new Date();
  if (input instanceof Date) return isNaN(input.getTime()) ? new Date() : input;
  if (typeof input.toDate === 'function') {
    try {
      const d = input.toDate();
      if (d instanceof Date && !isNaN(d.getTime())) return d;
    } catch {
      // fallback
    }
  }
  if (typeof input.seconds === 'number') {
    return new Date(input.seconds * 1000);
  }
  if (typeof input === 'number') {
    return new Date(input);
  }
  if (typeof input === 'string') {
    // If it's already an Ethiopian date string like "ጥቅምት 21, 2019 ዓ.ም", don't reparse to Gregorian Date
    const parsed = new Date(input);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export function getEthiopianDateDetails(dateInput?: any) {
  const d = parseToDate(dateInput);
  try {
    const [ethYear, ethMonth, ethDay] = ethiopianDate.toEthiopian(
      d.getFullYear(),
      d.getMonth() + 1,
      d.getDate()
    );

    const monthAm = ETHIOPIAN_MONTHS_AM[ethMonth] || `ወር ${ethMonth}`;
    const monthEn = ETHIOPIAN_MONTHS_EN[ethMonth] || `Month ${ethMonth}`;

    const pad = (n: number) => String(n).padStart(2, '0');
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const timeString = `${hours}:${minutes}`;

    const formattedAm = `${monthAm} ${ethDay}, ${ethYear} ዓ.ም`;
    const formattedEn = `${monthEn} ${ethDay}, ${ethYear}`;
    const fullFormattedAm = `${monthAm} ${ethDay}, ${ethYear} ዓ.ም (${timeString})`;
    const fullFormattedEn = `${monthEn} ${ethDay}, ${ethYear} (${timeString})`;
    const dateString = `${pad(ethDay)}/${pad(ethMonth)}/${ethYear}`;

    return {
      year: ethYear,
      month: ethMonth,
      day: ethDay,
      monthNameAm: monthAm,
      monthNameEn: monthEn,
      formattedAm,
      formattedEn,
      timeString,
      fullFormattedAm,
      fullFormattedEn,
      dateString,
      rawDate: d
    };
  } catch (err) {
    console.error('Error converting to Ethiopian date:', err);
    return {
      year: 2019,
      month: 1,
      day: 1,
      monthNameAm: 'መስከረም',
      monthNameEn: 'Meskerem',
      formattedAm: d.toLocaleDateString(),
      formattedEn: d.toLocaleDateString(),
      timeString: d.toLocaleTimeString(),
      fullFormattedAm: d.toLocaleString(),
      fullFormattedEn: d.toLocaleString(),
      dateString: d.toLocaleDateString(),
      rawDate: d
    };
  }
}

export function formatToEthiopianDate(
  dateInput?: any,
  language: 'am' | 'en' = 'am',
  includeTime: boolean = false
): string {
  if (!dateInput) return '';
  // Check if it's already an Ethiopian date string
  if (typeof dateInput === 'string' && (dateInput.includes('ዓ.ም') || ETHIOPIAN_MONTHS_AM.some(m => m && dateInput.includes(m)))) {
    return dateInput;
  }
  const details = getEthiopianDateDetails(dateInput);
  if (language === 'am') {
    return includeTime ? details.fullFormattedAm : details.formattedAm;
  }
  return includeTime ? details.fullFormattedEn : details.formattedEn;
}
