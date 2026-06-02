import type { phases } from "@/lib/fixture";
import type { Match, Prediction, Result } from "@/lib/types";

export type AppTab = "predicciones" | "ranking" | "admin";

export type PhaseValue = (typeof phases)[number];

export type PredictionDraft = Omit<Prediction, "id" | "poolId" | "userId" | "matchId" | "points" | "updatedAt">;

export type PredictionHandler = (match: Match, prediction: PredictionDraft) => Promise<void>;

export type ResultHandler = (result: Result) => Promise<void>;
