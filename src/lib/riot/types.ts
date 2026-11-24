import { z } from "zod";

/**
 * Esquemas de las respuestas de Riot que consumimos.
 * Validamos en el borde: si Riot cambia algo, la página degrada con un error
 * controlado en vez de romperse con un TypeError.
 *
 * Nota: Riot omite los campos vacíos. Todo campo numérico opcional se trata
 * como 0 aguas abajo.
 */

export const AccountSchema = z.object({
  puuid: z.string().min(10),
  gameName: z.string().optional(),
  tagLine: z.string().optional(),
});
export type Account = z.infer<typeof AccountSchema>;

export const SummonerSchema = z.object({
  puuid: z.string(),
  profileIconId: z.number().optional(),
  revisionDate: z.number().optional(),
  summonerLevel: z.number().optional(),
});
export type Summoner = z.infer<typeof SummonerSchema>;

export const LeagueEntrySchema = z.object({
  queueType: z.string(),
  tier: z.string().optional(),
  rank: z.string().optional(),
  leaguePoints: z.number().optional(),
  wins: z.number().optional(),
  losses: z.number().optional(),
  hotStreak: z.boolean().optional(),
  inactive: z.boolean().optional(),
});
export type LeagueEntry = z.infer<typeof LeagueEntrySchema>;

export const MatchIdsSchema = z.array(z.string());

const ParticipantSchema = z.object({
  puuid: z.string(),
  championId: z.number(),
  championName: z.string(),
  teamId: z.number().optional(),
  teamPosition: z.string().optional(),
  individualPosition: z.string().optional(),
  win: z.boolean(),
  kills: z.number().optional(),
  deaths: z.number().optional(),
  assists: z.number().optional(),
  champLevel: z.number().optional(),
  goldEarned: z.number().optional(),
  totalMinionsKilled: z.number().optional(),
  neutralMinionsKilled: z.number().optional(),
  visionScore: z.number().optional(),
  totalDamageDealtToChampions: z.number().optional(),
  timePlayed: z.number().optional(),
  riotIdGameName: z.string().optional(),
  riotIdTagline: z.string().optional(),
  profileIcon: z.number().optional(),
  summonerLevel: z.number().optional(),
});
export type Participant = z.infer<typeof ParticipantSchema>;

export const MatchSchema = z.object({
  metadata: z.object({
    matchId: z.string(),
    participants: z.array(z.string()).optional(),
  }),
  info: z.object({
    gameCreation: z.number(),
    gameStartTimestamp: z.number().optional(),
    gameEndTimestamp: z.number().optional(),
    gameDuration: z.number(),
    gameMode: z.string().optional(),
    gameType: z.string().optional(),
    gameVersion: z.string(),
    mapId: z.number().optional(),
    platformId: z.string().optional(),
    queueId: z.number(),
    participants: z.array(ParticipantSchema),
    teams: z
      .array(z.object({ teamId: z.number(), win: z.boolean() }))
      .optional(),
  }),
});
export type Match = z.infer<typeof MatchSchema>;
export type MatchInfo = Match["info"];
