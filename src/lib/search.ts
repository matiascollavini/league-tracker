import { z } from "zod";
import { PLATFORMS } from "@/lib/riot/config";

/**
 * Contrato del buscador del header (`GET /api/buscar`).
 *
 * Vive aparte para que el route y el componente cliente validen lo mismo: el
 * borde del sistema es la respuesta de la API, aunque la API sea nuestra.
 */

export const SearchHitSchema = z.object({
  gameName: z.string().min(1),
  tagLine: z.string().min(1),
  platform: z.enum(PLATFORMS),
  /** URL del icono de invocador en Data Dragon (o `null` si no lo conocemos). */
  iconUrl: z.string().nullable(),
  level: z.number().nullable(),
  /** URL canónica del perfil, armada en el server con `profileHref`. */
  href: z.string().min(1),
});

export const SearchResponseSchema = z.object({
  query: z.string(),
  results: z.array(SearchHitSchema),
  /** Cuántas cuentas hay en el índice propio (contexto del "no encontré"). */
  indexed: z.number(),
});

export type SearchHit = z.infer<typeof SearchHitSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

/**
 * Cuenta sugerida como "recomendada" en la landing: el mismo hit del buscador
 * más cuántas partidas tenemos guardadas de ella (el criterio del ranking).
 */
export const RecommendedHitSchema = SearchHitSchema.extend({
  games: z.number().int().nonnegative(),
});

export const RecommendedResponseSchema = z.object({
  results: z.array(RecommendedHitSchema),
  /** Cuántas cuentas hay en el índice propio (contexto del subtítulo). */
  indexed: z.number(),
});

export type RecommendedHit = z.infer<typeof RecommendedHitSchema>;
export type RecommendedResponse = z.infer<typeof RecommendedResponseSchema>;

/** Mínimo de caracteres para pedir sugerencias. */
export const MIN_QUERY_LENGTH = 2;

export type RiotIdParts = { gameName: string; tagLine: string };

export type RiotIdParse =
  | { ok: true; value: RiotIdParts }
  | { ok: false; error: string };

/**
 * Valida un Riot ID escrito a mano (`Nombre#TAG`).
 *
 * Riot separa por el **último** `#`; el nombre admite espacios y acentos. Los
 * largos mínimos son los del formulario de siempre: 3 para el nombre y 2 para
 * el tag.
 */
export function parseRiotId(raw: string): RiotIdParse {
  const value = raw.trim();
  const hash = value.lastIndexOf("#");

  if (hash <= 0 || hash === value.length - 1) {
    return {
      ok: false,
      error: "Escribí tu Riot ID completo, con el tag: por ejemplo Faker#KR1",
    };
  }

  const gameName = value.slice(0, hash).trim();
  const tagLine = value.slice(hash + 1).trim();

  if (gameName.length < 3 || tagLine.length < 2) {
    return { ok: false, error: "El nombre o el tag parecen incompletos." };
  }

  return { ok: true, value: { gameName, tagLine } };
}
