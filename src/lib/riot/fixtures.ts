import type { Account, LeagueEntry, Match, Summoner } from "./types";

/**
 * Datos de DEMO. Se usan solo cuando no hay RIOT_API_KEY, para poder maquetar
 * y testear sin quemar la key ni depender de la red.
 *
 * Son deterministas (mismo resultado siempre salvo las fechas, que son
 * relativas a "ahora" para que la UI se vea viva).
 */

export const MOCK_PUUID = `demo${"0".repeat(74)}`;

export const mockAccount: Account = {
  puuid: MOCK_PUUID,
  gameName: "InvocadorDePrueba",
  tagLine: "LAS",
};

export const mockSummoner: Summoner = {
  puuid: MOCK_PUUID,
  profileIconId: 4568,
  summonerLevel: 312,
  revisionDate: Date.now(),
};

export const mockLeague: LeagueEntry[] = [
  {
    queueType: "RANKED_SOLO_5x5",
    tier: "PLATINUM",
    rank: "II",
    leaguePoints: 64,
    wins: 120,
    losses: 110,
    hotStreak: false,
    inactive: false,
  },
  {
    queueType: "RANKED_FLEX_SR",
    tier: "GOLD",
    rank: "IV",
    leaguePoints: 12,
    wins: 18,
    losses: 21,
    hotStreak: false,
    inactive: false,
  },
];

type Pick = {
  id: string;
  key: number;
  role: string;
};

const POOL: Record<string, Pick> = {
  Ahri: { id: "Ahri", key: 103, role: "MIDDLE" },
  Jinx: { id: "Jinx", key: 222, role: "BOTTOM" },
  Lux: { id: "Lux", key: 99, role: "MIDDLE" },
  Darius: { id: "Darius", key: 122, role: "TOP" },
  Thresh: { id: "Thresh", key: 412, role: "UTILITY" },
  LeeSin: { id: "LeeSin", key: 64, role: "JUNGLE" },
  KaiSa: { id: "KaiSa", key: 145, role: "BOTTOM" },
};

// 24 partidas: 8 Ahri, 4 Jinx, 4 Lux, 3 Darius, 2 Thresh, 2 KaiSa, 1 LeeSin.
const PICKS = [
  "Ahri",
  "Jinx",
  "Ahri",
  "Lux",
  "Thresh",
  "Ahri",
  "Darius",
  "Jinx",
  "LeeSin",
  "Ahri",
  "Lux",
  "KaiSa",
  "Ahri",
  "Darius",
  "Jinx",
  "Ahri",
  "Thresh",
  "Lux",
  "Ahri",
  "Jinx",
  "Darius",
  "Ahri",
  "KaiSa",
  "Lux",
] as const;

const WINS = [
  true,
  false,
  true,
  true,
  false,
  true,
  false,
  true,
  true,
  false,
  true,
  true,
  false,
  true,
  false,
  true,
  true,
  false,
  true,
  false,
  true,
  false,
  true,
  false,
] as const;

const QUEUES = [420, 420, 420, 440, 420, 420, 420, 450, 420, 420, 420, 440] as const;

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const GAME_VERSION = "16.23.541.1234";
const HOUR = 3_600_000;

const ROLES = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as const;

/** Campeones de relleno: azul y rojo por línea, para el resto del roster. */
const BOT_POOL: Record<(typeof ROLES)[number], [Pick, Pick]> = {
  TOP: [
    { id: "Garen", key: 86, role: "TOP" },
    { id: "Malphite", key: 54, role: "TOP" },
  ],
  JUNGLE: [
    { id: "Warwick", key: 19, role: "JUNGLE" },
    { id: "Amumu", key: 32, role: "JUNGLE" },
  ],
  MIDDLE: [
    { id: "Annie", key: 1, role: "MIDDLE" },
    { id: "Veigar", key: 45, role: "MIDDLE" },
  ],
  BOTTOM: [
    { id: "Ashe", key: 22, role: "BOTTOM" },
    { id: "Caitlyn", key: 51, role: "BOTTOM" },
  ],
  UTILITY: [
    { id: "Soraka", key: 16, role: "UTILITY" },
    { id: "Blitzcrank", key: 53, role: "UTILITY" },
  ],
};

/** Nombres de los bots, deterministas para que el roster no cambie. */
const BOT_NAMES = [
  "TopGapEnjoyer",
  "JunglaSinSmite",
  "MidOSRS",
  "AdcConPapas",
  "SoporteDeHierro",
  "GarenMain2009",
  "ElQueRobaJungla",
  "MidOtp",
  "AutoFillAdc",
  "WardBot",
] as const;

