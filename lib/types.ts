export type Phase =
  | "Grupos"
  | "16avos"
  | "Octavos"
  | "Cuartos"
  | "Semifinal"
  | "Tercer puesto"
  | "Final";

export type User = {
  id: string;
  name: string;
  email: string;
};

export type Team = {
  id: string;
  name: string;
  group?: string;
  flagCode?: string;
};

export type TeamSeed = string;

export type Match = {
  id: string;
  phase: Phase;
  homeTeamId: string;
  awayTeamId: string;
  homeSeed?: TeamSeed;
  awaySeed?: TeamSeed;
  group?: string;
  startsAt: string;
  order: number;
  knockout: boolean;
  predictionLockMode: MatchLockMode;
};

export type Pool = {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
};

export type MatchLockMode = "AUTO" | "LOCKED" | "OPEN";

export type MatchSetting = {
  matchId: string;
  predictionLockMode: MatchLockMode;
  predictionLockUpdatedAt?: string | null;
  homeTeamOverrideId?: string | null;
  awayTeamOverrideId?: string | null;
};

export type PoolMember = {
  poolId: string;
  userId: string;
  role: "admin" | "member";
  joinedAt: string;
};

export type Prediction = {
  id: string;
  poolId: string;
  userId: string;
  matchId: string;
  homeGoals: number | null;
  awayGoals: number | null;
  qualifiedTeamId: string | null;
  points: number;
  updatedAt: string;
};

export type Result = {
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  qualifiedTeamId: string | null;
  championTeamId?: string;
  finalistTeamIds?: string[];
};

export type AppState = {
  users: User[];
  pools: Pool[];
  poolMembers: PoolMember[];
  predictions: Prediction[];
  results: Result[];
  matchSettings: MatchSetting[];
};
