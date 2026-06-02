"use server";

import { prisma } from "@/lib/prisma";
import { isGlobalAdmin } from "@/lib/admin";
import { getAppStateForUser, ensureCurrentDbUser } from "@/lib/db-state";
import { matchSettingSelect, toUiMatchSetting, toUiResult } from "@/lib/db-mappers";
import { dbTeams, displayTeamId, isMatchResolved, matches } from "@/lib/fixture";
import { predictionLocked } from "@/lib/locks";
import { scorePrediction } from "@/lib/scoring";
import type { AppState, Match, MatchLockMode, Result } from "@/lib/types";

const inviteCodePattern = /^[A-Z0-9]{6,12}$/;
const maxPoolNameLength = 80;
const maxGoals = 99;
const validLockModes = new Set<MatchLockMode>(["AUTO", "LOCKED", "OPEN"]);
const validTeamIds = new Set(dbTeams.map((team) => team.id));

export async function createPoolAction(name: string): Promise<{ state: AppState; poolId: string }> {
  const user = await requireUser();
  const poolName = normalizePoolName(name);
  const inviteCode = await createInviteCode();

  const pool = await prisma.pool.create({
    data: {
      name: poolName,
      inviteCode,
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: "MEMBER"
        }
      }
    }
  });

  return { state: await getAppStateForUser(user.id), poolId: pool.id };
}

export async function joinPoolAction(code: string): Promise<AppState> {
  const user = await requireUser();
  const inviteCode = normalizeInviteCode(code);
  const pool = await prisma.pool.findUniqueOrThrow({ where: { inviteCode } });

  await prisma.poolMember.upsert({
    where: { poolId_userId: { poolId: pool.id, userId: user.id } },
    update: {},
    create: { poolId: pool.id, userId: user.id, role: "MEMBER" }
  });

  return getAppStateForUser(user.id);
}

export async function updateMatchLockAction(input: { poolId: string; matchId: string; mode: MatchLockMode }): Promise<AppState> {
  const user = await requireUser();
  await requireGlobalAdmin(user);
  assertKnownMatch(input.matchId);
  assertLockMode(input.mode);
  await prisma.match.update({ where: { id: input.matchId }, data: { predictionLockMode: input.mode, predictionLockUpdatedAt: new Date() } });

  return getAppStateForUser(user.id);
}

export async function updatePhaseLockAction(input: { poolId: string; matchIds: string[]; mode: MatchLockMode }): Promise<AppState> {
  const user = await requireUser();
  await requireGlobalAdmin(user);
  assertLockMode(input.mode);
  const matchIds = uniqueKnownMatchIds(input.matchIds);
  if (!matchIds.length) throw new Error("No hay partidos validos para actualizar");
  await prisma.match.updateMany({ where: { id: { in: matchIds } }, data: { predictionLockMode: input.mode, predictionLockUpdatedAt: new Date() } });

  return getAppStateForUser(user.id);
}

export async function updateMatchTeamOverrideAction(input: {
  poolId: string;
  matchId: string;
  side: "home" | "away";
  teamId: string | null;
}): Promise<AppState> {
  const user = await requireUser();
  await requireGlobalAdmin(user);
  const match = assertKnownMatch(input.matchId);
  const teamId = normalizeTeamOverride(input.teamId, match, input.side);

  await prisma.match.update({
    where: { id: input.matchId },
    data: input.side === "home" ? { homeTeamOverrideId: teamId } : { awayTeamOverrideId: teamId }
  });

  return getAppStateForUser(user.id);
}

