import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { matchSettingSelect, toUiMatchSetting, toUiResult } from "./db-mappers";
import { dbTeams, matches } from "./fixture";
import { recalculatePredictions } from "./scoring";
import type { AppState, Phase, User } from "./types";
import type { MemberRole, Phase as DbPhase } from "@prisma/client";

const phaseToDb: Record<Phase, DbPhase> = {
  Grupos: "GRUPOS",
  "16avos": "DIECISEISAVOS",
  Octavos: "OCTAVOS",
  Cuartos: "CUARTOS",
  Semifinal: "SEMIFINAL",
  "Tercer puesto": "TERCER_PUESTO",
  Final: "FINAL"
};

let fixtureSeedPromise: Promise<void> | null = null;

export async function ensureFixture() {
  fixtureSeedPromise ??= seedFixtureIfNeeded();
  return fixtureSeedPromise;
}

async function seedFixtureIfNeeded() {
  const [teamCount, matchCount] = await Promise.all([prisma.team.count(), prisma.match.count()]);
  if (teamCount >= dbTeams.length && matchCount >= matches.length) return;

  await prisma.$transaction([
    ...dbTeams.map((team) =>
      prisma.team.upsert({
        where: { id: team.id },
        update: { name: team.name, group: team.group ?? null },
        create: { id: team.id, name: team.name, group: team.group ?? null }
      })
    ),
    ...matches.map((match) =>
      prisma.match.upsert({
        where: { id: match.id },
        update: {
          phase: phaseToDb[match.phase],
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          startsAt: new Date(match.startsAt),
          order: match.order,
          knockout: match.knockout,
          predictionLockMode: match.predictionLockMode
        },
        create: {
          id: match.id,
          phase: phaseToDb[match.phase],
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          homeTeamOverrideId: null,
          awayTeamOverrideId: null,
          startsAt: new Date(match.startsAt),
          order: match.order,
          knockout: match.knockout,
          predictionLockMode: match.predictionLockMode,
          predictionLockUpdatedAt: null
        }
      })
    )
  ]);
}

export async function ensureCurrentDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId)?.emailAddress ?? `${clerkUser.id}@clerk.local`;
  const name = clerkUser.fullName ?? clerkUser.username ?? email ?? "Usuario";
  const existingByClerk = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (existingByClerk) {
    return prisma.user.update({
      where: { id: existingByClerk.id },
      data: { name, email }
    });
  }

  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingByEmail) {
    return prisma.user.update({
      where: { id: existingByEmail.id },
      data: { clerkId: clerkUser.id, name }
    });
  }

  return prisma.user.create({
    data: {
      clerkId: clerkUser.id,
      name,
      email
    }
  });
}

export async function getAppStateForUser(userId?: string): Promise<AppState> {
  await ensureFixture();

  const visiblePoolIds = userId
    ? (await prisma.poolMember.findMany({ where: { userId }, select: { poolId: true } })).map((member) => member.poolId)
    : [];

  const [users, pools, poolMembers, predictions, results, dbMatches] = await Promise.all([
    prisma.user.findMany({ where: userId ? { memberships: { some: { poolId: { in: visiblePoolIds } } } } : { id: "__none__" } }),
    prisma.pool.findMany({ where: { id: { in: visiblePoolIds } } }),
    prisma.poolMember.findMany({ where: { poolId: { in: visiblePoolIds } } }),
    prisma.prediction.findMany({ where: { poolId: { in: visiblePoolIds } } }),
    prisma.result.findMany(),
    prisma.match.findMany({ select: matchSettingSelect })
  ]);

  const state: AppState = {
    users: users.map((user) => ({ id: user.id, name: user.name, email: user.email })),
    pools: pools.map((pool) => ({
      id: pool.id,
      name: pool.name,
      inviteCode: pool.inviteCode,
      ownerId: pool.ownerId
    })),
    poolMembers: poolMembers.map((member) => ({
      poolId: member.poolId,
      userId: member.userId,
      role: roleToUi(member.role),
      joinedAt: member.joinedAt.toISOString()
    })),
    predictions: predictions.map((prediction) => ({
      id: prediction.id,
      poolId: prediction.poolId,
      userId: prediction.userId,
      matchId: prediction.matchId,
      homeGoals: prediction.homeGoals,
      awayGoals: prediction.awayGoals,
      qualifiedTeamId: prediction.qualifiedTeamId,
      points: prediction.points,
      updatedAt: prediction.updatedAt.toISOString()
    })),
    results: results.map(toUiResult),
    matchSettings: dbMatches.map(toUiMatchSetting)
  };

  return {
    ...state,
    predictions: recalculatePredictions(state)
  };
}

export function uiUser(user: User | Awaited<ReturnType<typeof ensureCurrentDbUser>>): User | null {
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email };
}

function roleToUi(role: MemberRole) {
  return role === "ADMIN" ? "admin" : "member";
}
