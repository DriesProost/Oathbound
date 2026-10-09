/** Date keys stay stable in storage; only their presentation follows the browser locale. */
export function formatDay(day: string, includeYear = false) {
  return new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    ...(includeYear ? { year: "numeric" as const } : {}),
  });
}