export async function savePredictionAction(input: {
  poolId: string;
  matchId: string;
  homeGoals: number | null;
  awayGoals: number | null;
  qualifiedTeamId: string | null;
}): Promise<AppState> {
  const user = await requireUser();
  const match = assertKnownMatch(input.matchId);
  const homeGoals = normalizeOptionalGoals(input.homeGoals);
  const awayGoals = normalizeOptionalGoals(input.awayGoals);

  await prisma.poolMember.findUniqueOrThrow({ where: { poolId_userId: { poolId: input.poolId, userId: user.id } } });
  const dbMatch = await prisma.match.findUnique({ where: { id: input.matchId }, select: { id: true, predictionLockMode: true, predictionLockUpdatedAt: true } });
  if (
    predictionLocked(match, dbMatch ? {
      matchId: dbMatch.id,
      predictionLockMode: dbMatch.predictionLockMode,
      predictionLockUpdatedAt: dbMatch.predictionLockUpdatedAt?.toISOString() ?? null
    } : undefined)
  ) {
    throw new Error("La prediccion ya esta bloqueada");
  }
  const resolutionState = await getResolutionState();
  if (!isMatchResolved(match, resolutionState)) throw new Error("El partido todavia no tiene equipos definidos");
  const qualifiedTeamId = normalizeQualifiedTeam(input.qualifiedTeamId, match, resolutionState, homeGoals, awayGoals, false);

  const result = await prisma.result.findUnique({ where: { matchId: input.matchId } });
  const points =
    homeGoals === null || awayGoals === null
      ? 0
      : scorePrediction(
          {
            id: "",
            poolId: input.poolId,
            userId: user.id,
            matchId: input.matchId,
            homeGoals,
            awayGoals,
            qualifiedTeamId,
            points: 0,
            updatedAt: new Date().toISOString()
          },
          result
            ? {
                matchId: result.matchId,
                homeGoals: result.homeGoals,
                awayGoals: result.awayGoals,
                qualifiedTeamId: result.qualifiedTeamId
              }
            : undefined,
          match
        );

  await prisma.prediction.upsert({
    where: { poolId_userId_matchId: { poolId: input.poolId, userId: user.id, matchId: input.matchId } },
    update: { homeGoals, awayGoals, qualifiedTeamId, points },
    create: {
      poolId: input.poolId,
      userId: user.id,
      matchId: input.matchId,
      homeGoals,
      awayGoals,
      qualifiedTeamId,
      points
    }
  });

  return getAppStateForUser(user.id);
}

export async function saveResultAction(result: Result): Promise<AppState> {
  const user = await requireUser();
  const match = assertKnownMatch(result.matchId);
  const resolutionState = await getResolutionState();
  if (!isMatchResolved(match, resolutionState)) throw new Error("El partido todavia no tiene equipos definidos");
  const normalizedResult = normalizeResult(result, match, resolutionState);

  await requireGlobalAdmin(user);

  await prisma.result.upsert({
    where: { matchId: normalizedResult.matchId },
    update: {
      homeGoals: normalizedResult.homeGoals,
      awayGoals: normalizedResult.awayGoals,
      qualifiedTeamId: normalizedResult.qualifiedTeamId,
      championTeamId: normalizedResult.championTeamId,
      finalistTeamIds: normalizedResult.finalistTeamIds ?? []
    },
    create: {
      matchId: normalizedResult.matchId,
      homeGoals: normalizedResult.homeGoals,
      awayGoals: normalizedResult.awayGoals,
      qualifiedTeamId: normalizedResult.qualifiedTeamId,
      championTeamId: normalizedResult.championTeamId,
      finalistTeamIds: normalizedResult.finalistTeamIds ?? []
    }
  });

  await recalculateMatch(normalizedResult);
  return getAppStateForUser(user.id);
}

async function requireUser() {
  const user = await ensureCurrentDbUser();
  if (!user) throw new Error("Tenes que iniciar sesion");
  return user;
}

async function requireGlobalAdmin(user: Awaited<ReturnType<typeof requireUser>>) {
  if (!isGlobalAdmin(user)) throw new Error("Solo un admin global puede editar resultados");
}

async function createInviteCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let index = 0; index < 5; index += 1) {
    const code = Array.from(crypto.getRandomValues(new Uint8Array(8)), (value) => alphabet[value % alphabet.length]).join("");
    const existing = await prisma.pool.findUnique({ where: { inviteCode: code } });
    if (!existing) return code;
  }
  return crypto.randomUUID().slice(0, 8).toUpperCase();
}

async function recalculateMatch(result: Result) {
  const match = matches.find((item) => item.id === result.matchId);
  const predictions = await prisma.prediction.findMany({ where: { matchId: result.matchId } });

  await prisma.$transaction(
    predictions.map((prediction) =>
      prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          points: scorePrediction(
            {
              id: prediction.id,
              poolId: prediction.poolId,
              userId: prediction.userId,
              matchId: prediction.matchId,
              homeGoals: prediction.homeGoals,
              awayGoals: prediction.awayGoals,
              qualifiedTeamId: prediction.qualifiedTeamId,
              points: prediction.points,
              updatedAt: prediction.updatedAt.toISOString()
            },
            result,
            match
          )
        }
      })
    )
  );
}

