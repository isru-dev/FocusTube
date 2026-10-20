
// Focus time per day, kept in this browser only.
const prefix = "focustube:focus-seconds:";

function dayKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${prefix}${date.getFullYear()}-${month}-${day}`;
}

function readDay(date: Date): number {
  try {
    const value = Number(localStorage.getItem(dayKey(date)));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function readTodaySeconds(): number {
  return readDay(new Date());
}

// Adds focused seconds to today's total and returns the new total.
export function addFocusSeconds(seconds: number): number {
  const total = readTodaySeconds() + Math.max(0, Math.round(seconds));

  try {
    localStorage.setItem(dayKey(new Date()), String(total));
  } catch {
    // Storage can be blocked; stats are a nicety only.
  }

  return total;
}

// Consecutive days with at least a minute of focus. Today does not break the
// streak if you have not studied yet.
export function readStreak(): number {
  const day = new Date();
  let streak = 0;

  if (readDay(day) < 60) day.setDate(day.getDate() - 1);

  while (readDay(day) >= 60) {
    streak += 1;
    day.setDate(day.getDate() - 1);
  }

  return streak;
}

export function formatMinutes(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
