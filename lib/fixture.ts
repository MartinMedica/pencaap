import type { AppState, Match, Phase, Team } from "./types";

export const phases: Phase[] = ["Grupos", "16avos", "Octavos", "Cuartos", "Semifinal", "Tercer puesto", "Final"];

export const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

export const teams: Team[] = [
  { id: "mex", name: "Mexico", group: "A", flagCode: "mx" },
  { id: "rsa", name: "Sudáfrica", group: "A", flagCode: "za" },
  { id: "kor", name: "Corea del Sur", group: "A", flagCode: "kr" },
  { id: "cze", name: "Chequia", group: "A", flagCode: "cz" },
  { id: "can", name: "Canada", group: "B", flagCode: "ca" },
  { id: "sui", name: "Suiza", group: "B", flagCode: "ch" },
  { id: "qat", name: "Qatar", group: "B", flagCode: "qa" },
  { id: "bih", name: "Bosnia y Herzegovina", group: "B", flagCode: "ba" },
  { id: "bra", name: "Brasil", group: "C", flagCode: "br" },
  { id: "mar", name: "Marruecos", group: "C", flagCode: "ma" },
  { id: "hai", name: "Haití", group: "C", flagCode: "ht" },
  { id: "sco", name: "Escocia", group: "C", flagCode: "gb-sct" },
  { id: "usa", name: "Estados Unidos", group: "D", flagCode: "us" },
  { id: "par", name: "Paraguay", group: "D", flagCode: "py" },
  { id: "aus", name: "Australia", group: "D", flagCode: "au" },
  { id: "tur", name: "Turquía", group: "D", flagCode: "tr" },
  { id: "ger", name: "Alemania", group: "E", flagCode: "de" },
  { id: "cuw", name: "Curazao", group: "E", flagCode: "cw" },
  { id: "civ", name: "Costa de Marfil", group: "E", flagCode: "ci" },
  { id: "ecu", name: "Ecuador", group: "E", flagCode: "ec" },
  { id: "ned", name: "Países Bajos", group: "F", flagCode: "nl" },
  { id: "jpn", name: "Japón", group: "F", flagCode: "jp" },
  { id: "tun", name: "Túnez", group: "F", flagCode: "tn" },
  { id: "swe", name: "Suecia", group: "F", flagCode: "se" },
  { id: "bel", name: "Bélgica", group: "G", flagCode: "be" },
  { id: "egy", name: "Egipto", group: "G", flagCode: "eg" },
  { id: "irn", name: "Irán", group: "G", flagCode: "ir" },
  { id: "nzl", name: "Nueva Zelanda", group: "G", flagCode: "nz" },
  { id: "esp", name: "España", group: "H", flagCode: "es" },
  { id: "cpv", name: "Cabo Verde", group: "H", flagCode: "cv" },
  { id: "ksa", name: "Arabia Saudita", group: "H", flagCode: "sa" },
  { id: "uru", name: "Uruguay", group: "H", flagCode: "uy" },
  { id: "fra", name: "Francia", group: "I", flagCode: "fr" },
  { id: "sen", name: "Senegal", group: "I", flagCode: "sn" },
  { id: "nor", name: "Noruega", group: "I", flagCode: "no" },
  { id: "irq", name: "Irak", group: "I", flagCode: "iq" },
  { id: "arg", name: "Argentina", group: "J", flagCode: "ar" },
  { id: "alg", name: "Argelia", group: "J", flagCode: "dz" },
  { id: "aut", name: "Austria", group: "J", flagCode: "at" },
  { id: "jor", name: "Jordania", group: "J", flagCode: "jo" },
  { id: "por", name: "Portugal", group: "K", flagCode: "pt" },
  { id: "uzb", name: "Uzbekistan", group: "K", flagCode: "uz" },
  { id: "col", name: "Colombia", group: "K", flagCode: "co" },
  { id: "cod", name: "RD Congo", group: "K", flagCode: "cd" },
  { id: "eng", name: "Inglaterra", group: "L", flagCode: "gb-eng" },
  { id: "cro", name: "Croacia", group: "L", flagCode: "hr" },
  { id: "gha", name: "Ghana", group: "L", flagCode: "gh" },
  { id: "pan", name: "Panama", group: "L", flagCode: "pa" }
];

