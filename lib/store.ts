"use client";

import { matches } from "./fixture";
import { recalculatePredictions } from "./scoring";
import type { AppState, Pool, Prediction, Result, User } from "./types";

const stateKey = "penca-2026-state";
const userKey = "penca-2026-user";

export const emptyState: AppState = {
  users: [],
  pools: [],
  poolMembers: [],
  predictions: [],
  results: [],
  matchSettings: []
};

export function loadState(): AppState {
  if (typeof window === "undefined") return emptyState;
  const raw = window.localStorage.getItem(stateKey);
  return raw ? JSON.parse(raw) : emptyState;
}

export function saveState(state: AppState) {
  window.localStorage.setItem(stateKey, JSON.stringify({ ...state, predictions: recalculatePredictions(state) }));
}

export function loadCurrentUser() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(userKey);
  return raw ? (JSON.parse(raw) as User) : null;
}

export function saveCurrentUser(user: User) {
  window.localStorage.setItem(userKey, JSON.stringify(user));
}

export function createUser(name: string, email: string): User {
  return { id: crypto.randomUUID(), name: name.trim(), email: email.trim().toLowerCase() };
}

export function createPool(name: string, ownerId: string): Pool {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    inviteCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
    ownerId
  };
}

export function upsertPrediction(state: AppState, prediction: Omit<Prediction, "id" | "points" | "updatedAt">) {
  const existing = state.predictions.find(
    (item) => item.poolId === prediction.poolId && item.userId === prediction.userId && item.matchId === prediction.matchId
  );
  const nextPrediction: Prediction = {
    ...prediction,
    id: existing?.id ?? crypto.randomUUID(),
    points: existing?.points ?? 0,
    updatedAt: new Date().toISOString()
  };
  const predictions = existing
    ? state.predictions.map((item) => (item.id === existing.id ? nextPrediction : item))
    : [...state.predictions, nextPrediction];

  return { ...state, predictions: recalculatePredictions({ ...state, predictions }) };
}

export function upsertResult(state: AppState, result: Result) {
  const existing = state.results.find((item) => item.matchId === result.matchId);
  const results = existing
    ? state.results.map((item) => (item.matchId === result.matchId ? result : item))
    : [...state.results, result];

  return { ...state, results, predictions: recalculatePredictions({ ...state, results }) };
}

export function firstPoolForUser(state: AppState, userId: string) {
  const membership = state.poolMembers.find((member) => member.userId === userId);
  return state.pools.find((pool) => pool.id === membership?.poolId) ?? null;
}

export function matchLocked(matchId: string) {
  const match = matches.find((item) => item.id === matchId);
  return match ? new Date(match.startsAt).getTime() <= Date.now() : false;
}
