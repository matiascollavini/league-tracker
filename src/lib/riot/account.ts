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
 * Host REGIONAL. El nombre no es estable y el puuid tampoco: Riot lo reasigna
 * (keke#6seve tiene dos). Una semana de caché dejaba un puuid viejo pegado y
 * partía el historial del jugador; con una hora alcanza y se corrige rápido.
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
      revalidate: 3_600,
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

/**
 * LEAGUE-V4 crudo: rango actual de todas las colas en un request.
 *
 * A diferencia de `getLeagueEntries`, **no se traga el error**: la usa el cron
 * de snapshots (ADR-026) para distinguir "sin rango" (404/[]) de "la key venció"
 * (401/403) o "se acabó el tiempo", y no marcar como consultada una cuenta que
 * en realidad falló. Un jugador sin rank devuelve [] (o 404, ver API-LOL §7.4).
 */
export async function fetchLeagueEntries(
  puuid: string,
  platform: Platform,
  deadline?: number,
): Promise<LeagueEntry[]> {
  if (isMockMode()) return mockLeague;
  return riotFetch(`/lol/league/v4/entries/by-puuid/${puuid}`, {
    platform,
    revalidate: 300,
    schema: z.array(LeagueEntrySchema),
    ...(deadline !== undefined ? { deadline } : {}),
  });
}

/** LEAGUE-V4 con degradación: el perfil nunca se rompe por el rango. */
export async function getLeagueEntries(
  puuid: string,
  platform: Platform,
): Promise<LeagueEntry[]> {
  try {
    return await fetchLeagueEntries(puuid, platform);
  } catch {
    return [];
  }
}