const groupMatch = (id: string, group: string, homeTeamId: string, awayTeamId: string, startsAt: string, order: number): Match => ({
  id,
  phase: "Grupos",
  homeTeamId,
  awayTeamId,
  group,
  startsAt,
  order,
  knockout: false,
  predictionLockMode: "AUTO"
});

const knockoutMatch = (
  id: string,
  phase: Phase,
  homeSeed: string,
  awaySeed: string,
  startsAt: string,
  order: number
): Match => ({
  id,
  phase,
  homeTeamId: seedTeamId(homeSeed),
  awayTeamId: seedTeamId(awaySeed),
  homeSeed,
  awaySeed,
  startsAt,
  order,
  knockout: true,
  predictionLockMode: "AUTO"
});

export const matches: Match[] = [
  groupMatch("m1", "A", "mex", "rsa", "2026-06-11T16:00:00-03:00", 1),
  groupMatch("m2", "A", "kor", "cze", "2026-06-11T23:00:00-03:00", 2),
  groupMatch("m3", "B", "can", "bih", "2026-06-12T16:00:00-03:00", 3),
  groupMatch("m4", "D", "usa", "par", "2026-06-12T23:00:00-03:00", 4),
  groupMatch("m5", "B", "qat", "sui", "2026-06-13T16:00:00-03:00", 5),
  groupMatch("m6", "C", "bra", "mar", "2026-06-13T19:00:00-03:00", 6),
  groupMatch("m7", "C", "hai", "sco", "2026-06-13T23:00:00-03:00", 7),
  groupMatch("m8", "D", "aus", "tur", "2026-06-14T02:00:00-03:00", 8),
  groupMatch("m9", "E", "ger", "cuw", "2026-06-14T14:00:00-03:00", 9),
  groupMatch("m10", "F", "ned", "jpn", "2026-06-14T17:00:00-03:00", 10),
  groupMatch("m11", "E", "civ", "ecu", "2026-06-14T20:00:00-03:00", 11),
  groupMatch("m12", "F", "swe", "tun", "2026-06-14T23:00:00-03:00", 12),
  groupMatch("m13", "H", "esp", "cpv", "2026-06-15T13:00:00-03:00", 13),
  groupMatch("m14", "G", "bel", "egy", "2026-06-15T16:00:00-03:00", 14),
  groupMatch("m15", "H", "ksa", "uru", "2026-06-15T19:00:00-03:00", 15),
  groupMatch("m16", "G", "irn", "nzl", "2026-06-15T22:00:00-03:00", 16),
  groupMatch("m17", "I", "fra", "sen", "2026-06-16T16:00:00-03:00", 17),
  groupMatch("m18", "I", "irq", "nor", "2026-06-16T19:00:00-03:00", 18),
  groupMatch("m19", "J", "arg", "alg", "2026-06-16T23:00:00-03:00", 19),
  groupMatch("m20", "J", "aut", "jor", "2026-06-17T02:00:00-03:00", 20),
  groupMatch("m21", "K", "por", "cod", "2026-06-17T14:00:00-03:00", 21),
  groupMatch("m22", "L", "eng", "cro", "2026-06-17T17:00:00-03:00", 22),
  groupMatch("m23", "L", "gha", "pan", "2026-06-17T20:00:00-03:00", 23),
  groupMatch("m24", "K", "uzb", "col", "2026-06-17T23:00:00-03:00", 24),
  groupMatch("m25", "A", "cze", "rsa", "2026-06-18T13:00:00-03:00", 25),
  groupMatch("m26", "B", "sui", "bih", "2026-06-18T16:00:00-03:00", 26),
  groupMatch("m27", "B", "can", "qat", "2026-06-18T19:00:00-03:00", 27),
  groupMatch("m28", "A", "mex", "kor", "2026-06-18T22:00:00-03:00", 28),
  groupMatch("m29", "D", "usa", "aus", "2026-06-19T16:00:00-03:00", 29),
  groupMatch("m30", "C", "sco", "mar", "2026-06-19T19:00:00-03:00", 30),
  groupMatch("m31", "C", "bra", "hai", "2026-06-19T21:30:00-03:00", 31),
  groupMatch("m32", "D", "tur", "par", "2026-06-20T00:00:00-03:00", 32),
  groupMatch("m33", "F", "ned", "swe", "2026-06-20T14:00:00-03:00", 33),
  groupMatch("m34", "E", "ger", "civ", "2026-06-20T17:00:00-03:00", 34),
  groupMatch("m35", "E", "ecu", "cuw", "2026-06-20T21:00:00-03:00", 35),
  groupMatch("m36", "F", "tun", "jpn", "2026-06-21T01:00:00-03:00", 36),
  groupMatch("m37", "H", "esp", "ksa", "2026-06-21T13:00:00-03:00", 37),
  groupMatch("m38", "G", "bel", "irn", "2026-06-21T16:00:00-03:00", 38),
  groupMatch("m39", "H", "uru", "cpv", "2026-06-21T19:00:00-03:00", 39),
  groupMatch("m40", "G", "nzl", "egy", "2026-06-21T22:00:00-03:00", 40),
  groupMatch("m41", "J", "arg", "aut", "2026-06-22T14:00:00-03:00", 41),
  groupMatch("m42", "I", "fra", "irq", "2026-06-22T18:00:00-03:00", 42),
  groupMatch("m43", "I", "nor", "sen", "2026-06-22T21:00:00-03:00", 43),
  groupMatch("m44", "J", "jor", "alg", "2026-06-23T00:00:00-03:00", 44),
  groupMatch("m45", "K", "por", "uzb", "2026-06-23T14:00:00-03:00", 45),
  groupMatch("m46", "L", "eng", "gha", "2026-06-23T17:00:00-03:00", 46),
  groupMatch("m47", "L", "pan", "cro", "2026-06-23T20:00:00-03:00", 47),
  groupMatch("m48", "K", "col", "cod", "2026-06-23T23:00:00-03:00", 48),
  groupMatch("m49", "B", "sui", "can", "2026-06-24T16:00:00-03:00", 49),
  groupMatch("m50", "B", "bih", "qat", "2026-06-24T16:00:00-03:00", 50),
  groupMatch("m51", "C", "mar", "hai", "2026-06-24T19:00:00-03:00", 51),
  groupMatch("m52", "C", "sco", "bra", "2026-06-24T19:00:00-03:00", 52),
  groupMatch("m53", "A", "rsa", "kor", "2026-06-24T22:00:00-03:00", 53),
  groupMatch("m54", "A", "cze", "mex", "2026-06-24T22:00:00-03:00", 54),
  groupMatch("m55", "E", "cuw", "civ", "2026-06-25T17:00:00-03:00", 55),
  groupMatch("m56", "E", "ecu", "ger", "2026-06-25T17:00:00-03:00", 56),
  groupMatch("m57", "F", "jpn", "swe", "2026-06-25T20:00:00-03:00", 57),
  groupMatch("m58", "F", "tun", "ned", "2026-06-25T20:00:00-03:00", 58),
  groupMatch("m59", "D", "par", "aus", "2026-06-25T23:00:00-03:00", 59),
  groupMatch("m60", "D", "tur", "usa", "2026-06-25T23:00:00-03:00", 60),
  groupMatch("m61", "I", "nor", "fra", "2026-06-26T16:00:00-03:00", 61),
  groupMatch("m62", "I", "sen", "irq", "2026-06-26T16:00:00-03:00", 62),
  groupMatch("m63", "H", "cpv", "ksa", "2026-06-26T21:00:00-03:00", 63),
  groupMatch("m64", "H", "uru", "esp", "2026-06-26T21:00:00-03:00", 64),
  groupMatch("m65", "G", "egy", "irn", "2026-06-27T00:00:00-03:00", 65),
  groupMatch("m66", "G", "nzl", "bel", "2026-06-27T00:00:00-03:00", 66),
  groupMatch("m67", "L", "cro", "gha", "2026-06-27T18:00:00-03:00", 67),
  groupMatch("m68", "L", "pan", "eng", "2026-06-27T18:00:00-03:00", 68),
  groupMatch("m69", "K", "col", "por", "2026-06-27T20:30:00-03:00", 69),
  groupMatch("m70", "K", "cod", "uzb", "2026-06-27T20:30:00-03:00", 70),
  groupMatch("m71", "J", "alg", "aut", "2026-06-27T23:00:00-03:00", 71),
  groupMatch("m72", "J", "jor", "arg", "2026-06-27T23:00:00-03:00", 72),
  knockoutMatch("m73", "16avos", "2A", "2B", "2026-06-28T16:00:00-03:00", 73),
  knockoutMatch("m74", "16avos", "1C", "2F", "2026-06-29T14:00:00-03:00", 74),
  knockoutMatch("m75", "16avos", "1E", "3ABCDF", "2026-06-29T17:30:00-03:00", 75),
  knockoutMatch("m76", "16avos", "1F", "2C", "2026-06-29T22:00:00-03:00", 76),
  knockoutMatch("m77", "16avos", "2E", "2I", "2026-06-30T14:00:00-03:00", 77),
  knockoutMatch("m78", "16avos", "1I", "3CDFGH", "2026-06-30T18:00:00-03:00", 78),
  knockoutMatch("m79", "16avos", "1A", "3CEFHI", "2026-06-30T22:00:00-03:00", 79),
  knockoutMatch("m80", "16avos", "1L", "3EHIJK", "2026-07-01T13:00:00-03:00", 80),
  knockoutMatch("m81", "16avos", "1G", "3AEHIJ", "2026-07-01T17:00:00-03:00", 81),
  knockoutMatch("m82", "16avos", "1D", "3BEFIJ", "2026-07-01T21:00:00-03:00", 82),
  knockoutMatch("m83", "16avos", "1H", "2J", "2026-07-02T16:00:00-03:00", 83),
  knockoutMatch("m84", "16avos", "2K", "2L", "2026-07-02T20:00:00-03:00", 84),
  knockoutMatch("m85", "16avos", "1B", "3EFGIJ", "2026-07-03T00:00:00-03:00", 85),
  knockoutMatch("m86", "16avos", "2D", "2G", "2026-07-03T15:00:00-03:00", 86),
  knockoutMatch("m87", "16avos", "1J", "2H", "2026-07-03T19:00:00-03:00", 87),
  knockoutMatch("m88", "16avos", "1K", "3DEIJL", "2026-07-03T22:30:00-03:00", 88),
  knockoutMatch("m89", "Octavos", "W73", "W76", "2026-07-04T14:00:00-03:00", 89),
  knockoutMatch("m90", "Octavos", "W75", "W78", "2026-07-04T18:00:00-03:00", 90),
  knockoutMatch("m91", "Octavos", "W74", "W77", "2026-07-05T17:00:00-03:00", 91),
  knockoutMatch("m92", "Octavos", "W79", "W80", "2026-07-05T21:00:00-03:00", 92),
  knockoutMatch("m93", "Octavos", "W84", "W83", "2026-07-06T16:00:00-03:00", 93),
  knockoutMatch("m94", "Octavos", "W82", "W81", "2026-07-06T21:00:00-03:00", 94),
  knockoutMatch("m95", "Octavos", "W87", "W86", "2026-07-07T13:00:00-03:00", 95),
  knockoutMatch("m96", "Octavos", "W85", "W88", "2026-07-07T17:00:00-03:00", 96),
  knockoutMatch("m97", "Cuartos", "W90", "W89", "2026-07-09T17:00:00-03:00", 97),
  knockoutMatch("m98", "Cuartos", "W93", "W94", "2026-07-10T16:00:00-03:00", 98),
  knockoutMatch("m99", "Cuartos", "W91", "W92", "2026-07-11T18:00:00-03:00", 99),
  knockoutMatch("m100", "Cuartos", "W95", "W96", "2026-07-11T22:00:00-03:00", 100),
  knockoutMatch("m101", "Semifinal", "W97", "W98", "2026-07-14T16:00:00-03:00", 101),
  knockoutMatch("m102", "Semifinal", "W99", "W100", "2026-07-15T16:00:00-03:00", 102),
  knockoutMatch("m103", "Tercer puesto", "L101", "L102", "2026-07-18T18:00:00-03:00", 103),
  knockoutMatch("m104", "Final", "W101", "W102", "2026-07-19T16:00:00-03:00", 104)
];

