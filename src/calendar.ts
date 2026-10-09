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