function normalizePoolName(name: string) {
  const poolName = name.trim().replace(/\s+/g, " ");
  if (!poolName) throw new Error("El nombre de la penca es obligatorio");
  if (poolName.length > maxPoolNameLength) throw new Error(`El nombre no puede superar ${maxPoolNameLength} caracteres`);
  return poolName;
}

function normalizeInviteCode(code: string) {
  const inviteCode = code.trim().toUpperCase();
  if (!inviteCodePattern.test(inviteCode)) throw new Error("Codigo de invitacion invalido");
  return inviteCode;
}

function assertKnownMatch(matchId: string) {
  const match = matches.find((item) => item.id === matchId);
  if (!match) throw new Error("Partido no encontrado");
  return match;
}

function uniqueKnownMatchIds(matchIds: string[]) {
  const knownMatchIds = new Set(matches.map((match) => match.id));
  return Array.from(new Set(matchIds)).filter((matchId) => knownMatchIds.has(matchId));
}

function assertLockMode(mode: MatchLockMode) {
  if (!validLockModes.has(mode)) throw new Error("Modo de bloqueo invalido");
}

function normalizeOptionalGoals(value: number | null) {
  if (value === null) return null;
  if (!Number.isInteger(value) || value < 0 || value > maxGoals) throw new Error(`Los goles deben estar entre 0 y ${maxGoals}`);
  return value;
}

function normalizeRequiredGoals(value: number) {
  if (!Number.isInteger(value) || value < 0 || value > maxGoals) throw new Error(`Los goles deben estar entre 0 y ${maxGoals}`);
  return value;
}

function normalizeQualifiedTeam(
  teamId: string | null,
  match: Match,
  state: AppState,
  homeGoals: number | null,
  awayGoals: number | null,
  allowGroupDrawWinner: boolean
) {
  if (!teamId) return null;
  if (homeGoals === null || awayGoals === null) return null;
  const requiresQualifiedTeam = match.knockout || (allowGroupDrawWinner && homeGoals === awayGoals);
  if (!requiresQualifiedTeam) return null;
  const homeTeamId = displayTeamId(match, "home", state);
  const awayTeamId = displayTeamId(match, "away", state);
  if (teamId !== homeTeamId && teamId !== awayTeamId) throw new Error("Equipo clasificado invalido");
  return teamId;
}

function normalizeTeamOverride(teamId: string | null, match: (typeof matches)[number], side: "home" | "away") {
  if (!teamId) return null;
  const candidate = side === "home" ? match.homeTeamId : match.awayTeamId;
  if (teamId === candidate || validTeamIds.has(teamId)) return teamId;
  throw new Error("Equipo invalido para el cruce");
}

function normalizeResult(result: Result, match: (typeof matches)[number], state: AppState): Result {
  const homeGoals = normalizeRequiredGoals(result.homeGoals);
  const awayGoals = normalizeRequiredGoals(result.awayGoals);
  const qualifiedTeamId = normalizeQualifiedTeam(result.qualifiedTeamId, match, state, homeGoals, awayGoals, true);

  return {
    matchId: result.matchId,
    homeGoals,
    awayGoals,
    qualifiedTeamId,
    championTeamId: match.phase === "Final" && result.championTeamId && validTeamIds.has(result.championTeamId) ? result.championTeamId : undefined,
    finalistTeamIds: match.phase === "Final" ? normalizeFinalistTeamIds(result.finalistTeamIds) : []
  };
}

function normalizeFinalistTeamIds(teamIds: string[] | undefined) {
  return Array.from(new Set(teamIds ?? [])).filter((teamId) => validTeamIds.has(teamId)).slice(0, 2);
}

async function getResolutionState(): Promise<AppState> {
  const [results, dbMatches] = await Promise.all([
    prisma.result.findMany(),
    prisma.match.findMany({ select: matchSettingSelect })
  ]);

  return {
    users: [],
    pools: [],
    poolMembers: [],
    predictions: [],
    results: results.map(toUiResult),
    matchSettings: dbMatches.map(toUiMatchSetting)
  };
}
