// 0: purpose and one sentence. 1: plus two typed questions. 2: plus a third and a one-minute wait.
// Work visits always get the light form; pleasure visits get heavier as the day's total runs down.
export function frictionLevel(usage, limits, purpose) {
  if (purpose === "work") return 0;
  const used = usage.global / (limits.global * 60);
  return used > 0.8 ? 2 : used > 0.5 ? 1 : 0;
}
