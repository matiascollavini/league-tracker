import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Info } from "lucide-react";
import { ChampionTable } from "@/components/champion-table";
import { MatchList } from "@/components/match-list";
import { ProfileHeader } from "@/components/profile-header";
import { StatCard } from "@/components/stat-card";
import {
  formatDate,
  percent,
  summarize,
  toMatchSummaries,
} from "@/lib/riot/aggregate";
import { loadProfile } from "@/lib/profile";
import {
  isPlatform,
  isQueueFilter,
  queuesFor,
  QUEUE_FILTERS,
  type Platform,
  type QueueFilterId,
} from "@/lib/riot/config";
import { getChampionCatalog } from "@/lib/ddragon/champions";
import { MissingApiKeyError, RiotApiError } from "@/lib/riot/http";
import { analyzeCount } from "@/lib/riot/matches";
import { profileHref } from "@/lib/links";
import { decodeParam } from "@/lib/params";
import { cn } from "@/lib/utils";

type RouteParams = { region: string; gameName: string; tagLine: string };
type SearchParams = Record<string, string | string[] | undefined>;

export const revalidate = 120;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { gameName, tagLine } = await params;
  const name = decodeParam(gameName);
  const tag = decodeParam(tagLine);
  return {
    title: `${name}#${tag}`,
    description: `Partidas, campeón más jugado y winrate de ${name}#${tag}.`,
  };
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<SearchParams>;
}) {
  const { region, gameName: rawGameName, tagLine: rawTagLine } = await params;
  if (!isPlatform(region)) notFound();
  const platform: Platform = region;

  // Next 16 entrega los params codificados: decodificamos una vez acá.
  const gameName = decodeParam(rawGameName);
  const tagLine = decodeParam(rawTagLine);

  const sp = await searchParams;
  const queueParam = first(sp.queue);
  const queueFilter: QueueFilterId = isQueueFilter(queueParam)
    ? queueParam
    : "all";
  const championParam = first(sp.champion);

  let profile;
  try {
    profile = await loadProfile(platform, gameName, tagLine);
  } catch (error) {
    if (error instanceof RiotApiError && error.status === 404) notFound();
    return <DataError error={error} />;
  }

  const { account, matches, summoner, league, progress, source, partial } =
    profile;

  const catalog = await getChampionCatalog();
  const demo = source === "demo";
  // championName de Riot -> nombre localizado ("Kaisa" -> "Kai'Sa", "Nunu" -> "Nunu y Willump")
  const names: Record<string, string> = Object.fromEntries(
    catalog.all.map((champion) => [champion.id, champion.name]),
  );

  const queueIds = queuesFor(queueFilter);
  const inQueue =
    queueIds.length === 0
      ? matches
      : matches.filter((match) => queueIds.includes(match.info.queueId));

  const summary = summarize(inQueue, account.puuid);
  const rows = toMatchSummaries(inQueue, account.puuid);

  const selected = championParam
    ? summary.champions.find((c) => c.championName === championParam)
    : undefined;

  const visible = (selected ? rows.filter((r) => r.championName === selected.championName) : rows).slice(0, 20);
  const top = summary.champions[0];

  const queueLabelText =
    queueFilter === "all"
      ? ""
      : ` en ${QUEUE_FILTERS.find((f) => f.id === queueFilter)?.label ?? "esta cola"}`;
  const baseSuffix = queueLabelText + (demo ? ", cuenta de demostración" : "");

  const hrefFor = (options: { champion?: string; queue?: QueueFilterId } = {}) =>
    profileHref(platform, gameName, tagLine, {
      queue: options.queue ?? queueFilter,
      champion: options.champion ?? undefined,
    });

  return (
    <div className="space-y-6">
      <ProfileHeader
        gameName={account.gameName ?? gameName}
        tagLine={account.tagLine ?? tagLine}
        platform={platform}
        level={summoner?.summonerLevel ?? null}
        iconId={summoner?.profileIconId ?? null}
        version={catalog.version}
        league={league}
        demo={demo}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Partidas analizadas"
          value={String(summary.matches)}
          hint={
            partial
              ? `de ${progress.known} conocidas · sigue en curso`
              : summary.from && summary.to
                ? `${formatDate(summary.from)} — ${formatDate(summary.to)}`
                : "sin partidas"
          }
        />
        <StatCard
          label="Winrate (analizadas)"
          value={percent(summary.winrate)}
          hint={`${summary.wins}V · ${summary.losses}D`}
          accent={summary.winrate >= 0.5 ? "win" : "loss"}
        />
        <StatCard
          label="KDA promedio"
          value={summary.kda.toFixed(2)}
          hint="(K + A) / D"
        />
        <StatCard
          label="Más jugado"
          value={
            top ? (names[top.championName] ?? top.championName) : "—"
          }
          hint={
            top ? `${top.games} partidas · ${percent(top.winrate)} WR` : undefined
          }
          accent="gold"
        />
      </section>

      {partial && progress.known > 0 ? (
        <section
          className="rounded-xl border border-line bg-ink-900/60 p-4"
          aria-label="Progreso del análisis"
        >
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xs text-muted">
              Analizando el historial:{" "}
              <strong className="text-gold-300">
                {progress.detailed} de {progress.known}
              </strong>{" "}
              partidas conocidas
            </p>
            <span className="tabular text-[11px] text-muted">
              {Math.round((progress.detailed / progress.known) * 100)}%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-800">
            <div
              className="h-full rounded-full bg-gold-500"
              style={{
                width: `${Math.max(2, Math.round((progress.detailed / progress.known) * 100))}%`,
              }}
            />
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            Se completa solo con cada visita (o con{" "}
            <code className="text-gold-400">npm run ingest</code>). Riot limita el
            historial recuperable a ~1.000 partidas por jugador.
          </p>
        </section>
      ) : null}

      {source === "live" ? (
        <p className="rounded-lg border border-gold-600/40 bg-gold-600/10 px-4 py-3 text-xs leading-relaxed text-gold-300">
          Este jugador todavía no está en la base: se muestran las últimas{" "}
          {matches.length} partidas pedidas en vivo. Corré{" "}
          <code className="text-gold-400">npm run ingest -- &quot;
          {account.gameName}#{account.tagLine}&quot; {platform}</code> para
          analizar el historial completo.
        </p>
      ) : null}

      <nav aria-label="Filtrar por cola" className="flex flex-wrap gap-2">
        {QUEUE_FILTERS.map((filter) => {
          const active = filter.id === queueFilter;
          return (
            <Link
              key={filter.id}
              href={profileHref(platform, gameName, tagLine, {
                queue: filter.id,
                champion: championParam,
              })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                active
                  ? "border-gold-600/70 bg-gold-600/10 text-gold-200"
                  : "border-line text-muted hover:border-gold-600/40 hover:text-gold-300",
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="rounded-xl border border-line bg-ink-900/80 lg:col-span-3">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gold-400">
              Por campeón
            </h2>
            <span className="text-[11px] text-muted">
              {summary.champions.length} campeones
            </span>
          </div>
          <div className="p-3">
            <ChampionTable
              champions={summary.champions}
              version={catalog.version}
              names={names}
              selected={selected?.championName}
              totalMatches={summary.matches}
              hrefFor={(championName) => hrefFor({ champion: championName })}
            />
          </div>
        </section>

        <section className="space-y-4 lg:col-span-2">
          {selected ? (
            <div className="rounded-xl border border-gold-600/40 bg-gold-600/[0.07] p-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                Campeón seleccionado
              </p>
              <p className="mt-1 text-xl font-semibold text-gold-200">
                {names[selected.championName] ?? selected.championName}
              </p>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-ink-900/70 p-2">
                  <dt className="text-[10px] uppercase text-muted">Partidas</dt>
                  <dd className="tabular text-lg text-gold-200">
                    {selected.games}
                  </dd>
                </div>
                <div className="rounded-lg bg-ink-900/70 p-2">
                  <dt className="text-[10px] uppercase text-muted">Winrate</dt>
                  <dd
                    className={cn(
                      "tabular text-lg",
                      selected.winrate >= 0.5 ? "text-win" : "text-loss",
                    )}
                  >
                    {percent(selected.winrate)}
                  </dd>
                </div>
                <div className="rounded-lg bg-ink-900/70 p-2">
                  <dt className="text-[10px] uppercase text-muted">KDA</dt>
                  <dd className="tabular text-lg text-gold-200">
                    {selected.kda.toFixed(2)}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

          <div className="rounded-xl border border-line bg-ink-900/60 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
              Forma reciente
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {rows.slice(0, 20).map((row) => (
                <span
                  key={row.matchId}
                  title={`${names[row.championName] ?? row.championName} · ${row.win ? "Victoria" : "Derrota"}`}
                  className={cn(
                    "size-5 rounded-sm",
                    row.win ? "bg-win/70" : "bg-loss/70",
                  )}
                />
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted">
              Últimas {Math.min(rows.length, 20)} partidas ·{" "}
              {rows.slice(0, 20).filter((r) => r.win).length}V ·{" "}
              {rows.slice(0, 20).filter((r) => !r.win).length}D
            </p>
          </div>

          <div className="rounded-xl border border-line bg-ink-900/60 p-4">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 size-4 shrink-0 text-gold-600" aria-hidden />
              <div className="space-y-2 text-xs leading-relaxed text-muted">
                <p>
                  Base del cálculo:{" "}
                  <strong className="text-gold-300">
                    {`${summary.matches} partidas${baseSuffix}.`}
                  </strong>{" "}
                  {source === "db"
                    ? `Salen de la base local (${progress.known} partidas conocidas de esta cuenta).`
                    : `Pedidas en vivo a Riot (${analyzeCount()} por visita).`}
                </p>
                <p>
                  Riot limita el historial recuperable a ~1.000 partidas por
                  jugador, así que esto no es el total histórico de la cuenta.
                </p>
                {summary.customExcluded > 0 ? (
                  <p>
                    Se excluyeron {summary.customExcluded} partidas custom
                    (política de Riot).
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-line bg-ink-900/80">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gold-400">
            Últimas partidas
          </h2>
          <span className="text-[11px] text-muted">
            {selected
              ? `${visible.length} con ${names[selected.championName] ?? selected.championName}`
              : `${visible.length} de ${summary.matches} analizadas`}
          </span>
        </div>
        <MatchList
          matches={visible}
          version={catalog.version}
          names={names}
          puuid={account.puuid}
        />
      </section>
    </div>
  );
}

function DataError({ error }: { error: unknown }) {
  const status = error instanceof RiotApiError ? error.status : undefined;
  const message =
    error instanceof Error ? error.message : "Error desconocido al hablar con Riot.";

  const missingKey = error instanceof MissingApiKeyError;

  const keyRejected = status === 401 || status === 403;

  const title = missingKey
    ? "Falta configurar la API key"
    : status === 429
      ? "Riot nos está limitando"
      : keyRejected
        ? "La key de Riot no es válida"
        : "No pudimos traer los datos";

  const hint = missingKey
    ? "Definí RIOT_API_KEY en .env.local (o en las variables de entorno del deploy) y reiniciá el server. Mientras tanto podés correr en modo demo con RIOT_DEMO=1."
    : status === 429
      ? "Se superó el rate limit de la API. Esperá un minuto y volvé a intentar."
      : keyRejected
        ? "Riot rechazó la key (401/403). Las dev keys se vencen cada 24 horas y también se invalidan si se regeneran: entrá a developer.riotgames.com, generá una nueva y actualizá .env.local."
        : "Puede ser un problema temporal de Riot. Probá de nuevo en un rato.";

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-loss/40 bg-loss/[0.07] p-6">
      <div className="flex items-center gap-2 text-loss">
        <AlertTriangle className="size-5" aria-hidden />
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <p className="mt-2 text-sm text-muted">{hint}</p>
      <p className="mt-4 break-words rounded-lg bg-ink-950/70 p-3 font-mono text-[11px] text-muted/80">
        {message}
      </p>
      <Link
        href="/"
        className="mt-5 inline-block text-sm text-gold-400 underline decoration-line hover:text-gold-300"
      >
        Volver al buscador
      </Link>
    </div>
  );
}
