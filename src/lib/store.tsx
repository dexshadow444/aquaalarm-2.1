"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Simulated Convex client.
//
// In the spec this is a Convex backend with real tables and mutations. For a
// zero-config, deploy-anywhere demo (Vercel included) the same API surface is
// provided by a client-side store: deterministic seed data, a prediction
// engine, localStorage persistence and a subscribe/useSyncExternalStore
// interface so components re-render exactly like they would against Convex
// reactive queries.
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
import type { AppState, User } from "./types";
import { buildInitialState } from "./data/seed";
import { runPredictionCycle } from "./engine";

const STORAGE_KEY = "aquaalarm-state-v1";

function buildFresh(): AppState {
  return buildInitialState();
}

let state: AppState = buildFresh();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function setState(next: AppState) {
  state = next;
  try {
    if (typeof window !== "undefined") {
      const toPersist: Record<string, unknown> = { ...next };
      delete toPersist.hydrated;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
    }
  } catch {
    // storage unavailable (private mode) — demo still works in-memory
  }
  emit();
}

export function getState(): AppState {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ── Actions (the "mutations") ─────────────────────────────────────────────────

export function login(user: User) {
  setState({ ...state, session: user });
}

export function logout() {
  setState({ ...state, session: null });
}

/** Runs the daily prediction cycle for all taluks. */
export function runCycle() {
  setState(runPredictionCycle(state));
}

export function toggleAutoRestriction(talukId: string) {
  setState({
    ...state,
    autoRestriction: {
      ...state.autoRestriction,
      [talukId]: !(state.autoRestriction[talukId] ?? true),
    },
  });
}

/** Wipes persisted state back to the seed demo data. */
export function resetDemo() {
  setState(buildFresh());
}

// ── Provider: hydrates persisted state on first client render ────────────────

const AppContext = createContext<null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        if (
          parsed &&
          Array.isArray(parsed.taluks) &&
          parsed.taluks.length > 0
        ) {
          state = { ...parsed, hydrated: true };
          emit();
          return;
        }
      }
    } catch {
      // fall through to fresh seed
    }
    if (!state.hydrated) {
      state = { ...state, hydrated: true };
      emit();
    }
  }, []);
  return <AppContext.Provider value={null}>{children}</AppContext.Provider>;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Reactive read of the whole simulated database. */
export function useApp(): AppState {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function useSession(): User | null {
  return useApp().session;
}

/** True after the first client render (avoids hydration mismatches). */
const emptySubscribe = () => () => {};

export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true, // client snapshot
    () => false // server snapshot
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
