"use client";

import { useEffect, useState, useTransition } from "react";
import {
  createPoolAction,
  joinPoolAction,
  savePredictionAction,
  saveResultAction,
  updateMatchLockAction,
  updateMatchTeamOverrideAction,
  updatePhaseLockAction
} from "@/app/actions";
import { phases } from "@/lib/fixture";
import { predictionLocked } from "@/lib/locks";
import { firstPoolForUser } from "@/lib/store";
import type { AppState, Match, MatchLockMode, Result, User } from "@/lib/types";
import { EmptyPool } from "./penca/empty-pool";
import { Fixture } from "./penca/fixture";
import { Hero } from "./penca/hero";
import { PoolPanel } from "./penca/pool-panel";
import { Ranking } from "./penca/ranking";
import { ScoringPanel } from "./penca/scoring-panel";
import { SectionTabs } from "./penca/section-tabs";
import type { AppTab, PhaseValue, PredictionDraft } from "./penca/types";

export function PencaApp({
  initialState,
  currentUser,
  initialActivePoolId,
  isGlobalAdmin
}: {
  initialState: AppState;
  currentUser: User | null;
  initialActivePoolId?: string | null;
  isGlobalAdmin: boolean;
}) {
  const [state, setState] = useState<AppState>(initialState);
  const [activePoolId, setActivePoolId] = useState<string | null>(
    currentUser ? initialActivePoolId ?? firstPoolForUser(initialState, currentUser.id)?.id ?? null : null
  );
  const [activePhase, setActivePhase] = useState<PhaseValue>(phases[0]);
  const [tab, setTab] = useState<AppTab>("predicciones");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  const activePool = state.pools.find((pool) => pool.id === activePoolId) ?? null;
  const memberships = currentUser ? state.poolMembers.filter((member) => member.userId === currentUser.id) : [];
  const isAdmin = Boolean(currentUser && isGlobalAdmin);

  useEffect(() => {
    if (initialActivePoolId && state.pools.some((pool) => pool.id === initialActivePoolId)) {
      setActivePoolId(initialActivePoolId);
    }
  }, [initialActivePoolId, state.pools]);

  useEffect(() => {
    setInviteUrl(activePool ? `${window.location.origin}${window.location.pathname}?invite=${activePool.inviteCode}` : "");
  }, [activePool]);

  function handleCreatePool(name: string) {
    if (!currentUser) return;
    run(async () => {
      const { state: nextState, poolId } = await createPoolAction(name);
      setState(nextState);
      setActivePoolId(poolId);
    });
  }

  function handleJoinPool(code: string) {
    if (!currentUser) return;
    run(async () => {
      const nextState = await joinPoolAction(code);
      const pool = nextState.pools.find((item) => item.inviteCode === code.trim().toUpperCase());
      setState(nextState);
      setActivePoolId(pool?.id ?? firstPoolForUser(nextState, currentUser.id)?.id ?? null);
    });
  }

  async function handlePrediction(match: Match, prediction: PredictionDraft) {
    if (
      !currentUser ||
      !activePool ||
      predictionLocked(match, matchSetting(match.id))
    ) {
      return;
    }
    const nextState = await savePredictionAction({ ...prediction, poolId: activePool.id, matchId: match.id });
    setState(nextState);
  }

  async function handleResult(result: Result) {
    if (!isAdmin) return;
    const nextState = await saveResultAction(result);
    setState(nextState);
  }

  function handleCopyInvite() {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function handleMatchLockChange(matchId: string, mode: MatchLockMode) {
    if (!activePool || !isAdmin) return;
    setState(await updateMatchLockAction({ poolId: activePool.id, matchId, mode }));
  }

  async function handlePhaseLockChange(matchIds: string[], mode: MatchLockMode) {
    if (!activePool || !isAdmin) return;
    setState(await updatePhaseLockAction({ poolId: activePool.id, matchIds, mode }));
  }

  async function handleTeamOverrideChange(matchId: string, side: "home" | "away", teamId: string | null) {
    if (!activePool || !isAdmin) return;
    setState(await updateMatchTeamOverrideAction({ poolId: activePool.id, matchId, side, teamId }));
  }

  function matchSetting(matchId: string) {
    return state.matchSettings.find((setting) => setting.matchId === matchId);
  }

  function run(action: () => Promise<void>) {
    setError("");
    startTransition(async () => {
      try {
        await action();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "No se pudo guardar el cambio");
      }
    });
  }

  return (
    <main className="min-h-screen bg-[#f7f8f3]">
      <Hero user={currentUser} />
      {currentUser ? (
        <section className="mx-auto grid w-full max-w-6xl gap-5 px-4 pb-10 pt-5 lg:grid-cols-[300px_1fr]">
          <aside className="space-y-4">
            <PoolPanel
              pools={state.pools.filter((pool) => memberships.some((member) => member.poolId === pool.id))}
              activePool={activePool}
              inviteUrl={inviteUrl}
              copied={copied}
              isPending={isPending}
              onCopied={handleCopyInvite}
              onCreate={handleCreatePool}
              onJoin={handleJoinPool}
              onSelect={setActivePoolId}
            />
            <ScoringPanel />
            {error ? <p className="rounded-md bg-coral px-3 py-2 text-sm font-bold text-white">{error}</p> : null}
          </aside>

          {activePool ? (
            <section className="space-y-4">
              <SectionTabs activeTab={tab} isAdmin={isAdmin} onChange={setTab} />
              {tab === "ranking" ? (
                <Ranking state={state} poolId={activePool.id} />
              ) : (
                <Fixture
                  adminMode={tab === "admin"}
                  activePhase={activePhase}
                  state={state}
                  user={currentUser}
                  pool={activePool}
                  onPhase={setActivePhase}
                  onPrediction={handlePrediction}
                  onResult={handleResult}
                  onMatchLockChange={handleMatchLockChange}
                  onPhaseLockChange={handlePhaseLockChange}
                  onTeamOverrideChange={handleTeamOverrideChange}
                />
              )}
            </section>
          ) : (
            <EmptyPool />
          )}
        </section>
      ) : null}
    </main>
  );
}
