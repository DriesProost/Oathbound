import { campaignRules } from "./config";
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function previousDay(day: string) {
  const d = new Date(day + "T12:00:00");
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}
export function validDay(day: unknown): day is string {
  return (
    typeof day === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    dayKey(new Date(day + "T12:00:00")) === day
  );
}

export function addDays(day: string, days: number) {
  if (!validDay(day)) throw Error("Invalid calendar date.");
  const date = new Date(day + "T12:00:00");
  date.setDate(date.getDate() + days);
  return dayKey(date);
}
export function weekStart(day: string, startsOn = campaignRules.weekStartsOn) {
  if (
    !validDay(day) ||
    !Number.isInteger(startsOn) ||
    startsOn < 0 ||
    startsOn > 6
  )
    throw Error("Invalid week rule.");
  const weekday = new Date(day + "T12:00:00").getDay();
  return addDays(day, -((weekday - startsOn + 7) % 7));
}
export function nextWeekStart(
  day: string,
  startsOn = campaignRules.weekStartsOn,
) {
  return addDays(weekStart(day, startsOn), 7);
}
