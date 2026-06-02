import { matches } from "./fixture";
import type { AppState, Match, Prediction, Result } from "./types";

export function scorePrediction(prediction: Prediction, result?: Result, match?: Match) {
  if (!result || prediction.homeGoals === null || prediction.awayGoals === null) return 0;

  let points = 0;
  const exact = prediction.homeGoals === result.homeGoals && prediction.awayGoals === result.awayGoals;
  if (exact) points += 5;
  else if (outcome(prediction.homeGoals, prediction.awayGoals) === outcome(result.homeGoals, result.awayGoals)) points += 3;

  if (prediction.homeGoals === result.homeGoals) points += 1;
  if (prediction.awayGoals === result.awayGoals) points += 1;
  if (match?.knockout && prediction.qualifiedTeamId && prediction.qualifiedTeamId === result.qualifiedTeamId) points += 3;

  return points;
}

export function recalculatePredictions(state: AppState) {
  const resultsByMatchId = new Map(state.results.map((result) => [result.matchId, result]));
  const matchesById = new Map(matches.map((match) => [match.id, match]));

  return state.predictions.map((prediction) => {
    const result = resultsByMatchId.get(prediction.matchId);
    const match = matchesById.get(prediction.matchId);
    return { ...prediction, points: scorePrediction(prediction, result, match) };
  });
}

export function rankingForPool(state: AppState, poolId: string) {
  const members = state.poolMembers.filter((member) => member.poolId === poolId);
  const usersById = new Map(state.users.map((user) => [user.id, user]));
  const pointsByUserId = new Map<string, number>();

  for (const prediction of state.predictions) {
    if (prediction.poolId !== poolId) continue;
    pointsByUserId.set(prediction.userId, (pointsByUserId.get(prediction.userId) ?? 0) + prediction.points);
  }

  return members
    .map((member) => {
      const user = usersById.get(member.userId);
      const matchPoints = pointsByUserId.get(member.userId) ?? 0;

      return {
        userId: member.userId,
        name: user?.name ?? "Usuario",
        role: member.role,
        points: matchPoints,
        matchPoints,
        bonusPoints: 0
      };
    })
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
}

function outcome(homeGoals: number, awayGoals: number) {
  if (homeGoals === awayGoals) return "draw";
  return homeGoals > awayGoals ? "home" : "away";
}
