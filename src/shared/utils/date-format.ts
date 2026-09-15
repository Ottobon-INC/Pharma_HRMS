import { translations } from '../../core/translations';
import { Language } from '../../types';

export function generateMonthOptions(startYear: number, startMonth: number): string[] {
  const options: string[] = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12

  for (let year = currentYear; year >= startYear; year--) {
    const endMonth = year === currentYear ? currentMonth : 12;
    const beginMonth = year === startYear ? startMonth : 1;

    for (let month = endMonth; month >= beginMonth; month--) {
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      options.push(`${year}-${monthStr}`);
    }
  }

  return options;
}

export function formatMonth(monthString: string, language: Language): string {
  if (!monthString) return '';
  const parts = monthString.split('-');
  if (parts.length !== 2) return monthString;
  
  const year = parts[0];
  const monthNum = parseInt(parts[1], 10);
  
  const monthKeys = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  
  const monthKey = monthKeys[monthNum - 1];
  const translatedMonth = translations[language][monthKey] || monthKey;
  
  return `${translatedMonth} ${year}`;
}
