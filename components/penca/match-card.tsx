"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatMatchDate } from "@/lib/dates";
import { displayTeamId, displayTeamName, isMatchResolved, sideCandidateTeamIds } from "@/lib/fixture";
import { lockLabel, predictionLocked } from "@/lib/locks";
import { Lock, Unlock } from "lucide-react";
import type { AppState, Match, MatchLockMode, Prediction, Result } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreField, TeamSelect } from "./form-fields";
import { TeamLabel } from "./team-label";
import type { PredictionDraft, ResultHandler } from "./types";

type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

type MatchCardProps = {
  state: AppState;
  match: Match;
  prediction?: Prediction;
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
  const lastSavedRef = useRef("");
  const [editVersion, setEditVersion] = useState(0);
  const latestEditVersionRef = useRef(0);
  const savingVersionRef = useRef(0);
  const currentSignature = useMemo(
    () => `${adminMode ? "admin" : "prediction"}:${homeGoals}:${awayGoals}:${qualifiedTeamId}`,
    [adminMode, awayGoals, homeGoals, qualifiedTeamId]
  );
  const formattedStartsAt = useMemo(() => formatMatchDate(match.startsAt), [match.startsAt]);
  const predictionText =
    prediction?.homeGoals !== null && prediction?.homeGoals !== undefined && prediction?.awayGoals !== null && prediction?.awayGoals !== undefined
      ? `${homeName} ${prediction.homeGoals} - ${prediction.awayGoals} ${awayName}`
      : "Sin prediccion";
  const serverSignature = useMemo(
    () =>
      `${adminMode ? "admin" : "prediction"}:${adminMode ? result?.homeGoals ?? "" : prediction?.homeGoals ?? ""}:${
        adminMode ? result?.awayGoals ?? "" : prediction?.awayGoals ?? ""
      }:${adminMode ? result?.qualifiedTeamId ?? homeTeamId : prediction?.qualifiedTeamId ?? homeTeamId}`,
    [adminMode, homeTeamId, prediction, result]
  );

  useEffect(() => {
    if (editVersion > 0 || saveStatus === "saving") return;
    setHomeGoals(String(adminMode ? result?.homeGoals ?? "" : prediction?.homeGoals ?? ""));
    setAwayGoals(String(adminMode ? result?.awayGoals ?? "" : prediction?.awayGoals ?? ""));
    setQualifiedTeamId(adminMode ? result?.qualifiedTeamId ?? homeTeamId : prediction?.qualifiedTeamId ?? homeTeamId);
    lastSavedRef.current = serverSignature;
    setSaveStatus("idle");
  }, [adminMode, editVersion, homeTeamId, prediction, result, saveStatus, serverSignature]);

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
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-[#68736a]">{formattedStartsAt}</p>
            <h3 className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-lg font-bold">
              <TeamLabel teamId={homeTeamId} name={homeName} size="lg" />
              <span className="text-sm text-[#68736a]">vs</span>
              <TeamLabel teamId={awayTeamId} name={awayName} size="lg" />
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
          <Badge variant={!canEdit ? "destructive" : "default"}>{!resolved ? "Pendiente" : adminMode ? lockLabel(match, matchSetting) : canEdit ? "Editable" : "Bloqueado"}</Badge>
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
            <div className="mt-4 grid grid-cols-[1fr_76px_76px] items-end gap-2">
              <div className="text-sm font-semibold text-[#586257]">{adminMode ? "Resultado real" : "Tu prediccion"}</div>
              <ScoreField label={homeName} value={homeGoals} onChange={updateHomeGoals} disabled={!canEdit} />
              <ScoreField label={awayName} value={awayGoals} onChange={updateAwayGoals} disabled={!canEdit} />
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
      </CardContent>
    </Card>
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
