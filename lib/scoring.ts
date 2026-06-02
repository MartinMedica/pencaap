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
  return state.predictions.map((prediction) => {
    const result = state.results.find((item) => item.matchId === prediction.matchId);
    const match = matches.find((item) => item.id === prediction.matchId);
    return { ...prediction, points: scorePrediction(prediction, result, match) };
  });
}

export function rankingForPool(state: AppState, poolId: string) {
  const members = state.poolMembers.filter((member) => member.poolId === poolId);

  return members
    .map((member) => {
      const user = state.users.find((item) => item.id === member.userId);
      const matchPoints = state.predictions
        .filter((prediction) => prediction.poolId === poolId && prediction.userId === member.userId)
        .reduce((sum, prediction) => sum + prediction.points, 0);

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
