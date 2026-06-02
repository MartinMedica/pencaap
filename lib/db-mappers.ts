import type { Prisma } from "@prisma/client";
import type { MatchSetting, Result } from "./types";

type DbResult = {
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  qualifiedTeamId: string | null;
  championTeamId: string | null;
  finalistTeamIds: Prisma.JsonValue | null;
};

type DbMatchSetting = {
  id: string;
  predictionLockMode: MatchSetting["predictionLockMode"];
  predictionLockUpdatedAt: Date | null;
  homeTeamOverrideId: string | null;
  awayTeamOverrideId: string | null;
};

export const matchSettingSelect = {
  id: true,
  predictionLockMode: true,
  predictionLockUpdatedAt: true,
  homeTeamOverrideId: true,
  awayTeamOverrideId: true
} satisfies Prisma.MatchSelect;

export function toUiResult(result: DbResult): Result {
  return {
    matchId: result.matchId,
    homeGoals: result.homeGoals,
    awayGoals: result.awayGoals,
    qualifiedTeamId: result.qualifiedTeamId,
    championTeamId: result.championTeamId ?? undefined,
    finalistTeamIds: jsonStringArray(result.finalistTeamIds)
  };
}

export function toUiMatchSetting(match: DbMatchSetting): MatchSetting {
  return {
    matchId: match.id,
    predictionLockMode: match.predictionLockMode,
    predictionLockUpdatedAt: match.predictionLockUpdatedAt?.toISOString() ?? null,
    homeTeamOverrideId: match.homeTeamOverrideId,
    awayTeamOverrideId: match.awayTeamOverrideId
  };
}

export function jsonStringArray(value: Prisma.JsonValue | null) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : undefined;
}
