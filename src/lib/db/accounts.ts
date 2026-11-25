import { db, ensureSchema } from "./client";

/**
 * Índice de cuentas para el buscador del header.
 *
 * Riot **no** tiene un endpoint de búsqueda por nombre (ver ADR-014 y
 * `docs/API-LOL.txt`): `account-v1` solo resuelve un Riot ID exacto. Entonces el
 * autocompletado no puede preguntarle a Riot en cada tecla; se construye un
 * índice propio con los jugadores que ya vimos como participantes de las
 * partidas guardadas (10 por partida) y con las cuentas que alguien buscó.
 *
 * Una fila por puuid: el nombre más nuevo gana. La tabla es chica (una fila por
 * jugador conocido) y se escribe en el mismo batch que la partida.
 */

export type AccountHit = {
  puuid: string;
  gameName: string;
  tagLine: string;
  platformId: string;
  profileIcon: number | null;
  level: number | null;
  lastSeenTs: number;
};

const str = (value: unknown): string => (value == null ? "" : String(value));

const numOrNull = (value: unknown): number | null => {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/** Partes de un Riot ID. Solo corta por el último `#`; valida largos el caller. */
export function splitRiotId(raw: string): { name: string; tag: string | null } {
  const value = raw.trim();
  const hash = value.lastIndexOf("#");
  if (hash < 0) return { name: value, tag: null };
  return {
    name: value.slice(0, hash).trim(),
    tag: value.slice(hash + 1).trim() || null,
  };
}

export type AccountUpsert = {
  puuid: string;
  platformId: string;
  gameName: string;
  tagLine: string;
  profileIcon?: number | null;
  level?: number | null;
  /** Timestamp de la partida desde la que se conoce. `0` si no aplica. */
  lastSeenTs?: number;
};

/**
 * Statement de upsert, para poder meterlo en el batch que guarda la partida.
 *
 * El nombre solo se pisa si la fila entrante es igual o más nueva: el ingest
 * baja partidas del más nuevo al más viejo, así que sin este guard una partida
 * de hace un año podría restaurar un Riot ID que el jugador ya cambió. Las
 * búsquedas directas (`loadProfile`) pasan `lastSeenTs = Date.now()` y ganan
 * siempre, porque ahí el nombre viene de `account-v1`, la fuente autoritativa.
 */
export function accountUpsertStatement(input: AccountUpsert) {
  const lastSeenTs = input.lastSeenTs ?? 0;
  return {
    sql: `INSERT INTO accounts
            (puuid, platform_id, game_name, tag_line, name_lower,
             profile_icon, summoner_level, last_seen_ts, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(puuid) DO UPDATE SET
            game_name = CASE WHEN excluded.last_seen_ts >= accounts.last_seen_ts
                             THEN excluded.game_name ELSE accounts.game_name END,
            tag_line = CASE WHEN excluded.last_seen_ts >= accounts.last_seen_ts
                            THEN excluded.tag_line ELSE accounts.tag_line END,
            name_lower = CASE WHEN excluded.last_seen_ts >= accounts.last_seen_ts
                              THEN excluded.name_lower ELSE accounts.name_lower END,
            platform_id = accounts.platform_id,
            profile_icon = COALESCE(excluded.profile_icon, accounts.profile_icon),
            summoner_level = COALESCE(excluded.summoner_level, accounts.summoner_level),
            last_seen_ts = MAX(accounts.last_seen_ts, excluded.last_seen_ts),
            updated_at = excluded.updated_at`,
    args: [
      input.puuid,
      input.platformId,
      input.gameName,
      input.tagLine,
      input.gameName.toLowerCase(),
      input.profileIcon ?? null,
      input.level ?? null,
      lastSeenTs,
      Date.now(),
    ],
  };
}

/** Upsert de un solo registro (búsquedas directas, cuenta recién resuelta). */
export async function saveAccount(input: AccountUpsert): Promise<void> {
  if (!input.gameName || !input.tagLine) return;
  await ensureSchema();
  await db().execute(accountUpsertStatement(input));
}

export type SearchOptions = {
  limit?: number;
  /** Acota a una plataforma. Sin valor, busca en todas (el header no pregunta región). */
  platform?: string;
};

/** Máximo de sugerencias que devuelve el buscador. */
export const SEARCH_LIMIT = 8;
const MAX_LIMIT = 12;

/**
 * Sugerencias por prefijo de nombre (y, si el usuario escribió `#`, también por
 * tag). Sin `LIKE`: comparamos `substr()` para que `%` y `_` escritos por el
 * usuario sean literales y no comodines.
 */
export async function searchAccounts(
  rawQuery: string,
  options: SearchOptions = {},
): Promise<AccountHit[]> {
  const { name, tag } = splitRiotId(rawQuery);
  if (name.length < 2) return [];

  await ensureSchema();

  const nameLower = name.toLowerCase();
  const limit = Math.min(Math.max(options.limit ?? SEARCH_LIMIT, 1), MAX_LIMIT);

  const where = ["substr(name_lower, 1, ?) = ?"];
  const args: (string | number)[] = [nameLower.length, nameLower];

  if (tag) {
    where.push("substr(lower(tag_line), 1, ?) = ?");
    args.push(tag.toLowerCase().length, tag.toLowerCase());
  }
  if (options.platform) {
    where.push("platform_id = ?");
    args.push(options.platform);
  }

  const result = await db().execute({
    sql: `SELECT puuid, platform_id, game_name, tag_line, profile_icon,
                 summoner_level, last_seen_ts
            FROM accounts
           WHERE ${where.join(" AND ")}
           ORDER BY (name_lower = ?) DESC, length(game_name) ASC,
                    last_seen_ts DESC, game_name ASC
           LIMIT ?`,
    args: [...args, nameLower, limit],
  });

  return result.rows.map((row) => ({
    puuid: str(row.puuid),
    gameName: str(row.game_name),
    tagLine: str(row.tag_line),
    platformId: str(row.platform_id),
    profileIcon: numOrNull(row.profile_icon),
    level: numOrNull(row.summoner_level),
    lastSeenTs: numOrNull(row.last_seen_ts) ?? 0,
  }));
}

/** Cuántas cuentas hay indexadas (para el estado del buscador y /api/health). */
export async function countAccounts(): Promise<number> {
  await ensureSchema();
  const result = await db().execute("SELECT COUNT(*) AS n FROM accounts");
  return Number(result.rows[0]?.n ?? 0);
}