export const dbTeams: Team[] = [
  ...teams,
  ...Array.from(new Set(matches.flatMap((match) => [match.homeTeamId, match.awayTeamId])))
    .filter((teamId) => teamId.startsWith("seed-"))
    .map((teamId) => ({ id: teamId, name: seedDisplayName(teamId) }))
];

export function teamById(id: string) {
  return teams.find((team) => team.id === id);
}

export function teamName(id: string) {
  return teamById(id)?.name ?? "Por definir";
}

export function teamFlagUrl(id: string) {
  const code = teamById(id)?.flagCode;
  return code ? `https://flagcdn.com/w80/${code}.png` : null;
}

export function displayTeamId(match: Match, side: "home" | "away", state?: AppState) {
  const override = sideOverride(match, side, state);
  if (override) return override;

  const seed = side === "home" ? match.homeSeed : match.awaySeed;
  const fallback = side === "home" ? match.homeTeamId : match.awayTeamId;
  return seed && state ? resolveSeed(seed, state) ?? fallback : fallback;
}

export function displayTeamName(match: Match, side: "home" | "away", state?: AppState) {
  const seed = side === "home" ? match.homeSeed : match.awaySeed;
  const teamId = displayTeamId(match, side, state);
  return teamById(teamId)?.name ?? seed ?? "Por definir";
}

