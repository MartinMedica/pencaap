"use client";

import { useMemo } from "react";
import { rankingForPool } from "@/lib/scoring";
import type { AppState } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const medals = ["🥇", "🥈", "🥉"];

export function Ranking({ state, poolId }: { state: AppState; poolId: string }) {
  const rows = useMemo(() => rankingForPool(state, poolId), [state, poolId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Ranking</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div key={row.userId} className="grid grid-cols-[40px_1fr_auto] items-center gap-3 rounded-md bg-[#f2f5ee] px-3 py-3">
              <span className="text-lg font-black text-pitch">{medals[index] ?? index + 1}</span>
              <p className="font-bold">{row.name}</p>
              <p className="text-xl font-black">{row.points}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
