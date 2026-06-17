"use client";

import { useMemo, useState } from "react";
import { groups, matches } from "@/lib/fixture";
import type { AppState, Match, MatchLockMode, Pool, Prediction, Result, User } from "@/lib/types";
import { MatchCard } from "./match-card";
import { PhaseFilter } from "./phase-filter";
import type { PhaseValue, PredictionDraft } from "./types";
import { Button } from "@/components/ui/button";
import { CalendarDays, List, Lock, Unlock } from "lucide-react";

type MatchSortMode = "fixture" | "date";

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
  const [sortMode, setSortMode] = useState<MatchSortMode>("date");
  const [hidePastMatches, setHidePastMatches] = useState(false);
  const phaseMatches = useMemo(() => matches.filter((match) => match.phase === activePhase), [activePhase]);
  const resultMatchIds = useMemo(() => new Set(state.results.map((result) => result.matchId)), [state.results]);
  const todayStart = startOfToday();
  const visibleMatches = useMemo(
    () => phaseMatches.filter((match) => !hidePastMatches || !isPastMatch(match, resultMatchIds, todayStart)),
    [hidePastMatches, phaseMatches, resultMatchIds, todayStart]
  );
  const sortedMatches = useMemo(() => sortMatches(visibleMatches, sortMode), [sortMode, visibleMatches]);

  return (
    <div className="space-y-4">
      <PhaseFilter activePhase={activePhase} state={state} onPhase={onPhase} />
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#dfe5d8] bg-white p-2 shadow-soft">
        <span className="px-2 text-sm font-bold text-[#586257]">Orden</span>
        <Button size="sm" variant={sortMode === "fixture" ? "default" : "ghost"} onClick={() => setSortMode("fixture")}>
          <List size={16} /> Fixture
        </Button>
        <Button size="sm" variant={sortMode === "date" ? "default" : "ghost"} onClick={() => setSortMode("date")}>
          <CalendarDays size={16} /> Fecha
        </Button>
        <label className="ml-0 flex cursor-pointer items-center gap-2 px-2 text-sm font-bold text-[#586257] sm:ml-auto">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={hidePastMatches}
            onChange={(event) => setHidePastMatches(event.target.checked)}
          />
          <span className="h-6 w-11 rounded-full bg-[#dfe5d8] p-1 transition-colors peer-checked:bg-pitch">
            <span className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${hidePastMatches ? "translate-x-5" : ""}`} />
          </span>
          Ocultar pasados
        </label>
      </div>
      {adminMode ? (
        <div className="flex flex-wrap gap-2 rounded-lg border border-[#dfe5d8] bg-white p-3 shadow-soft">
          <Button size="sm" variant="outline" onClick={() => onPhaseLockChange(phaseMatches.map((match) => match.id), "LOCKED")}>
            <Lock size={16} /> Bloquear fase
          </Button>
          <Button size="sm" variant="outline" onClick={() => onPhaseLockChange(phaseMatches.map((match) => match.id), "OPEN")}>
            <Unlock size={16} /> Liberar fase
          </Button>
        </div>
      ) : null}
      {!sortedMatches.length ? (
        <p className="rounded-lg border border-[#dfe5d8] bg-white p-4 text-sm font-semibold text-[#68736a] shadow-soft">
          No hay partidos para mostrar con los filtros actuales.
        </p>
      ) : activePhase === "Grupos" && sortMode === "fixture" ? (
        <div className="space-y-5">
          {groups.map((group) => {
            const groupMatches = sortedMatches.filter((match) => match.group === group);
            if (!groupMatches.length) return null;
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
          matches={sortedMatches}
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

function startOfToday() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
}

function isPastMatch(match: Match, resultMatchIds: Set<string>, todayStart: number) {
  if (resultMatchIds.has(match.id)) return true;
  const startsAt = new Date(match.startsAt);
  const matchDay = new Date(startsAt.getFullYear(), startsAt.getMonth(), startsAt.getDate()).getTime();
  return matchDay < todayStart;
}

function sortMatches(items: Match[], sortMode: MatchSortMode) {
  return [...items].sort((a, b) => {
    if (sortMode === "date") return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime() || a.order - b.order;
    return a.order - b.order;
  });
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
  const groupPredictionsByMatchId = useMemo(() => {
    const byMatchId = new Map<string, Prediction[]>();
    for (const prediction of state.predictions) {
      if (prediction.poolId !== pool.id) continue;
      const predictions = byMatchId.get(prediction.matchId) ?? [];
      predictions.push(prediction);
      byMatchId.set(prediction.matchId, predictions);
    }
    return byMatchId;
  }, [pool.id, state.predictions]);
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
          groupPredictions={groupPredictionsByMatchId.get(match.id) ?? []}
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
