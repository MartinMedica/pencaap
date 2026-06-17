"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatMatchDate } from "@/lib/dates";
import { displayTeamId, displayTeamName, isMatchResolved, sideCandidateTeamIds, teamName } from "@/lib/fixture";
import { lockLabel, predictionLocked } from "@/lib/locks";
import { ChevronDown, Lock, Unlock, Users } from "lucide-react";
import type { AppState, Match, MatchLockMode, Prediction, Result } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ScoreField, TeamSelect } from "./form-fields";
import { TeamLabel } from "./team-label";
import type { PredictionDraft, ResultHandler } from "./types";

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

type MatchCardProps = {
  state: AppState;
  match: Match;
  prediction?: Prediction;
  groupPredictions: Prediction[];
  result?: Result;
  adminMode: boolean;
  matchLockMode: MatchLockMode;
  onPrediction: (prediction: PredictionDraft) => Promise<void>;
  onResult: ResultHandler;
  onMatchLockChange: (mode: MatchLockMode) => Promise<void>;
  onTeamOverrideChange: (side: "home" | "away", teamId: string | null) => Promise<void>;
};

export function MatchCard({
  state,
  match,
  prediction,
  groupPredictions,
  result,
  adminMode,
  matchLockMode,
  onPrediction,
  onResult,
  onMatchLockChange,
  onTeamOverrideChange
}: MatchCardProps) {
  const matchSetting = state.matchSettings.find((setting) => setting.matchId === match.id);
  const resolved = isMatchResolved(match, state);
  const homeTeamId = displayTeamId(match, "home", state);
  const awayTeamId = displayTeamId(match, "away", state);
  const homeName = displayTeamName(match, "home", state);
  const awayName = displayTeamName(match, "away", state);
  const homeCandidateIds = useMemo(() => sideCandidateTeamIds(match, "home", state), [match, state]);
  const awayCandidateIds = useMemo(() => sideCandidateTeamIds(match, "away", state), [match, state]);
  const homeOverrideValue = matchSetting?.homeTeamOverrideId ?? (homeCandidateIds.includes(homeTeamId) ? homeTeamId : "");
  const awayOverrideValue = matchSetting?.awayTeamOverrideId ?? (awayCandidateIds.includes(awayTeamId) ? awayTeamId : "");
  const [homeGoals, setHomeGoals] = useState(String(adminMode ? result?.homeGoals ?? "" : prediction?.homeGoals ?? ""));
  const [awayGoals, setAwayGoals] = useState(String(adminMode ? result?.awayGoals ?? "" : prediction?.awayGoals ?? ""));
  const [qualifiedTeamId, setQualifiedTeamId] = useState(
    adminMode ? result?.qualifiedTeamId ?? homeTeamId : prediction?.qualifiedTeamId ?? homeTeamId
  );
  const hasValidScore = isValidGoal(homeGoals) && isValidGoal(awayGoals);
  const isDraw = hasValidScore && Number(homeGoals) === Number(awayGoals);
  const showTiebreaker = hasValidScore && isDraw && match.knockout;
  const isPredictionLocked = predictionLocked(match, matchSetting);
  const canEdit = resolved && (adminMode || !isPredictionLocked);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [groupPredictionsOpen, setGroupPredictionsOpen] = useState(false);
  const lastSavedRef = useRef("");
  const [editVersion, setEditVersion] = useState(0);
  const latestEditVersionRef = useRef(0);
  const savingVersionRef = useRef(0);
  const currentSignature = useMemo(
    () => `${adminMode ? "admin" : "prediction"}:${homeGoals}:${awayGoals}:${qualifiedTeamId}`,
    [adminMode, awayGoals, homeGoals, qualifiedTeamId]
  );
  const formattedStartsAt = useMemo(() => formatMatchDate(match.startsAt), [match.startsAt]);
  const canRevealGroupPredictions = Boolean(result) || isPredictionLocked;
  const groupPredictionRows = useMemo(() => {
    const usersById = new Map(state.users.map((user) => [user.id, user]));
    return [...groupPredictions]
      .sort((first, second) => {
        const firstName = usersById.get(first.userId)?.name ?? "";
        const secondName = usersById.get(second.userId)?.name ?? "";
        return firstName.localeCompare(secondName, "es") || first.userId.localeCompare(second.userId);
      })
      .map((item) => ({
        prediction: item,
        userName: usersById.get(item.userId)?.name ?? "Participante"
      }));
  }, [groupPredictions, state.users]);
  const predictionText =
    prediction?.homeGoals !== null && prediction?.homeGoals !== undefined && prediction?.awayGoals !== null && prediction?.awayGoals !== undefined
      ? `${homeName} ${prediction.homeGoals} - ${prediction.awayGoals} ${awayName}`
      : "Sin prediccion";
  const serverHomeGoals = String(adminMode ? result?.homeGoals ?? "" : prediction?.homeGoals ?? "");
  const serverAwayGoals = String(adminMode ? result?.awayGoals ?? "" : prediction?.awayGoals ?? "");
  const serverQualifiedTeamId = adminMode ? result?.qualifiedTeamId ?? homeTeamId : prediction?.qualifiedTeamId ?? homeTeamId;
  const serverSignature = useMemo(
    () => `${adminMode ? "admin" : "prediction"}:${serverHomeGoals}:${serverAwayGoals}:${serverQualifiedTeamId}`,
    [adminMode, serverAwayGoals, serverHomeGoals, serverQualifiedTeamId]
  );

  useEffect(() => {
    if (editVersion > 0 || saveStatus === "saving") return;
    setQualifiedTeamId(serverQualifiedTeamId);
    lastSavedRef.current = serverSignature;
    setSaveStatus("idle");
  }, [editVersion, saveStatus, serverQualifiedTeamId, serverSignature]);

  const save = useCallback(async () => {
    if (!resolved) return false;
    const home = Number(homeGoals);
    const away = Number(awayGoals);
    if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) return false;
    const inferredQualifiedTeamId = match.knockout
      ? home > away
        ? homeTeamId
        : away > home
          ? awayTeamId
          : qualifiedTeamId
      : null;

    if (adminMode) {
      await onResult({
        matchId: match.id,
        homeGoals: home,
        awayGoals: away,
        qualifiedTeamId: inferredQualifiedTeamId,
        championTeamId: match.phase === "Final" ? inferredQualifiedTeamId ?? undefined : result?.championTeamId,
        finalistTeamIds: match.phase === "Final" ? [homeTeamId, awayTeamId] : result?.finalistTeamIds
      });
      return true;
    }

    await onPrediction({ homeGoals: home, awayGoals: away, qualifiedTeamId: match.knockout ? inferredQualifiedTeamId : null });
    return true;
  }, [adminMode, awayGoals, homeGoals, homeTeamId, match, onPrediction, onResult, qualifiedTeamId, resolved, result, awayTeamId]);

  useEffect(() => {
    if (editVersion === 0 || !canEdit || currentSignature === lastSavedRef.current) return;
    if (savingVersionRef.current === editVersion) return;

    const timeout = window.setTimeout(async () => {
      const signatureToSave = currentSignature;
      const versionToSave = editVersion;
      savingVersionRef.current = versionToSave;
      setSaveStatus("saving");
      try {
        if (await save()) {
          lastSavedRef.current = signatureToSave;
          if (latestEditVersionRef.current === versionToSave) {
            setEditVersion(0);
            setSaveStatus("saved");
          } else {
            setSaveStatus("dirty");
          }
        } else {
          setSaveStatus("dirty");
        }
      } catch {
        setSaveStatus("error");
      }
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [canEdit, currentSignature, editVersion, save]);

  function markEdited() {
    setSaveStatus("dirty");
    setEditVersion((version) => {
      const nextVersion = version + 1;
      latestEditVersionRef.current = nextVersion;
      return nextVersion;
    });
  }

  function updateHomeGoals(value: string) {
    markEdited();
    setHomeGoals(value);
  }

  function updateAwayGoals(value: string) {
    markEdited();
    setAwayGoals(value);
  }

  function updateQualifiedTeam(teamId: string) {
    markEdited();
    setQualifiedTeamId(teamId);
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-[#68736a]">{formattedStartsAt}</p>
            <h3 className="mt-2 grid min-w-0 gap-2 text-lg font-bold sm:flex sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
              <TeamLabel teamId={homeTeamId} name={homeName} size="lg" className="min-w-0" />
              <span className="text-sm text-[#68736a]">vs</span>
              <TeamLabel teamId={awayTeamId} name={awayName} size="lg" className="min-w-0" />
            </h3>
            {!resolved ? (
              <p className="mt-2 text-sm text-[#68736a]">
                {adminMode ? "Elegí los equipos de este cruce para poder cargar el resultado." : "Se habilita cuando el admin cargue los equipos necesarios."}
              </p>
            ) : null}
            {adminMode ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant={matchLockMode === "LOCKED" ? "default" : "outline"} onClick={() => onMatchLockChange("LOCKED")}>
                  <Lock size={16} /> Bloquear
                </Button>
                <Button size="sm" variant={matchLockMode === "OPEN" ? "default" : "outline"} onClick={() => onMatchLockChange("OPEN")}>
                  <Unlock size={16} /> Liberar
                </Button>
              </div>
            ) : null}
          </div>
          <div className="sm:justify-self-end">
            <Badge variant={!canEdit ? "destructive" : "default"}>{!resolved ? "Pendiente" : adminMode ? lockLabel(match, matchSetting) : canEdit ? "Editable" : "Bloqueado"}</Badge>
          </div>
        </div>

        {adminMode && match.knockout ? (
          <div className="mt-4 grid gap-3 rounded-md border border-[#dfe5d8] bg-[#f7f8f3] p-3 md:grid-cols-2">
            <TeamSelect
              label={`Equipo para ${match.homeSeed ?? "local"}`}
              value={homeOverrideValue}
              onChange={(teamId) => onTeamOverrideChange("home", teamId || null)}
              options={homeCandidateIds}
              allowEmpty
            />
            <TeamSelect
              label={`Equipo para ${match.awaySeed ?? "visitante"}`}
              value={awayOverrideValue}
              onChange={(teamId) => onTeamOverrideChange("away", teamId || null)}
              options={awayCandidateIds}
              allowEmpty
            />
          </div>
        ) : null}

        {!adminMode && !canEdit ? null : (
          <>
            <div className="mt-4 grid grid-cols-2 items-end gap-2 sm:grid-cols-[1fr_76px_76px]">
              <div className="col-span-2 text-sm font-semibold text-[#586257] sm:col-span-1">{adminMode ? "Resultado real" : "Tu prediccion"}</div>
              <ScoreField
                label={homeName}
                value={homeGoals}
                onChange={updateHomeGoals}
                disabled={!canEdit}
              />
              <ScoreField
                label={awayName}
                value={awayGoals}
                onChange={updateAwayGoals}
                disabled={!canEdit}
              />
            </div>

            {showTiebreaker ? (
              <div className="mt-3">
                <TeamSelect
                  label={adminMode ? "Ganador por penales" : "Ganador si hay penales"}
                  value={qualifiedTeamId}
                  onChange={updateQualifiedTeam}
                  options={[homeTeamId, awayTeamId]}
                  disabled={!canEdit}
                />
                <p className="mt-1 text-xs text-[#68736a]">
                  Solo aparece si el resultado termina empatado; define quien avanza por penales.
                </p>
              </div>
            ) : null}
          </>
        )}

        <div className="mt-4 rounded-md bg-[#f2f5ee] p-3">
          {result || (!adminMode && !canEdit) ? (
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-center">
              {!adminMode ? (
                <div>
                  <p className="text-xs font-bold uppercase text-[#68736a]">Tu prediccion</p>
                  <p className="mt-1 text-lg font-black text-ink">{predictionText}</p>
                </div>
              ) : null}
              <div>
                <p className="text-xs font-bold uppercase text-[#68736a]">Resultado real</p>
                <p className="mt-1 text-lg font-black text-ink">
                  {result ? `${homeName} ${result.homeGoals} - ${result.awayGoals} ${awayName}` : "Pendiente"}
                </p>
              </div>
              {!adminMode ? (
                <div className="rounded-md bg-pitch px-3 py-2 text-right text-white">
                  <p className="text-xs font-bold uppercase">Tus puntos</p>
                  <p className="text-2xl font-black">{result && prediction ? prediction.points : "-"}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm font-semibold text-[#68736a]">{adminMode ? "Sin resultado cargado" : "Resultado pendiente"}</p>
          )}
          {canEdit ? (
            <div className="mt-3 flex justify-end">
              <p className="text-xs font-semibold text-[#68736a]">{statusLabel(saveStatus)}</p>
            </div>
          ) : null}
        </div>

        <div className="mt-3 rounded-md border border-[#dfe5d8] bg-white">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
            onClick={() => setGroupPredictionsOpen((open) => !open)}
            aria-expanded={groupPredictionsOpen}
          >
            <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-ink">
              <Users size={16} className="shrink-0 text-pitch" />
              <span className="truncate">Predicciones del grupo</span>
              {canRevealGroupPredictions ? (
                <span className="shrink-0 rounded-full bg-[#eef4e9] px-2 py-0.5 text-xs font-black text-[#586257]">
                  {groupPredictionRows.length}
                </span>
              ) : null}
            </span>
            <ChevronDown
              size={18}
              className={cn("shrink-0 text-[#68736a] transition-transform", groupPredictionsOpen ? "rotate-180" : undefined)}
            />
          </button>
          {groupPredictionsOpen ? (
            <div className="border-t border-[#dfe5d8] px-3 py-3">
              {canRevealGroupPredictions ? (
                <GroupPredictions
                  rows={groupPredictionRows}
                  homeName={homeName}
                  awayName={awayName}
                  result={result}
                />
              ) : (
                <p className="text-sm font-semibold text-[#68736a]">Se muestran cuando cierre la prediccion del partido.</p>
              )}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function GroupPredictions({
  rows,
  homeName,
  awayName,
  result
}: {
  rows: { prediction: Prediction; userName: string }[];
  homeName: string;
  awayName: string;
  result?: Result;
}) {
  if (!rows.length) {
    return <p className="text-sm font-semibold text-[#68736a]">Todavia no hay predicciones cargadas para este partido.</p>;
  }

  return (
    <div className="grid gap-2">
      {rows.map(({ prediction, userName }) => (
        <div key={prediction.id} className="grid gap-2 rounded-md bg-[#f2f5ee] px-3 py-2 sm:grid-cols-[1fr_auto_auto] sm:items-center">
          <p className="min-w-0 truncate text-sm font-bold text-ink">{userName}</p>
          <div className="text-sm font-black text-ink">
            {prediction.homeGoals === null || prediction.awayGoals === null
              ? "Sin prediccion"
              : `${homeName} ${prediction.homeGoals} - ${prediction.awayGoals} ${awayName}`}
            {prediction.qualifiedTeamId ? (
              <span className="ml-2 text-xs font-bold text-[#68736a]">pasa {teamName(prediction.qualifiedTeamId)}</span>
            ) : null}
          </div>
          <p className="text-sm font-black text-pitch sm:text-right">{result ? `${prediction.points} pts` : "Pts pendientes"}</p>
        </div>
      ))}
    </div>
  );
}

function isValidGoal(value: string) {
  const number = Number(value);
  return value !== "" && Number.isInteger(number) && number >= 0;
}

function statusLabel(status: SaveStatus) {
  if (status === "saving") return "Guardando...";
  if (status === "saved") return "Guardado";
  if (status === "error") return "Error al guardar";
  if (status === "dirty") return "Cambios pendientes";
  return "Guardado automatico";
}
