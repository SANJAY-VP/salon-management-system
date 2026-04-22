/**
 * Parses a time string (e.g. "09:00", "09:00:00", "2:30 PM") into minutes from 9 AM.
 */
export function parseSlotMinutes(time: string): number {
  if (!time) return 0;
  
  // Handle HH:MM:SS or HH:MM
  const parts = time.split(":");
  let h = parseInt(parts[0]);
  let m = parseInt(parts[1] || "0");
  
  // Handle AM/PM if present
  const lowerTime = time.toLowerCase();
  if (lowerTime.includes("pm") && h !== 12) h += 12;
  if (lowerTime.includes("am") && h === 12) h = 0;
  
  // Calculate minutes from 9 AM
  return (h - 9) * 60 + m;
}

/**
 * Formats a date into a human-readable header label.
 */
export function formatDateHeader(date: Date, days: string[], months: string[]): string {
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
