import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeftRight, CheckCircle2, Info } from "lucide-react";
import { ChampionPool } from "@/components/champion-pool";
import { ChampionTable } from "@/components/champion-table";
import { ChampionPicks } from "@/components/champion-picks";
import { LiveBadge } from "@/components/live-badge";
import { MatchList } from "@/components/match-list";
import { Pagination } from "@/components/pagination";
import { ProfileHero, RankSummary } from "@/components/profile-header";
import { RoleStrip } from "@/components/role-strip";
import { StatCard } from "@/components/stat-card";
import { RefreshButton } from "@/components/refresh-button";
import { WinrateBar } from "@/components/winrate-bar";
import {
  formatDate,
  matchTimes,
  percent,
  pickHighlights,
  summarize,
  toMatchSummaries,
  type MatchTimes,
} from "@/lib/riot/aggregate";
import { loadProfile } from "@/lib/profile";
import {
  isPlatform,
  isQueueFilter,
  PLATFORM_LABEL,
  queueLabel,
  queuesFor,
  QUEUE_FILTERS,
  type Platform,
  type QueueFilterId,
} from "@/lib/riot/config";
import { championIconUrl, getChampionCatalog } from "@/lib/ddragon/champions";
import { MissingApiKeyError, RiotApiError } from "@/lib/riot/http";
import { analyzeCount } from "@/lib/riot/matches";
import { elapsedSeconds, findActiveGame } from "@/lib/riot/spectator";
import { groupTeams, toPanelPlayer, type PanelTeam } from "@/lib/riot/panel";
import { profileHref } from "@/lib/links";
import { decodeParam } from "@/lib/params";
import { cn } from "@/lib/utils";

type RouteParams = { region: string; gameName: string; tagLine: string };
type SearchParams = Record<string, string | string[] | undefined>;

/** Partidas por página de la lista de abajo. */
const PAGE_SIZE = 20;

