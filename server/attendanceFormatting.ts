export function formatTimeObjectTo12(
  timeObj: { hour: string; minute: string; period: string } | null | undefined
): string {
  if (!timeObj) return "待定";

  const periodMap: Record<string, string> = {
    AM: "上午",
    PM: "下午",
    pending: "待定",
    morning: "上午",
    afternoon: "下午",
    evening: "晚上",
    上午: "上午",
    下午: "下午",
    晚上: "晚上",
    待定: "待定",
  };
  const chinesePeriod = periodMap[timeObj.period] || timeObj.period;
  if (timeObj.hour === "--" && timeObj.minute === "--") return chinesePeriod;
  if (timeObj.hour === "--" || !timeObj.hour) return chinesePeriod;
  return `${chinesePeriod} ${timeObj.hour}:${String(parseInt(timeObj.minute, 10)).padStart(2, "0")}`;
}
