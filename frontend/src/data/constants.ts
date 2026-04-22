export const HOURS = Array.from({ length: 13 }, (_, i) => i + 9); // 9 AM – 9 PM
export const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const PX_PER_MINUTE = 2; 
export const HOUR_HEIGHT = 60 * PX_PER_MINUTE; 

export const STATUS_BG = {
  available: "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20",
  booked: "bg-gold/10 border-gold/20 hover:bg-gold/20",
  break: "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20",
  closed: "bg-white/5 border-white/10 hover:bg-white/10",
} as const;

export const STATUS_TEXT = {
  available: "text-emerald-400",
  booked: "text-gold",
  break: "text-blue-400",
  closed: "text-cream/50",
} as const;

export const BOOKING_STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  completed: "bg-white/5 text-white/60 border-white/10",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  pending: "bg-gold/10 text-gold border-gold/20",
  no_show: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};