export const revalidate = 120;
// En Vercel el render puede sincronizar un poco contra Riot.
export const maxDuration = 60;

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
  const showAllChampions = first(sp.all) === "1";
  const pageParam = Number(first(sp.page) ?? "1");
  const requestedPage =
    Number.isFinite(pageParam) && pageParam >= 1 ? Math.floor(pageParam) : 1;

  let profile;
  try {
    profile = await loadProfile(platform, gameName, tagLine);
  } catch (error) {
    if (error instanceof RiotApiError && error.status === 404) notFound();
    return <DataError error={error} />;
  }

  const {
    account,
    puuid,
    puuids: playerPuuids,
    platform: effectivePlatform,
    platformMismatch,
    rankStale,
    matches,
    summoner,
    league,
    progress,
    source,
    partial,
    complete,
    upToDate,
    verificationUnknown,
  } = profile;

  // El catálogo (Data Dragon) y la partida en curso (SPECTATOR-V5) son
  // independientes: van en paralelo. `findActiveGame` nunca tira: si Riot
  // limita o la key venció, simplemente no hay badge.
  const [catalog, live] = await Promise.all([
    getChampionCatalog(),
    findActiveGame(playerPuuids, effectivePlatform),
  ]);
  const liveGame = live?.game ?? null;
  const liveChampion =
    liveGame?.championId === null || liveGame?.championId === undefined
      ? null
      : (catalog.byKey.get(liveGame.championId) ?? null);
  const demo = source === "demo";
  // championName de Riot -> nombre localizado ("Kaisa" -> "Kai'Sa")
  const names: Record<string, string> = Object.fromEntries(
    catalog.all.map((champion) => [champion.id, champion.name]),
  );

  const queueIds = queuesFor(queueFilter);
  const inQueue =
    queueIds.length === 0
      ? matches
      : matches.filter((match) => queueIds.includes(match.info.queueId));

  // El agregado va sobre TODOS los puuids del jugador: sus partidas viejas y las
  // nuevas están registradas con puuids distintos (Riot los reasigna).
  const summary = summarize(inQueue, playerPuuids);
  const rows = toMatchSummaries(inQueue, playerPuuids);

  const selected = championParam
    ? summary.champions.find((c) => c.championName === championParam)
    : undefined;

  const filtered = selected
    ? rows.filter((row) => row.championName === selected.championName)
    : rows;
  // Si la página pedida ya no existe (cambió el filtro o se achicó el historial)
  // mostramos la última en vez de una lista vacía.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const pageStart = (page - 1) * PAGE_SIZE;
  const visible = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const top = summary.champions[0];
  // Mejores y peores picks entre los más jugados (no toca `summary.champions`).
  const highlights = pickHighlights(summary.champions);
  const recent = rows.slice(0, 20);
  const recentWins = recent.filter((row) => row.win).length;

  // Horas de cada fila, formateadas acá: la lista es un client component y no
  // puede calcular "hace 2 h" sin arriesgar diferencias de hidratación.
  const times: Record<string, MatchTimes> = {};
  for (const row of visible) times[row.matchId] = matchTimes(row.playedAt);

  // Si la partida llegó con su roster completo (vía directa a Riot o demo), el
  // desplegable arranca con los 10 jugadores y no pide nada. Lo que se lee de la
  // base en esta página trae solo al jugador del perfil: eso se pide al abrir,
  // contra `/api/partida/[matchId]` (lee match_participants, no va a Riot).
  const matchById = new Map(
    inQueue.map((match) => [match.metadata.matchId, match]),
  );
  const teamsByMatch: Record<string, PanelTeam[]> = {};
  for (const row of visible) {
    const match = matchById.get(row.matchId);
    if (match && match.info.participants.length > 1) {
      teamsByMatch[row.matchId] = groupTeams(
        match.info.participants.map(toPanelPlayer),
      );
    }
  }

  const queueLabelText =
    queueFilter === "all"
      ? ""
      : ` en ${QUEUE_FILTERS.find((f) => f.id === queueFilter)?.label ?? "esta cola"}`;
  const baseSuffix = queueLabelText + (demo ? ", cuenta de demostración" : "");

  const hrefFor = (
    options: {
      /** `null` quita el filtro de campeón; `undefined` lo mantiene. */
      champion?: string | null;
      queue?: QueueFilterId;
      all?: boolean;
      page?: number;
    } = {},
  ) =>
    profileHref(platform, gameName, tagLine, {
      queue: options.queue ?? queueFilter,
      champion:
        options.champion === null ? undefined : (options.champion ?? championParam),
      all: options.all ?? showAllChampions,
      // Los cambios de filtro no arrastran la página: vuelven al principio.
      page: options.page,
    });

  return (
    <div className="space-y-4">
      {/* ---------------- hero del perfil + tabs de cola ---------------- */}
      <ProfileHero
        gameName={account.gameName ?? gameName}
        tagLine={account.tagLine ?? tagLine}
        platform={effectivePlatform}
        level={summoner?.summonerLevel ?? null}
        iconId={summoner?.profileIconId ?? null}
        version={catalog.version}
        demo={demo}
        live={
          liveGame ? (
            <LiveBadge
              puuid={live?.puuid ?? puuid}
              platform={effectivePlatform}
              startedAt={liveGame.startedAt}
              base={elapsedSeconds(liveGame)}
              queueLabel={
                liveGame.queueId === null ? null : queueLabel(liveGame.queueId)
              }
              champion={
                liveChampion
                  ? {
                      name: liveChampion.name,
                      iconUrl: championIconUrl(
                        catalog.version,
                        liveChampion.id,
                      ),
                    }
                  : null
              }
            />
          ) : null
        }
        actions={
          // En demo no hay key: /api/sync devolvería 503.
          demo ? null : (
            <RefreshButton
              platform={effectivePlatform}
              gameName={account.gameName ?? gameName}
              tagLine={account.tagLine ?? tagLine}
              upToDate={upToDate}
              unverified={verificationUnknown}
            />
          )
        }
        tabs={
          <nav
            aria-label="Filtrar por cola"
            className="flex items-stretch overflow-x-auto border-t border-white/10 bg-primary/4 px-2"
          >
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
                    "flex shrink-0 items-center border-b-2 px-3 pb-2.5 pt-2 text-xs font-semibold transition-colors",
                    active
                      ? "border-primary text-fg"
                      : "border-transparent text-muted hover:text-fg",
                  )}
                >
                  {filter.label}
                </Link>
              );
            })}
          </nav>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* ---------------- barra lateral ---------------- */}
        <aside className="space-y-4 lg:sticky lg:top-[76px] lg:self-start">
          <RankSummary league={league} rankStale={rankStale} />

          <div className="panel px-3 py-3">
            <div className="flex items-baseline justify-between">
              <p className="section-title">Forma reciente</p>
              <span className="tabular text-[11px] font-semibold text-muted">
                {recentWins}V · {recent.length - recentWins}D
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              {recent.map((row) => (
                <Link
                  key={row.matchId}
                  href={`/partida/${encodeURIComponent(row.matchId)}?player=${encodeURIComponent(row.puuid)}${row.puuid === puuid ? "" : `&viewer=${encodeURIComponent(puuid)}`}`}
                  title={`${names[row.championName] ?? row.championName} · ${row.win ? "Victoria" : "Derrota"}`}
                  className={cn(
                    "size-4 rounded-[2px] transition-transform hover:scale-125",
                    row.win ? "bg-win/80" : "bg-loss/70",
                  )}
                />
              ))}
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="label">Winrate</span>
              <span
                className={cn(
                  "tabular text-[12px] font-bold",
                  summary.winrate >= 0.5 ? "text-gold-soft" : "text-orange/80",
                )}
              >
                {percent(summary.winrate)}
              </span>
            </div>
            <WinrateBar value={summary.winrate} className="mt-1" />

            <Link
              href={`/comparar?a=${effectivePlatform}/${encodeURIComponent(account.gameName ?? gameName)}/${encodeURIComponent(account.tagLine ?? tagLine)}`}
              className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted transition-colors hover:text-primary"
            >
              <ArrowLeftRight className="size-3" aria-hidden />
              Comparar con otro jugador
            </Link>
          </div>
        </aside>

        {/* ---------------- contenido ---------------- */}
        <div className="min-w-0 space-y-4">
          <section className="panel grid grid-cols-2 gap-px overflow-hidden bg-line/60 sm:grid-cols-4">
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
              accent={summary.winrate >= 0.5 ? "gold" : "loss"}
            />
            <StatCard
              label="KDA promedio"
              value={summary.kda.toFixed(2)}
              hint="(K + A) / D"
              accent="blue"
            />
            <StatCard
              label="Más jugado"
              value={top ? (names[top.championName] ?? top.championName) : "—"}
              hint={
                top
                  ? `${top.games} partidas · ${percent(top.winrate)} WR`
                  : undefined
              }
              accent="gold"
            />
          </section>

          {platformMismatch ? (
            <p className="rounded-md border border-gold/20 bg-gold/8 px-3 py-2.5 text-[11px] leading-relaxed text-muted">
              Esta cuenta está guardada en{" "}
              <strong className="font-bold text-gold">
                {PLATFORM_LABEL[effectivePlatform]}
              </strong>
              . La buscaste en {PLATFORM_LABEL[platform]}, así que te muestro los
              datos de su región real.
            </p>
          ) : null}

          {/* La acción vive en el hero ("Actualizar ahora"): acá queda solo la
              confirmación de que no hay nada pendiente. */}
          {complete ? (
            <p className="panel flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2.5 text-[11px] text-muted">
              <CheckCircle2 className="size-3.5 shrink-0 text-win" aria-hidden />
              <span>
                Historial completo:{" "}
                <strong className="font-bold text-fg">
                  {progress.detailed} partidas analizadas
                </strong>
                {summary.from && summary.to
                  ? ` (${formatDate(summary.from)} — ${formatDate(summary.to)})`
                  : ""}
                .
              </span>
              <span className="text-dim">
                Riot permite hasta ~1.000 por jugador.
              </span>
            </p>
          ) : null}

          {source === "live" ? (
            <p className="rounded-md border border-primary/20 bg-primary/8 px-3 py-2.5 text-[11px] leading-relaxed text-muted">
              Este jugador todavía no está en la base: se muestran las últimas{" "}
              {matches.length} partidas pedidas en vivo. Usá{" "}
              <strong className="font-bold text-fg">Actualizar ahora</strong>{" "}
              para analizar los últimos dos años.
            </p>
          ) : null}

          {/* pool de campeones */}
          <section className="space-y-2">
            <div className="flex items-baseline justify-between">
              <h2 className="section-title">Picks más jugados</h2>
              <span className="text-[11px] font-medium text-dim">
                {summary.champions.length} campeones
              </span>
            </div>
            <ChampionPool
              champions={summary.champions}
              names={names}
              version={catalog.version}
              selected={selected?.championName}
              hrefFor={(championName) =>
                hrefFor({ champion: championName ?? null })
              }
            />
          </section>

          {/* recomendaciones: mejores y peores picks del pool */}
          <section
            className="grid gap-3 sm:grid-cols-2"
            aria-label="Recomendación de picks"
          >
            <ChampionPicks
              title="Mejores picks"
              tone="best"
              champions={highlights.best}
              names={names}
              version={catalog.version}
              selected={selected?.championName}
              hrefFor={(championName) =>
                hrefFor({ champion: championName ?? null })
              }
              emptyLabel="Todavía no hay partidas suficientes para recomendar un pick."
            />
            <ChampionPicks
              title="No pickees más esto"
              tone="worst"
              champions={highlights.worst}
              names={names}
              version={catalog.version}
              selected={selected?.championName}
              hrefFor={(championName) =>
                hrefFor({ champion: championName ?? null })
              }
              emptyLabel="Sin picks para desaconsejar por ahora."
            />
          </section>

        {selected ? (
          <div className="rounded-md border border-primary/25 bg-primary/8 px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <p className="text-[13px] font-bold text-fg">
                {names[selected.championName] ?? selected.championName}
              </p>
              <span className="tabular text-[11px] font-medium text-muted">
                {selected.games} partidas · {selected.wins}V {selected.losses}D
              </span>
              <span
                className={cn(
                  "tabular text-[11px] font-bold",
                  selected.winrate >= 0.5 ? "text-gold-soft" : "text-orange/80",
                )}
              >
                {percent(selected.winrate)} WR
              </span>
              <span className="tabular text-[11px] font-medium text-muted">
                KDA {selected.kda.toFixed(2)}
              </span>
              <Link
                href={hrefFor({ champion: null })}
                className="ml-auto text-[11px] font-semibold text-primary hover:underline"
              >
                quitar filtro
              </Link>
            </div>
          </div>
        ) : null}

        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-3 pb-1.5 pt-3">
            <h2 className="section-title">Por campeón</h2>
            <span className="text-[11px] font-medium text-dim">
              {summary.champions.length} campeones
            </span>
          </div>
          <div className="pb-2">
            <ChampionTable
              champions={summary.champions}
              version={catalog.version}
              names={names}
              selected={selected?.championName}
              totalMatches={summary.matches}
              hrefFor={(championName) =>
                hrefFor({ champion: championName ?? null })
              }
              showAll={showAllChampions}
              allHref={hrefFor({ all: true })}
              lessHref={hrefFor({ all: false })}
            />
          </div>
          <div className="border-t border-line/70 px-3 py-2">
            <RoleStrip rows={rows} />
          </div>
        </section>

        <section className="panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-1.5 pt-3">
            <h2 className="section-title">Últimas partidas</h2>
            <span className="text-[11px] font-medium text-dim">
              {selected
                ? `${filtered.length} con ${names[selected.championName] ?? selected.championName}`
                : `${filtered.length} de ${summary.matches} analizadas`}
              {totalPages > 1
                ? ` · mostrando ${pageStart + 1}–${pageStart + visible.length}`
                : ""}
            </span>
          </div>
          <MatchList
            matches={visible}
            times={times}
            teamsByMatch={teamsByMatch}
            version={catalog.version}
            names={names}
            puuid={puuid}
          />
          {totalPages > 1 ? (
            <Pagination
              page={page}
              totalPages={totalPages}
              hrefFor={(target) => hrefFor({ page: target })}
              className="border-t border-line/70 px-3 py-2"
            />
          ) : null}
        </section>

        <div className="rounded-md border border-white/5 bg-card/60 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
            <div className="space-y-1 text-[11px] leading-relaxed text-muted">
              <p>
                Base del cálculo:{" "}
                <strong className="font-bold text-fg">
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
        </div>
      </div>
    </div>
  );
}

function DataError({ error }: { error: unknown }) {
  const status = error instanceof RiotApiError ? error.status : undefined;
  const message =
    error instanceof Error
      ? error.message
      : "Error desconocido al hablar con Riot.";

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
    <div className="mx-auto max-w-xl rounded-md border border-loss/25 bg-loss/8 p-5">
      <div className="flex items-center gap-2 text-loss">
        <AlertTriangle className="size-4" aria-hidden />
        <h1 className="text-[15px] font-bold">{title}</h1>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-muted">{hint}</p>
      <p className="mt-3 break-words rounded bg-shade p-2.5 font-mono text-[10px] text-dim">
        {message}
      </p>
      <Link
        href="/"
        className="mt-4 inline-block text-[12px] font-semibold text-primary hover:underline"
      >
        Volver al buscador
      </Link>
    </div>
  );
}
