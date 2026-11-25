import {
  RecommendedResponseSchema,
  type RecommendedHit,
} from "@/lib/search";

/**
 * Cliente de `/api/recomendados` con una sola request por carga de página.
 *
 * La landing usa las recomendaciones en dos lugares (el desplegable del
 * buscador grande y la sección de abajo). Ambos comparten esta promesa, así que
 * abrir el panel y scrollear no duplica el fetch; el navegador/CDN cachea la
 * respuesta (ver `Cache-Control` en el route).
 */

const LIMIT = 8;

let pending: Promise<RecommendedHit[]> | null = null;

/** Recomendados ya pedidos (o pedidos ahora). Nunca rechaza: devuelve `[]`. */
export function fetchRecommended(): Promise<RecommendedHit[]> {
  pending ??= (async () => {
    const response = await fetch(`/api/recomendados?limit=${LIMIT}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return RecommendedResponseSchema.parse(await response.json()).results;
  })().catch(() => {
    // Un fallo no se recuerda: el próximo foco (o la próxima visita) reintenta.
    pending = null;
    return [] as RecommendedHit[];
  });
  return pending;
}
