import type { AppState } from "./types";

export function firstPoolForUser(state: AppState, userId: string) {
  const membership = state.poolMembers.find((member) => member.userId === userId);
  return state.pools.find((pool) => pool.id === membership?.poolId) ?? null;
}
