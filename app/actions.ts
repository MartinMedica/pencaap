"use server";

import { prisma } from "@/lib/prisma";
import { isGlobalAdmin } from "@/lib/admin";
import { getAppStateForUser, ensureCurrentDbUser } from "@/lib/db-state";
import { matches } from "@/lib/fixture";
import { predictionLocked } from "@/lib/locks";
import { scorePrediction } from "@/lib/scoring";
import type { AppState, MatchLockMode, Result } from "@/lib/types";

export async function createPoolAction(name: string): Promise<AppState> {
  const user = await requireUser();
  const inviteCode = await createInviteCode();

  await prisma.pool.create({
    data: {
      name: name.trim(),
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

  return getAppStateForUser(user.id);
}

export async function joinPoolAction(code: string): Promise<AppState> {
  const user = await requireUser();
  const pool = await prisma.pool.findUniqueOrThrow({ where: { inviteCode: code.trim().toUpperCase() } });

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
  await prisma.match.update({ where: { id: input.matchId }, data: { predictionLockMode: input.mode, predictionLockUpdatedAt: new Date() } });

  return getAppStateForUser(user.id);
}

export async function updatePhaseLockAction(input: { poolId: string; matchIds: string[]; mode: MatchLockMode }): Promise<AppState> {
  const user = await requireUser();
  await requireGlobalAdmin(user);
  await prisma.match.updateMany({ where: { id: { in: input.matchIds } }, data: { predictionLockMode: input.mode, predictionLockUpdatedAt: new Date() } });

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

  await prisma.match.update({
    where: { id: input.matchId },
    data: input.side === "home" ? { homeTeamOverrideId: input.teamId } : { awayTeamOverrideId: input.teamId }
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
  const match = matches.find((item) => item.id === input.matchId);
  if (!match) throw new Error("Partido no encontrado");

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

  const result = await prisma.result.findUnique({ where: { matchId: input.matchId } });
  const points =
    input.homeGoals === null || input.awayGoals === null
      ? 0
      : scorePrediction(
          {
            id: "",
            poolId: input.poolId,
            userId: user.id,
            matchId: input.matchId,
            homeGoals: input.homeGoals,
            awayGoals: input.awayGoals,
            qualifiedTeamId: input.qualifiedTeamId,
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
    update: { homeGoals: input.homeGoals, awayGoals: input.awayGoals, qualifiedTeamId: input.qualifiedTeamId, points },
    create: {
      poolId: input.poolId,
      userId: user.id,
      matchId: input.matchId,
      homeGoals: input.homeGoals,
      awayGoals: input.awayGoals,
      qualifiedTeamId: input.qualifiedTeamId,
      points
    }
  });

  return getAppStateForUser(user.id);
}

export async function saveResultAction(result: Result): Promise<AppState> {
  const user = await requireUser();
  const match = matches.find((item) => item.id === result.matchId);
  if (!match) throw new Error("Partido no encontrado");

  await requireGlobalAdmin(user);

  await prisma.result.upsert({
    where: { matchId: result.matchId },
    update: {
      homeGoals: result.homeGoals,
      awayGoals: result.awayGoals,
      qualifiedTeamId: result.qualifiedTeamId,
      championTeamId: result.championTeamId,
      finalistTeamIds: result.finalistTeamIds ?? []
    },
    create: {
      matchId: result.matchId,
      homeGoals: result.homeGoals,
      awayGoals: result.awayGoals,
      qualifiedTeamId: result.qualifiedTeamId,
      championTeamId: result.championTeamId,
      finalistTeamIds: result.finalistTeamIds ?? []
    }
  });

  await recalculateMatch(result);
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
  for (let index = 0; index < 5; index += 1) {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
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
