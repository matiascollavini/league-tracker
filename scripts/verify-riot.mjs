#!/usr/bin/env node
/**
 * Verificación empírica de la API de Riot (docs/API-LOL.txt §18).
 *
 *   node scripts/verify-riot.mjs "Nombre#TAG" [plataforma]
 *
 * Necesita RIOT_API_KEY en .env.local (o en el entorno).
 * No usa dependencias: fetch nativo de Node 20+.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const CLUSTER = {
  la1: "americas", la2: "americas", na1: "americas", br1: "americas",
  euw1: "europe", eun1: "europe", tr1: "europe", ru: "europe", me1: "europe",
  kr: "asia", jp1: "asia",
  oc1: "sea", ph2: "sea", sg2: "sea", th2: "sea", vn2: "sea",
};

function loadEnv() {
  const file = resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

const ok = (label, detail = "") =>
  console.log(`  \x1b[32m✔\x1b[0m ${label}${detail ? ` — ${detail}` : ""}`);
const bad = (label, detail = "") =>
  console.log(`  \x1b[31m✘\x1b[0m ${label}${detail ? ` — ${detail}` : ""}`);
const info = (label, detail = "") =>
  console.log(`  \x1b[36m·\x1b[0m ${label}${detail ? ` — ${detail}` : ""}`);

async function call(url, key) {
  const res = await fetch(url, { headers: { "X-Riot-Token": key } });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { res, body };
}

async function main() {
  loadEnv();

  const key = process.env.RIOT_API_KEY?.trim();
  const riotId = process.argv[2] ?? process.env.RIOT_VERIFY_ID;
  const platform = (process.argv[3] ?? process.env.RIOT_DEFAULT_PLATFORM ?? "la2").toLowerCase();

  if (!key) {
    console.error(
      "\nFalta RIOT_API_KEY. Ponela en .env.local o exportala:\n" +
        '  RIOT_API_KEY=RGAPI-... node scripts/verify-riot.mjs "Nombre#TAG" la2\n',
    );
    process.exit(1);
  }
  if (!riotId || !riotId.includes("#")) {
    console.error('\nUso: node scripts/verify-riot.mjs "Nombre#TAG" [la2]\n');
    process.exit(1);
  }

  const cluster = CLUSTER[platform];
  if (!cluster) {
    console.error(`\nPlataforma desconocida: ${platform}\n`);
    process.exit(1);
  }

  const [gameName, tagLine] = riotId.split("#");
  const enc = encodeURIComponent;

  console.log(`\nVerificando Riot API — ${gameName}#${tagLine} en ${platform} (${cluster})\n`);

  // 1) ACCOUNT-V1
  const accountUrl = `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${enc(gameName)}/${enc(tagLine)}`;
  const account = await call(accountUrl, key);
  if (!account.res.ok) {
    bad("account-v1 by-riot-id", `${account.res.status} ${JSON.stringify(account.body)}`);
    process.exit(1);
  }
  const puuid = account.body.puuid;
  ok("account-v1 by-riot-id", `puuid de ${puuid.length} chars`);

  // 2) SUMMONER-V4 + headers de rate limit
  const summonerUrl = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  const summoner = await call(summonerUrl, key);
  if (summoner.res.ok) {
    ok("summoner-v4 by-puuid", `nivel ${summoner.body.summonerLevel}`);
  } else {
    bad("summoner-v4 by-puuid", String(summoner.res.status));
  }
  const appLimit = summoner.res.headers.get("x-app-rate-limit");
  const methodLimit = summoner.res.headers.get("x-method-rate-limit");
  if (appLimit) info("x-app-rate-limit", appLimit);
  if (methodLimit) info("x-method-rate-limit", methodLimit);

  // 3) LEAGUE-V4
  const leagueUrl = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
  const league = await call(leagueUrl, key);
  if (league.res.ok) {
    const queues = Array.isArray(league.body)
      ? league.body.map((e) => `${e.queueType}:${e.tier} ${e.rank}`).join(", ") || "sin rank"
      : "respuesta inesperada";
    ok("league-v4 entries/by-puuid", queues);
  } else {
    bad("league-v4 entries/by-puuid", String(league.res.status));
  }

  // 4) CHAMPION-MASTERY-V4
  const masteryUrl = `https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puucidSafe(puuid)}/top?count=3`;
  const mastery = await call(masteryUrl, key);
  if (mastery.res.ok) {
    const top = (mastery.body ?? [])
      .map((m) => `#${m.championId} ${m.championPoints} pts`)
      .join(", ");
    ok("champion-mastery-v4 by-puuid", top || "sin datos");
  } else {
    bad("champion-mastery-v4 by-puuid", String(mastery.res.status));
  }

  // 5) MATCH-V5: validación de count (101 debe dar 400)
  const idsBase = `https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`;
  const tooMany = await call(`${idsBase}?start=0&count=101`, key);
  if (tooMany.res.status === 400) {
    ok("match-v5 ids count=101", "400 como se esperaba");
  } else {
    bad("match-v5 ids count=101", `esperaba 400, dio ${tooMany.res.status}`);
  }

  const zero = await call(`${idsBase}?start=0&count=0`, key);
  if (zero.res.ok && Array.isArray(zero.body) && zero.body.length === 0) {
    ok("match-v5 ids count=0", "[] como se esperaba");
  } else {
    bad("match-v5 ids count=0", `dio ${zero.res.status}`);
  }

  // 6) Top de historial: ¿cuántas partidas devuelve la ventana real?
  const page900 = await call(`${idsBase}?start=900&count=100`, key);
  const page1200 = await call(`${idsBase}?start=1200&count=100`, key);
  const at900 = Array.isArray(page900.body) ? page900.body.length : 0;
  const at1200 = Array.isArray(page1200.body) ? page1200.body.length : 0;
  info("historial en start=900", `${at900} ids (status ${page900.res.status})`);
  info("historial en start=1200", `${at1200} ids (status ${page1200.res.status})`);

  // Ventana estimada: primera página vacía a partir de 900.
  let window = 900 + at900;
  if (at1200 > 0) window = 1200 + at1200;
  console.log(
    `\n\x1b[1mVentana de historial observada: ~${window} partidas.\x1b[0m` +
      "\nSi ronda las 1.000, queda confirmado empíricamente el tope de Riot.\n" +
      "\nAnotá en docs/API-LOL.txt §17 los valores de x-app-rate-limit y esta ventana.\n",
  );
}

function puucidSafe(puuid) {
  return encodeURIComponent(puuid);
}

main().catch((error) => {
  console.error("\nError inesperado:", error);
  process.exit(1);
});
