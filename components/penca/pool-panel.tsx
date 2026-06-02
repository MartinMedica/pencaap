"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { Pool } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { TextField } from "./form-fields";

type PoolPanelProps = {
  pools: Pool[];
  activePool: Pool | null;
  inviteUrl: string;
  copied: boolean;
  isPending: boolean;
  onCopied: () => void;
  onCreate: (name: string) => void;
  onJoin: (code: string) => void;
  onSelect: (poolId: string) => void;
};

export function PoolPanel({
  pools,
  activePool,
  inviteUrl,
  copied,
  isPending,
  onCopied,
  onCreate,
  onJoin,
  onSelect
}: PoolPanelProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis pencas</CardTitle>
      </CardHeader>
      <CardContent>
        {pools.length ? (
          <Select value={activePool?.id} onChange={(event) => onSelect(event.target.value)}>
            {pools.map((pool) => (
              <option key={pool.id} value={pool.id}>
                {pool.name}
              </option>
            ))}
          </Select>
        ) : null}

        {activePool ? (
          <div className="mt-3 rounded-md bg-[#eef4e9] p-3">
            <p className="text-xs font-semibold uppercase text-[#64705f]">Invitacion</p>
            <p className="mt-1 font-mono text-lg font-bold">{activePool.inviteCode}</p>
            <Button className="mt-2 w-full" size="sm" onClick={onCopied}>
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copiado" : "Copiar link"}
            </Button>
            <p className="mt-2 break-all text-xs text-[#68736a]">{inviteUrl}</p>
          </div>
        ) : null}

        <form
          className="mt-4 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim()) {
              onCreate(name);
              setName("");
            }
          }}
        >
          <TextField label="Crear penca" value={name} onChange={setName} placeholder="Los del grupo" />
          <Button className="w-full" variant="primary" disabled={isPending}>
            Crear
          </Button>
        </form>

        <form
          className="mt-4 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (code.trim()) {
              onJoin(code);
              setCode("");
            }
          }}
        >
          <TextField label="Unirse por codigo" value={code} onChange={setCode} placeholder="ABC123" />
          <Button className="w-full" variant="outline" disabled={isPending}>
            Unirme
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