export function isMatchResolved(match: Match, state: AppState) {
  if (!match.knockout) return true;
  return Boolean(resolvedSideTeamId(match, "home", state) && resolvedSideTeamId(match, "away", state));
}

export function phaseEnabled(phase: Phase, state: AppState) {
  if (phase === "Grupos") return true;
  return matches.some((match) => match.phase === phase && isMatchResolved(match, state));
}

export function sideCandidateTeamIds(match: Match, side: "home" | "away", state: AppState) {
  const seed = side === "home" ? match.homeSeed : match.awaySeed;
  if (!seed) return [side === "home" ? match.homeTeamId : match.awayTeamId];

  const candidates = seedCandidateTeamIds(seed, state);
  return candidates.length ? candidates : teams.map((team) => team.id);
}

function seedCandidateTeamIds(seed: string, state: AppState, seen = new Set<string>()): string[] {
  if (seen.has(seed)) return [];
  seen.add(seed);

  const direct = seed.match(/^([12])([A-L])$/);
  if (direct) return teams.filter((team) => team.group === direct[2]).map((team) => team.id);

  const third = seed.match(/^3([A-L]+)$/);
  if (third) {
    return unique(third[1].split("").flatMap((group) => teams.filter((team) => team.group === group).map((team) => team.id)));
  }

  const previous = seed.match(/^[WL](\d+)$/);
  if (previous) {
    const sourceMatch = matches.find((item) => item.id === `m${previous[1]}`);
    if (!sourceMatch) return [];
    const home = resolvedSideTeamId(sourceMatch, "home", state);
    const away = resolvedSideTeamId(sourceMatch, "away", state);
    return unique([
      ...(home ? [home] : seedCandidateTeamIds(sourceMatch.homeSeed ?? sourceMatch.homeTeamId, state, seen)),
      ...(away ? [away] : seedCandidateTeamIds(sourceMatch.awaySeed ?? sourceMatch.awayTeamId, state, seen))
    ]);
  }

  return teamById(seed) ? [seed] : [];
}

