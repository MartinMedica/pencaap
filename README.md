# Penca Mundial 2026

MVP en Next.js + React + Tailwind para crear una penca, compartir invitacion, cargar predicciones, administrar resultados y ver ranking.

## Correr local

```bash
pnpm install
cp .env.example .env.local
pnpm db:generate
pnpm db:push
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Que incluye

- Home publica breve.
- Login simple local, listo para reemplazar por Clerk.
- Crear penca con owner/admin.
- Unirse por codigo o link `?invite=CODIGO`.
- Fixture separado por fases.
- Predicciones por partido con goles y clasificado en eliminatorias.
- Bloqueo de edicion cuando empieza el partido.
- Dashboard admin simple para cargar resultados reales.
- Recalculo de puntos al cargar resultados.
- Ranking por penca sumando puntos de predicciones y bonus.
- Modelo Prisma base para MySQL/PlanetScale.

## Clerk + Neon + Vercel

La app usa Clerk para auth y Prisma/Postgres para datos. Neon tiene free tier y funciona bien con Vercel para este MVP.

Variables necesarias en `.env.local` y en Vercel:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DATABASE_URL=
```

Despues de configurar `DATABASE_URL`, correr:

```bash
pnpm db:generate
pnpm db:push
```

En Neon, usar el connection string de Postgres con SSL, por ejemplo:

```bash
postgresql://USER:PASSWORD@HOST.neon.tech/DATABASE?sslmode=require&channel_binding=require
```

El fixture se siembra automaticamente al cargar la app. Reemplazar `lib/fixture.ts` por el fixture oficial completo cuando este cerrado.

### Deploy rapido en Vercel

1. Subir el repo a GitHub.
2. Importar el repo en Vercel como proyecto Next.js.
3. Agregar las variables `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` y `DATABASE_URL` en Production, Preview y Development.
4. Deployar. El build corre `prisma generate && next build`.
5. Correr una vez `pnpm db:push` contra Neon desde local, o ejecutar `prisma db push` desde un entorno con `DATABASE_URL`.

## Puntaje

- Resultado exacto: 5 puntos.
- Acertar ganador o empate: 3 puntos.
- Acertar goles de un equipo: 1 punto extra por equipo.
- En eliminatorias, acertar clasificado: 3 puntos.
- Bonus campeon: 10 puntos.
- Bonus finalista: 5 puntos por finalista.
