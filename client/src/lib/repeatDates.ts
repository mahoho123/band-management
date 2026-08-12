export function toggleRepeatDate(
  selectedDates: ReadonlySet<string>,
  date: string,
  primaryDate: string,
): Set<string> {
  const next = new Set(selectedDates);
  if (date === primaryDate) return next;
  if (next.has(date)) next.delete(date);
  else next.add(date);
  return next;
}

export function commitRepeatDates(
  selectedDates: ReadonlySet<string>,
  primaryDate: string,
): string[] {
  return Array.from(selectedDates)
    .filter(date => date && date !== primaryDate)
    .sort();
}

export function buildEventDates(
  primaryDate: string,
  extraDates: readonly string[],
  repeatEnabled: boolean,
): string[] {
  const dates = [primaryDate];
  if (!repeatEnabled) return dates;
  for (const date of extraDates) {
    if (date && date !== primaryDate && !dates.includes(date)) {
      dates.push(date);
    }
  }
  return dates;
}