function resolveSeed(seed: string, state: AppState): string | null {
  const direct = seed.match(/^([12])([A-L])$/);
  if (direct) return groupPosition(direct[2], Number(direct[1]), state);

  const third = seed.match(/^3([A-L]+)$/);
  if (third) return bestThirdFrom(third[1].split(""), state);

  const winner = seed.match(/^W(\d+)$/);
  if (winner) return state.results.find((result) => result.matchId === `m${winner[1]}`)?.qualifiedTeamId ?? null;

  const loser = seed.match(/^L(\d+)$/);
  if (loser) {
    const match = matches.find((item) => item.id === `m${loser[1]}`);
    const result = state.results.find((item) => item.matchId === `m${loser[1]}`);
    if (!match || !result?.qualifiedTeamId) return null;
    const home = displayTeamId(match, "home", state);
    const away = displayTeamId(match, "away", state);
    return result.qualifiedTeamId === home ? away : home;
  }

  return null;
}

function resolvedSideTeamId(match: Match, side: "home" | "away", state: AppState) {
  const override = sideOverride(match, side, state);
  if (override) return override;

  const seed = side === "home" ? match.homeSeed : match.awaySeed;
  if (seed) return resolveSeed(seed, state);

  return side === "home" ? match.homeTeamId : match.awayTeamId;
}

