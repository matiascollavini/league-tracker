import type { Match } from "./types";

/**
 * Compañeros de equipo más frecuentes ("duos") en las partidas analizadas.
 *
 * Se cuentan solo las partidas donde el compañero jugó **en el mismo equipo**;
 * las rivales no suman. La identidad es el Riot ID normalizado, no el puuid:
 * Riot reasigna puuids y una misma persona terminaría partida en dos filas.
 *
 * El tipo y el merge son compartidos por las dos fuentes:
 *   - la base (`getTopTeammates`), que ya trae los agregados en SQL;
 *   - la vía en vivo/demo (`topTeammatesFromMatches`), que solo tiene las
 *     partidas con su roster completo en memoria.
 */

export type TeammateStat = {
  puuid: string;
  gameName: string | null;
  tagLine: string | null;
  /** Plataforma de la que salieron las partidas (para armar el link al perfil). */
  platform: string | null;
  profileIcon: number | null;
  games: number;
  wins: number;
  losses: number;
  /** 0..1 */
  winrate: number;
  /** Timestamp de la partida más nueva compartida. */
  lastPlayedAt: number;
};

/** Fila agregada antes de calcular losses/winrate y de mergear aliases. */
export type TeammateAggregate = Omit<TeammateStat, "losses" | "winrate">;

const norm = (value: string | null): string => (value ?? "").trim().toLowerCase();

/** Clave de identidad: Riot ID normalizado; si no hay, el puuid. */
export function teammateKey(
  teammate: Pick<TeammateAggregate, "puuid" | "gameName" | "tagLine">,
): string {
  const gameName = norm(teammate.gameName);
  const tagLine = norm(teammate.tagLine);
  return gameName && tagLine ? `${gameName}#${tagLine}` : `puuid:${teammate.puuid}`;
}

/**
 * Junta aliases, calcula losses/winrate y ordena por partidas jugadas.
 *
 * Cuando dos filas son la misma persona (mismo Riot ID), se suman las partidas
 * y gana el nombre/icono de la partida más nueva: un Riot ID viejo no debe
 * revivir en la tarjeta.
 */
export function mergeTeammates(
  rows: readonly TeammateAggregate[],
  limit = 5,
): TeammateStat[] {
  const merged = new Map<string, TeammateAggregate>();

  for (const row of rows) {
    if (!row.puuid) continue;
    const key = teammateKey(row);
    const current = merged.get(key);
    if (!current) {
      merged.set(key, { ...row });
      continue;
    }

    current.games += row.games;
    current.wins += row.wins;
    if (row.lastPlayedAt >= current.lastPlayedAt) {
      current.puuid = row.puuid;
      current.gameName = row.gameName ?? current.gameName;
      current.tagLine = row.tagLine ?? current.tagLine;
      if (row.profileIcon != null) current.profileIcon = row.profileIcon;
      if (row.platform) current.platform = row.platform;
      current.lastPlayedAt = row.lastPlayedAt;
    }
    // Completar lo que falte con partidas viejas: el icono de la más nueva
    // puede no haber venido en el payload de Riot.
    if (!current.gameName && row.gameName) current.gameName = row.gameName;
    if (!current.tagLine && row.tagLine) current.tagLine = row.tagLine;
    current.profileIcon ??= row.profileIcon;
    current.platform ??= row.platform;
  }

  const max = Math.max(0, Math.floor(limit));
  return [...merged.values()]
    .sort(
      (a, b) =>
        b.games - a.games ||
        b.wins - a.wins ||
        b.lastPlayedAt - a.lastPlayedAt ||
        (a.gameName ?? "").localeCompare(b.gameName ?? ""),
    )
    .slice(0, max)
    .map((row) => ({
      ...row,
      losses: row.games - row.wins,
      winrate: row.games > 0 ? row.wins / row.games : 0,
    }));
}

/**
 * Versión para partidas en memoria (demo o vía directa a Riot): necesita el
 * roster completo en `info.participants`, que la base no guarda por partida.
 */
export function topTeammatesFromMatches(
  matches: readonly Match[],
  playerPuuids: readonly string[],
  limit = 5,
): TeammateStat[] {
  const player = new Set(playerPuuids);
  const seen = new Set<string>();
  const rows: TeammateAggregate[] = [];

  for (const match of matches) {
    const { matchId } = match.metadata;
    if (seen.has(matchId)) continue;
    seen.add(matchId);

    const me = match.info.participants.find((p) => player.has(p.puuid));
    if (!me || me.teamId == null) continue;

    const playedAt = match.info.gameStartTimestamp ?? match.info.gameCreation;
    // Riot manda la plataforma en MAYÚSCULAS ("LA1"); el resto del proyecto
    // usa el código en minúsculas (`Platform`).
    const platform = match.info.platformId?.toLowerCase() ?? null;

    for (const teammate of match.info.participants) {
      // Cualquiera de los alias del jugador tampoco es un "compañero".
      if (player.has(teammate.puuid)) continue;
      if (teammate.teamId !== me.teamId) continue;

      rows.push({
        puuid: teammate.puuid,
        gameName: teammate.riotIdGameName ?? null,
        tagLine: teammate.riotIdTagline ?? null,
        platform,
        profileIcon: teammate.profileIcon ?? null,
        games: 1,
        wins: me.win ? 1 : 0,
        lastPlayedAt: playedAt,
      });
    }
  }

  return mergeTeammates(rows, limit);
}
