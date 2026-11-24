import { z } from "zod";
import { clusterFor, type Platform } from "./config";
import { isMockMode, riotFetch } from "./http";
import { mockAccount, mockLeague, mockSummoner } from "./fixtures";
import {
  AccountSchema,
  LeagueEntrySchema,
  SummonerSchema,
  type Account,
  type LeagueEntry,
  type Summoner,
} from "./types";

const enc = encodeURIComponent;

/**
 * ACCOUNT-V1: Riot ID (gameName#tagLine) -> puuid.
 * Host REGIONAL. El puuid es estable; el nombre no. Cacheamos una semana.
 */
export async function resolveAccount(
  platform: Platform,
  gameName: string,
  tagLine: string,
  deadline?: number,
): Promise<Account> {
  if (isMockMode()) {
    return { ...mockAccount, gameName, tagLine };
  }
  return riotFetch(
    `/riot/account/v1/accounts/by-riot-id/${enc(gameName)}/${enc(tagLine)}`,
    // ACCOUNT-V1 vive en el host REGIONAL, no en el de plataforma.
    {
      cluster: clusterFor(platform),
      revalidate: 604_800,
      schema: AccountSchema,
      deadline,
    },
  );
}

/** SUMMONER-V4: nivel e icono. Opcional: el detalle de partida ya los trae. */
export async function getSummoner(
  puuid: string,
  platform: Platform,
): Promise<Summoner | null> {
  if (isMockMode()) return mockSummoner;
  try {
    return await riotFetch(`/lol/summoner/v4/summoners/by-puuid/${puuid}`, {
      platform,
      revalidate: 86_400,
      schema: SummonerSchema,
    });
  } catch {
    return null;
  }
}

/** LEAGUE-V4: rango actual. Un jugador sin rank devuelve [] (o 404). */
export async function getLeagueEntries(
  puuid: string,
  platform: Platform,
): Promise<LeagueEntry[]> {
  if (isMockMode()) return mockLeague;
  try {
    return await riotFetch(`/lol/league/v4/entries/by-puuid/${puuid}`, {
      platform,
      revalidate: 300,
      schema: z.array(LeagueEntrySchema),
    });
  } catch {
    return [];
  }
}