function sideOverride(match: Match, side: "home" | "away", state?: AppState) {
  const setting = state?.matchSettings.find((item) => item.matchId === match.id);
  return side === "home" ? setting?.homeTeamOverrideId ?? null : setting?.awayTeamOverrideId ?? null;
}

function unique(ids: string[]) {
  return Array.from(new Set(ids)).filter((id) => Boolean(teamById(id)));
}

function groupPosition(group: string, position: number, state: AppState) {
  return standingsForGroup(group, state)[position - 1]?.teamId ?? null;
}

function bestThirdFrom(groupList: string[], state: AppState) {
  const candidates = groupList
    .map((group) => standingsForGroup(group, state)[2])
    .filter((row): row is StandingRow => Boolean(row));
  return candidates.sort(compareStanding)[0]?.teamId ?? null;
}

type StandingRow = {
  teamId: string;
  points: number;
  goalDifference: number;
  goalsFor: number;
  manualTiebreaks: number;
  order: number;
};

function standingsForGroup(group: string, state: AppState) {
  const groupTeams = teams.filter((team) => team.group === group);
  const rows = groupTeams.map<StandingRow>((team, index) => ({
    teamId: team.id,
    points: 0,
    goalDifference: 0,
    goalsFor: 0,
    manualTiebreaks: 0,
    order: index
  }));

  matches
    .filter((match) => match.group === group)
    .forEach((match) => {
      const result = state.results.find((item) => item.matchId === match.id);
      if (!result) return;
      const home = rows.find((row) => row.teamId === match.homeTeamId);
      const away = rows.find((row) => row.teamId === match.awayTeamId);
      if (!home || !away) return;

      home.goalsFor += result.homeGoals;
      away.goalsFor += result.awayGoals;
      home.goalDifference += result.homeGoals - result.awayGoals;
      away.goalDifference += result.awayGoals - result.homeGoals;

      if (result.homeGoals > result.awayGoals) home.points += 3;
      else if (result.awayGoals > result.homeGoals) away.points += 3;
      else {
        home.points += 1;
        away.points += 1;
        if (result.qualifiedTeamId === home.teamId) home.manualTiebreaks += 1;
        if (result.qualifiedTeamId === away.teamId) away.manualTiebreaks += 1;
      }
    });

  const complete = matches.filter((match) => match.group === group).every((match) => state.results.some((result) => result.matchId === match.id));
  return complete ? rows.sort(compareStanding) : [];
}

function compareStanding(a: StandingRow, b: StandingRow) {
  return (
    b.points - a.points ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor ||
    b.manualTiebreaks - a.manualTiebreaks ||
    a.order - b.order
  );
}

function seedTeamId(seed: string) {
  return `seed-${seed.toLowerCase()}`;
}

function seedDisplayName(teamId: string) {
  return teamId.replace("seed-", "").toUpperCase();
}
