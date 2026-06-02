"use client";

import { phaseEnabled, phases } from "@/lib/fixture";
import type { AppState } from "@/lib/types";
import { Button } from "@/components/ui/button";
import type { PhaseValue } from "./types";

type PhaseFilterProps = {
  activePhase: PhaseValue;
  state: AppState;
  onPhase: (phase: PhaseValue) => void;
};

export function PhaseFilter({ activePhase, state, onPhase }: PhaseFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {phases.map((phase) => {
        const enabled = phaseEnabled(phase, state);
        return (
          <Button
            key={phase}
            variant={activePhase === phase ? "default" : "ghost"}
            className={activePhase === phase ? "shrink-0" : "shrink-0 bg-white"}
            disabled={!enabled}
            onClick={() => onPhase(phase)}
          >
            {phase}
          </Button>
        );
      })}
    </div>
  );
}