/** Puuid de bot: estable por equipo y línea (no colisiona con el del perfil). */
function botPuuid(teamId: number, roleIndex: number): string {
  return `bot${teamId}${roleIndex}${"0".repeat(68)}`;
}

export function mockMatches(): Match[] {
  const rng = mulberry32(20261124);
  const base = Date.now() - 3 * HOUR;

  return PICKS.map((championName, index) => {
    const pick = POOL[championName];
    if (!pick) throw new Error(`Campeón de demo desconocido: ${championName}`);

    const queueId = QUEUES[index % QUEUES.length] ?? 420;
    const win = WINS[index] ?? true;
    const gameStart = base - index * 31 * HOUR - Math.floor(rng() * 5 * HOUR);
    const duration = Math.floor(1_180 + rng() * 1_020); // 19–37 min
    const kills = Math.floor(rng() * 14);
    const deaths = Math.floor(rng() * 9);
    const assists = Math.floor(rng() * 18);
    // ARAM y demás modos sin posiciones fijas: nadie tiene línea.
    const playerRole = queueId === 450 ? "" : pick.role;

    // La base real guarda cada partida con sus 10 jugadores, así que el modo
    // demo también los trae: si no, el desplegable de la lista se ve a medias.
    const roster = ROLES.flatMap((role, roleIndex) =>
      [100, 200].flatMap((teamId) => {
        // El jugador del perfil ocupa su línea en el equipo azul.
        if (teamId === 100 && role === playerRole) return [];

        const [bluePick, redPick] = BOT_POOL[role];
        const botPick = teamId === 100 ? bluePick : redPick;
        const nameIndex = roleIndex + (teamId === 100 ? 0 : ROLES.length);

        return [
          {
            puuid: botPuuid(teamId, roleIndex),
            championId: botPick.key,
            championName: botPick.id,
            teamId,
            teamPosition: playerRole === "" ? "" : role,
            individualPosition: playerRole === "" ? "" : role,
            win: teamId === 100 ? win : !win,
            kills: Math.floor(rng() * 13),
            deaths: Math.floor(rng() * 10),
            assists: Math.floor(rng() * 16),
            champLevel: Math.floor(9 + rng() * 9),
            goldEarned: Math.floor(8_000 + rng() * 8_000),
            totalMinionsKilled: Math.floor(60 + rng() * 200),
            neutralMinionsKilled: Math.floor(rng() * 40),
            visionScore: Math.floor(5 + rng() * 28),
            totalDamageDealtToChampions: Math.floor(6_000 + rng() * 20_000),
            timePlayed: duration,
            riotIdGameName: BOT_NAMES[nameIndex % BOT_NAMES.length] ?? "Bot",
            riotIdTagline: "LAS",
          },
        ];
      }),
    );

    return {
      metadata: {
        matchId: `LA1_${7_000_000_000 + index * 137}`,
        participants: [MOCK_PUUID],
      },
      info: {
        gameCreation: gameStart - 60_000,
        gameStartTimestamp: gameStart,
        gameEndTimestamp: gameStart + duration * 1_000,
        gameDuration: duration,
        gameMode: queueId === 450 ? "ARAM" : "CLASSIC",
        gameType: "MATCHED_GAME",
        gameVersion: GAME_VERSION,
        platformId: "LA1",
        queueId,
        participants: [
          {
            puuid: MOCK_PUUID,
            championId: pick.key,
            championName: pick.id,
            teamId: 100,
            teamPosition: playerRole,
            individualPosition: playerRole,
            win,
            kills,
            deaths,
            assists,
            champLevel: Math.floor(11 + rng() * 8),
            goldEarned: Math.floor(9_000 + rng() * 9_000),
            totalMinionsKilled: Math.floor(90 + rng() * 190),
            neutralMinionsKilled: Math.floor(rng() * 40),
            visionScore: Math.floor(8 + rng() * 30),
            timePlayed: duration,
            riotIdGameName: mockAccount.gameName,
            riotIdTagline: mockAccount.tagLine,
            profileIcon: mockSummoner.profileIconId,
            summonerLevel: mockSummoner.summonerLevel,
          },
          ...roster,
        ],
        teams: [
          { teamId: 100, win },
          { teamId: 200, win: !win },
        ],
      },
    } satisfies Match;
  });
}

export function mockMatchIds(): string[] {
  return mockMatches().map((match) => match.metadata.matchId);
}
