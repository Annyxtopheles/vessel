/**
 * Bulletproof, timezone-safe local date utilities.
 * Avoids UTC boundary drift caused by `toISOString()` in positive timezones (UTC+1 to UTC+14).
 */

export function getTodayLocalDateStr(): string {
  return formatLocalDate(new Date());
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number);
  const year = parts[0] || new Date().getFullYear();
  const month = (parts[1] || 1) - 1;
  const day = parts[2] || 1;
  // Use noon (12:00:00) to avoid any midnight daylight savings or timezone edge cases
  return new Date(year, month, day, 12, 0, 0);
}

export function shiftDate(dateStr: string, offsetDays: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + offsetDays);
  return formatLocalDate(d);
}

export function formatHumanDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Returns a 7-day strip centered around the target date,
 * allowing smooth navigation forward and backward across any month/year.
 */
export function getRelativeDayStrip(centerDateStr: string, todayStr: string) {
  const days = [];
  for (let i = -3; i <= 3; i++) {
    const dStr = shiftDate(centerDateStr, i);
    const dObj = parseLocalDate(dStr);
    days.push({
      dateStr: dStr,
      dayName: dObj.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: dObj.getDate(),
      isToday: dStr === todayStr,
      isSelected: dStr === centerDateStr,
    });
  }
  return days;
}
