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
    <div className="flex flex-wrap gap-2 pb-1">
      {phases.map((phase) => {
        const enabled = phaseEnabled(phase, state);
        return (
          <Button
            key={phase}
            variant={activePhase === phase ? "default" : "ghost"}
            className={activePhase === phase ? "min-w-0 flex-1 basis-[calc(50%-0.25rem)] px-2 sm:flex-none sm:basis-auto sm:px-4" : "min-w-0 flex-1 basis-[calc(50%-0.25rem)] bg-white px-2 sm:flex-none sm:basis-auto sm:px-4"}
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
