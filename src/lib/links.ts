import { isPlatform, type Platform, type QueueFilterId } from "@/lib/riot/config";
import type { RoleFilterId } from "@/lib/riot/roles";

/** URL canónica de un perfil. Los segmentos se encodifican una sola vez. */
export function profileHref(
  platform: Platform,
  gameName: string,
  tagLine: string,
  options: {
    champion?: string;
    queue?: QueueFilterId;
    /** Rol (posición) del jugador; `none` = partidas sin posición fija. */
    role?: RoleFilterId;
    all?: boolean;
    /** Página de la lista de partidas; la 1 no se escribe en la URL. */
    page?: number;
  } = {},
): string {
  const base = `/perfil/${platform}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  const params = new URLSearchParams();
  if (options.champion) params.set("champion", options.champion);
  if (options.queue && options.queue !== "all") params.set("queue", options.queue);
  if (options.role) params.set("role", options.role);
  if (options.all) params.set("all", "1");
  if (options.page && options.page > 1) params.set("page", String(options.page));
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

/**
 * URL del perfil de un participante de una partida, a partir del Riot ID que
 * reportó Riot (`Nombre#TAG`) y la plataforma de la partida.
 *
 * Devuelve `null` cuando no hay con qué armar el link (sin Riot ID, sin
 * plataforma válida o un `#` mal formado): la tabla muestra el nombre como
 * texto plano en vez de un link roto.
 */
export function participantHref(
  platform: string | null | undefined,
  riotId: string | null | undefined,
): string | null {
  if (!platform || !isPlatform(platform) || !riotId) return null;

  // Riot separa por el ÚLTIMO `#`: el nombre puede tener espacios y acentos.
  const hash = riotId.lastIndexOf("#");
  if (hash <= 0 || hash === riotId.length - 1) return null;

  const gameName = riotId.slice(0, hash).trim();
  const tagLine = riotId.slice(hash + 1).trim();
  if (!gameName || !tagLine) return null;

  return profileHref(platform, gameName, tagLine);
}
