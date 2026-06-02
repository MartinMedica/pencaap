"use client";

import { useMemo } from "react";
import { groups, matches } from "@/lib/fixture";
import type { AppState, Match, MatchLockMode, Pool, Result, User } from "@/lib/types";
import { MatchCard } from "./match-card";
import { PhaseFilter } from "./phase-filter";
import type { PhaseValue, PredictionDraft } from "./types";
import { Button } from "@/components/ui/button";
import { Lock, Unlock } from "lucide-react";

type FixtureProps = {
  adminMode: boolean;
  activePhase: PhaseValue;
  state: AppState;
  user: User;
  pool: Pool;
  onPhase: (phase: PhaseValue) => void;
  onPrediction: (match: Match, prediction: PredictionDraft) => Promise<void>;
  onResult: (result: Result) => Promise<void>;
  onMatchLockChange: (matchId: string, mode: MatchLockMode) => Promise<void>;
  onPhaseLockChange: (matchIds: string[], mode: MatchLockMode) => Promise<void>;
  onTeamOverrideChange: (matchId: string, side: "home" | "away", teamId: string | null) => Promise<void>;
};

export function Fixture({
  adminMode,
  activePhase,
  state,
  user,
  pool,
  onPhase,
  onPrediction,
  onResult,
  onMatchLockChange,
  onPhaseLockChange,
  onTeamOverrideChange
}: FixtureProps) {
  const visibleMatches = matches.filter((match) => match.phase === activePhase);

  return (
    <div className="space-y-4">
      <PhaseFilter activePhase={activePhase} state={state} onPhase={onPhase} />
      {adminMode ? (
        <div className="flex flex-wrap gap-2 rounded-lg border border-[#dfe5d8] bg-white p-3 shadow-soft">
          <Button size="sm" variant="outline" onClick={() => onPhaseLockChange(visibleMatches.map((match) => match.id), "LOCKED")}>
            <Lock size={16} /> Bloquear fase
          </Button>
          <Button size="sm" variant="outline" onClick={() => onPhaseLockChange(visibleMatches.map((match) => match.id), "OPEN")}>
            <Unlock size={16} /> Liberar fase
          </Button>
        </div>
      ) : null}
      {activePhase === "Grupos" ? (
        <div className="space-y-5">
          {groups.map((group) => {
            const groupMatches = visibleMatches.filter((match) => match.group === group);
            return (
              <section key={group} className="space-y-3">
                <h2 className="text-xl font-black">Grupo {group}</h2>
                <MatchGrid
                  matches={groupMatches}
                  adminMode={adminMode}
                  state={state}
                  user={user}
                  pool={pool}
                  onPrediction={onPrediction}
                  onResult={onResult}
                  onMatchLockChange={onMatchLockChange}
                  onTeamOverrideChange={onTeamOverrideChange}
                />
              </section>
            );
          })}
        </div>
      ) : (
        <MatchGrid
          matches={visibleMatches}
          adminMode={adminMode}
          state={state}
          user={user}
          pool={pool}
          onPrediction={onPrediction}
          onResult={onResult}
          onMatchLockChange={onMatchLockChange}
          onTeamOverrideChange={onTeamOverrideChange}
        />
      )}
    </div>
  );
}

function MatchGrid({
  matches: items,
  adminMode,
  state,
  user,
  pool,
  onPrediction,
  onResult,
  onMatchLockChange,
  onTeamOverrideChange
}: {
  matches: Match[];
  adminMode: boolean;
  state: AppState;
  user: User;
  pool: Pool;
  onPrediction: (match: Match, prediction: PredictionDraft) => Promise<void>;
  onResult: (result: Result) => Promise<void>;
  onMatchLockChange: (matchId: string, mode: MatchLockMode) => Promise<void>;
  onTeamOverrideChange: (matchId: string, side: "home" | "away", teamId: string | null) => Promise<void>;
}) {
  const matchSettingsById = useMemo(() => new Map(state.matchSettings.map((setting) => [setting.matchId, setting])), [state.matchSettings]);
  const predictionsByMatchId = useMemo(
    () =>
      new Map(
        state.predictions
          .filter((prediction) => prediction.poolId === pool.id && prediction.userId === user.id)
          .map((prediction) => [prediction.matchId, prediction])
      ),
    [pool.id, state.predictions, user.id]
  );
  const resultsByMatchId = useMemo(() => new Map(state.results.map((result) => [result.matchId, result])), [state.results]);

  return (
    <div className="grid gap-3">
      {items.map((match) => (
        <MatchCard
          key={match.id}
          state={state}
          match={match}
          adminMode={adminMode}
          matchLockMode={matchSettingsById.get(match.id)?.predictionLockMode ?? match.predictionLockMode}
          prediction={predictionsByMatchId.get(match.id)}
          result={resultsByMatchId.get(match.id)}
          onPrediction={(prediction) => onPrediction(match, prediction)}
          onResult={onResult}
          onMatchLockChange={(mode) => onMatchLockChange(match.id, mode)}
          onTeamOverrideChange={(side, teamId) => onTeamOverrideChange(match.id, side, teamId)}
        />
      ))}
    </div>
  );
}
