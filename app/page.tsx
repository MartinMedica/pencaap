import { PencaApp } from "@/components/penca-app";
import { isGlobalAdmin } from "@/lib/admin";
import { ensureCurrentDbUser, getAppStateForUser, uiUser } from "@/lib/db-state";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const dbUser = await ensureCurrentDbUser();
  const { invite } = await searchParams;
  let invitedPoolId: string | null = null;

  if (dbUser && invite) {
    const pool = await prisma.pool.findUnique({ where: { inviteCode: invite.toUpperCase() } });
    if (pool) {
      invitedPoolId = pool.id;
      await prisma.poolMember.upsert({
        where: { poolId_userId: { poolId: pool.id, userId: dbUser.id } },
        update: {},
        create: { poolId: pool.id, userId: dbUser.id, role: "MEMBER" }
      });
    }
  }

  const state = await getAppStateForUser(dbUser?.id);

  return <PencaApp initialState={state} currentUser={uiUser(dbUser)} initialActivePoolId={invitedPoolId} isGlobalAdmin={isGlobalAdmin(dbUser)} />;
}
