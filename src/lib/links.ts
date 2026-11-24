import type { Platform, QueueFilterId } from "@/lib/riot/config";

/** URL canónica de un perfil. Los segmentos se encodifican una sola vez. */
export function profileHref(
  platform: Platform,
  gameName: string,
  tagLine: string,
  options: { champion?: string; queue?: QueueFilterId; all?: boolean } = {},
): string {
  const base = `/perfil/${platform}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  const params = new URLSearchParams();
  if (options.champion) params.set("champion", options.champion);
  if (options.queue && options.queue !== "all") params.set("queue", options.queue);
  if (options.all) params.set("all", "1");
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
