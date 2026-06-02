import type { Match, MatchSetting } from "./types";

export function predictionLocked(match: Match, setting?: MatchSetting, now = Date.now()) {
  const startsAt = new Date(match.startsAt).getTime();
  const lockMode = setting?.predictionLockMode ?? "AUTO";
  const lockUpdatedAt = setting?.predictionLockUpdatedAt ? new Date(setting.predictionLockUpdatedAt).getTime() : 0;
  const alreadyStarted = now >= startsAt;
  const openedAfterStart = lockMode === "OPEN" && lockUpdatedAt > startsAt;

  if (alreadyStarted) return !openedAfterStart;
  return lockMode === "LOCKED";
}

export function lockLabel(match: Match, setting?: MatchSetting) {
  if (predictionLocked(match, setting)) return "Bloqueado";
  if (setting?.predictionLockMode === "OPEN") return "Liberado";
  return "Editable";
}
