import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeftRight, Swords } from "lucide-react";
import { CompareForm } from "@/components/compare-form";
import { WinrateBar } from "@/components/winrate-bar";
import { championIconUrl, getChampionCatalog } from "@/lib/ddragon/champions";
import { profileIconUrl } from "@/lib/ddragon/champions";
import { PLATFORM_LABEL, platformFromEnv } from "@/lib/riot/config";
import { formatDate, percent, summarize, toMatchSummaries } from "@/lib/riot/aggregate";
import { loadProfile } from "@/lib/profile";
import { buildMetrics, parseSide, type ComparePlayer, type CompareSide } from "@/lib/compare";
import { profileHref } from "@/lib/links";
import { cn } from "@/lib/utils";
import type { PlayerSummary } from "@/lib/riot/aggregate";

export const metadata: Metadata = {
  title: "Comparar jugadores",
  description: "Compará dos cuentas de League of Legends lado a lado.",
};

export const revalidate = 300;

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

type Loaded = ComparePlayer & {
  iconId: number | null;
  level: number | null;
  progress: { known: number; detailed: number };
  range: { from: number | null; to: number | null };
};

async function loadSide(
  side: CompareSide,
  names: Record<string, string>,
): Promise<Loaded> {
  const profile = await loadProfile(side.platform, side.gameName, side.tagLine);
  const summary: PlayerSummary = summarize(profile.matches, profile.account.puuid);
  const rows = toMatchSummaries(profile.matches, profile.account.puuid);
  const recent = rows.slice(0, 20);
  const solo = profile.league.find((e) => e.queueType === "RANKED_SOLO_5x5");

  return {
    name: profile.account.gameName ?? side.gameName,
    tag: profile.account.tagLine ?? side.tagLine,
    platform: side.platform,
    summary,
    rank: solo?.tier
      ? `${solo.tier} ${solo.rank ?? ""} · ${solo.leaguePoints ?? 0} LP`
      : null,
    recent: {
      wins: recent.filter((row) => row.win).length,
      games: recent.length,
    },
    pool: summary.champions.slice(0, 3),
    iconId: profile.summoner?.profileIconId ?? null,
    level: profile.summoner?.summonerLevel ?? null,
    progress: profile.progress,
    range: { from: summary.from, to: summary.to },
  };
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const sideA = parseSide(first(sp.a));
  const sideB = parseSide(first(sp.b));

  const catalog = await getChampionCatalog();
  const names: Record<string, string> = Object.fromEntries(
    catalog.all.map((champion) => [champion.id, champion.name]),
  );

  const [resultA, resultB] = await Promise.allSettled([
    sideA ? loadSide(sideA, names) : Promise.resolve(null),
    sideB ? loadSide(sideB, names) : Promise.resolve(null),
  ]);

  const playerA = resultA.status === "fulfilled" ? resultA.value : null;
  const playerB = resultB.status === "fulfilled" ? resultB.value : null;

  const errorA =
    resultA.status === "rejected"
      ? sideA
        ? `No encontramos a ${sideA.gameName}#${sideA.tagLine} en ${sideA.platform.toUpperCase()}.`
        : null
      : null;
  const errorB =
    resultB.status === "rejected"
      ? sideB
        ? `No encontramos a ${sideB.gameName}#${sideB.tagLine} en ${sideB.platform.toUpperCase()}.`
        : null
      : null;

  const metrics =
    playerA && playerB ? buildMetrics(playerA, playerB) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <ArrowLeftRight className="size-5 text-gold-500" aria-hidden />
        <h1 className="text-xl font-semibold text-gold-200">Comparador</h1>
      </div>

      <section className="rounded-xl border border-line bg-ink-900/60 p-4">
        <CompareForm
          defaultPlatform={platformFromEnv()}
          a={sideA ? { platform: sideA.platform, riotId: `${sideA.gameName}#${sideA.tagLine}` } : undefined}
          b={sideB ? { platform: sideB.platform, riotId: `${sideB.gameName}#${sideB.tagLine}` } : undefined}
        />
      </section>

      {!sideA || !sideB ? (
        <div className="rounded-xl border border-line bg-ink-900/60 p-6 text-center">
          <Swords className="mx-auto size-6 text-gold-600" aria-hidden />
          <p className="mt-2 text-sm text-muted">
            Poné dos Riot ID para comparar partidas, winrate, KDA, rango y su
            campeón más jugado.
          </p>
        </div>
      ) : null}

      {errorA || errorB ? (
        <div className="space-y-2">
          {[errorA, errorB].filter(Boolean).map((message) => (
            <p
              key={message}
              className="rounded-lg border border-loss/40 bg-loss/[0.07] px-4 py-3 text-sm text-loss"
            >
              {message}
            </p>
          ))}
        </div>
      ) : null}

      {playerA && playerB ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2">
            <PlayerHeader player={playerA} version={catalog.version} names={names} />
            <PlayerHeader player={playerB} version={catalog.version} names={names} />
          </section>

          <section className="overflow-hidden rounded-xl border border-line bg-ink-900/80">
            <table className="w-full">
              <caption className="sr-only">
                Comparación métrica por métrica
              </caption>
              <tbody>
                {metrics.map((metric) => (
                  <tr key={metric.label} className="border-b border-line/60 last:border-0">
                    <td
                      className={cn(
                        "w-[38%] px-3 py-2.5 text-right text-sm tabular sm:px-4",
                        metric.winner === "a"
                          ? "font-semibold text-gold-200"
                          : "text-muted",
                      )}
                    >
                      {metric.a}
                    </td>
                    <td className="w-[24%] px-1 py-2.5 text-center text-[10px] uppercase tracking-wider text-muted/70">
                      {metric.label}
                    </td>
                    <td
                      className={cn(
                        "w-[38%] px-3 py-2.5 text-left text-sm tabular sm:px-4",
                        metric.winner === "b"
                          ? "font-semibold text-gold-200"
                          : "text-muted",
                      )}
                    >
                      {metric.b}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <Pool player={playerA} version={catalog.version} names={names} />
            <Pool player={playerB} version={catalog.version} names={names} />
          </section>

          <p className="text-[11px] leading-relaxed text-muted">
            Cada lado se calcula sobre las partidas analizadas de esa cuenta (
            {playerA.progress.detailed} y {playerB.progress.detailed}). Riot limita
            el historial recuperable a ~1.000 partidas por jugador, así que no es
            el total histórico.
          </p>
        </>
      ) : null}
    </div>
  );
}

function PlayerHeader({
  player,
  version,
  names,
}: {
  player: Loaded;
  version: string;
  names: Record<string, string>;
}) {
  const href = profileHref(player.platform, player.name, player.tag);

  return (
    <div className="rounded-xl border border-line bg-ink-900/80 p-4">
      <div className="flex items-center gap-3">
        <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-gold-600/50 bg-ink-800">
          {player.iconId ? (
            <Image
              src={profileIconUrl(version, player.iconId)}
              alt=""
              width={48}
              height={48}
              className="size-full object-cover"
            />
          ) : null}
        </div>
        <div className="min-w-0">
          <Link
            href={href}
            className="block truncate text-sm font-semibold text-gold-200 hover:text-gold-300"
          >
            {player.name}
            <span className="text-muted">#{player.tag}</span>
          </Link>
          <p className="truncate text-[11px] text-muted">
            {PLATFORM_LABEL[player.platform]}
            {player.level ? ` · Nivel ${player.level}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-baseline justify-between text-[11px]">
          <span className="text-muted">Winrate</span>
          <span className="tabular text-gold-300">
            {percent(player.summary.winrate)} · {player.summary.matches} partidas
          </span>
        </div>
        <WinrateBar value={player.summary.winrate} />
        <p className="text-[11px] text-muted">
          {player.rank ?? "Sin clasificar"}
          {player.range.from && player.range.to
            ? ` · ${formatDate(player.range.from)} — ${formatDate(player.range.to)}`
            : ""}
        </p>
        {player.summary.champions[0] ? (
          <p className="text-[11px] text-muted">
            Main:{" "}
            <span className="text-gold-300">
              {names[player.summary.champions[0].championName] ??
                player.summary.champions[0].championName}
            </span>{" "}
            · {player.summary.champions[0].games} partidas
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Pool({
  player,
  version,
  names,
}: {
  player: Loaded;
  version: string;
  names: Record<string, string>;
}) {
  return (
    <div className="rounded-xl border border-line bg-ink-900/80 p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
        Pool de {player.name}
      </p>
      <ul className="mt-2 space-y-2">
        {player.pool.map((champion) => (
          <li key={champion.championName} className="flex items-center gap-2.5">
            <Image
              src={championIconUrl(version, champion.championName)}
              alt=""
              width={32}
              height={32}
              className="size-8 rounded border border-line/80"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-gold-300">
                {names[champion.championName] ?? champion.championName}
              </p>
              <p className="text-[11px] text-muted">
                {champion.games} partidas · {percent(champion.winrate)} · KDA{" "}
                {champion.kda.toFixed(2)}
              </p>
            </div>
            <div className="w-16">
              <WinrateBar value={champion.winrate} size="sm" />
            </div>
          </li>
        ))}
        {player.pool.length === 0 ? (
          <li className="text-xs text-muted">Sin partidas analizadas.</li>
        ) : null}
      </ul>
    </div>
  );
}
