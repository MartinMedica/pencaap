"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { CalendarDays, LogIn, Shield, Trophy, Users } from "lucide-react";
import type { User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function Hero({ user }: { user: User | null }) {
  return (
    <section className="bg-ink text-white">
      <div className="mx-auto grid min-h-[420px] max-w-6xl content-end gap-8 px-4 py-8 md:grid-cols-[1fr_360px] md:items-end">
        <div className="pb-2">
          <Badge variant="subtle" className="mb-3 gap-2">
            <Trophy size={16} /> Mundial 2026 con amigos
          </Badge>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight md:text-6xl">Penca Mundial 2026</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#dce7df] md:text-lg">
            Crea un grupo, comparte el link, carga predicciones por fase y mira el ranking actualizarse cuando el admin
            ingresa los resultados.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3 text-sm text-[#dce7df]">
            <HeroMetric icon={<Users size={18} />} label="Grupos privados" />
            <HeroMetric icon={<CalendarDays size={18} />} label="Fixture por fases" />
            <HeroMetric icon={<Shield size={18} />} label="Edicion bloqueada" />
          </div>
        </div>
        {user ? <SignedInCard user={user} /> : <LoginCard />}
      </div>
    </section>
  );
}

function HeroMetric({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="mb-2 text-sun">{icon}</div>
      <p className="font-medium">{label}</p>
    </div>
  );
}

function LoginCard() {
  const [returnUrl, setReturnUrl] = useState("/");

  useEffect(() => {
    setReturnUrl(`${window.location.pathname}${window.location.search}`);
  }, []);

  return (
    <Card className="text-ink">
      <CardContent className="pt-4">
        <h2 className="text-lg font-bold">Entrar</h2>
        <p className="mt-2 text-sm leading-6 text-[#68736a]">
          Usa Clerk para entrar con email o proveedor social y mantener tus pencas sincronizadas.
        </p>
        <div className="mt-4 grid gap-2">
          <SignInButton mode="modal" forceRedirectUrl={returnUrl}>
            <Button variant="primary" size="lg" className="w-full">
              <LogIn size={18} /> Iniciar sesion
            </Button>
          </SignInButton>
          <SignUpButton mode="modal" forceRedirectUrl={returnUrl}>
            <Button variant="outline" size="lg" className="w-full">
              Crear cuenta
            </Button>
          </SignUpButton>
        </div>
      </CardContent>
    </Card>
  );
}

function SignedInCard({ user }: { user: User }) {
  return (
    <Card className="text-ink">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[#68736a]">Sesion activa</p>
            <p className="mt-1 text-xl font-bold">{user.name}</p>
            <p className="text-sm text-[#68736a]">{user.email}</p>
          </div>
          <UserButton />
        </div>
      </CardContent>
    </Card>
  );
}
