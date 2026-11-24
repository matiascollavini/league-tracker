# Deploy a producción (todo gratis)

Objetivo: el sitio online, con la base en la nube y el historial completándose
solo en segundo plano.

```
Vercel (Next.js)  ──►  Turso (SQLite en la nube)
      ▲                        ▲
      │                        │
   usuario                 GitHub Actions
                       (worker cada 10 min)
```

| Pieza | Plan gratis | Alcanza para |
| --- | --- | --- |
| Vercel Hobby | 1M invocaciones/mes | el sitio |
| Turso | 5 GB, 500M lecturas, 10M escrituras/mes | ~800 cuentas completas |
| GitHub Actions | 2.000 min/mes (repo público) | 1 worker cada 10 min |

Costo total: **USD 0**.

---

## 1. Crear la base en Turso

1. Entrá a <https://turso.tech> y creá la cuenta (con GitHub o email).
2. **Create Database** → nombre: `league-page` → región: la más cercana
   (`aws-us-east-1` o `gcp-southamerica-east1` si está disponible).
3. Entrá a la base y copiá:
   - **Database URL**: `libsql://league-page-tuuser.turso.io`
   - **Token**: *Create Token* → permiso **read & write** → `eyJ...`

> Ese token es un secreto: va en variables de entorno, nunca en el código.

## 2. Probar la conexión desde tu máquina

Antes de deployar, verificá que la base remota responde:

```bash
# Git Bash
DATABASE_URL="libsql://..." DATABASE_AUTH_TOKEN="eyJ..." npm run db:migrate

# PowerShell
$env:DATABASE_URL="libsql://..."; $env:DATABASE_AUTH_TOKEN="eyJ..."; npm run db:migrate
```

Debe imprimir las 4 tablas y `✔ esquema listo`.

### Subir el historial que ya tenés en local

No hace falta volver a pedirle nada a Riot: se copia el archivo local a Turso.

```bash
npm run db:copy -- --prod     # local -> Turso (usa .env.turso.local)
npm run db:stats -- --prod    # ver qué quedó en la nube
```

Los scripts aceptan `--prod`, que carga `.env.turso.local` (gitignoreado) con la
URL y el token de Turso. Para el worker en producción:

```bash
npm run worker -- --prod --minutes=8 --budget=250
```

## 3. Deploy en Vercel

1. Subí el repo a GitHub (privado o público).
2. En <https://vercel.com> → **Add New Project** → importá el repo.
3. Framework: Next.js (lo detecta solo). No cambies el build command.
4. **Environment Variables** (Production *y* Preview):

| Variable | Valor |
| --- | --- |
| `RIOT_API_KEY` | `RGAPI-...` (dev key para probar; production key para publicar) |
| `DATABASE_URL` | `libsql://league-page-....turso.io` |
| `DATABASE_AUTH_TOKEN` | `eyJ...` |
| `RIOT_DEFAULT_PLATFORM` | `la2` (o `la1`, `na1`, ...) |
| `DD_LOCALE` | `es_ES` |
| `RIOT_ANALYZE_COUNT` | `24` |
| `RIOT_ONDEMAND_BUDGET` | `25` con dev key · `300`–`400` con production key |
| `TURSO` | no hace falta en Vercel (solo para los scripts locales) |

**Qué significa `RIOT_ONDEMAND_BUDGET`:** cuántos requests puede gastar la
primera búsqueda de una cuenta nueva. Con `25`, el usuario ve las últimas ~24
partidas al instante y el resto llega por el worker. Con `400` y production key,
la cuenta queda casi completa en esa misma visita (~15 s).

5. **Deploy**. La primera búsqueda va a sincronizar ~24 partidas en el momento
   y el resto queda en cola para el worker.

### Si usaste la integración de Turso desde Vercel

La integración del Marketplace **puede crear una base nueva** (vacía) en vez de
usar la que ya tenés, y además inyecta las variables con otros nombres:
`TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`.

El código acepta los dos juegos de nombres, con este orden de prioridad:

1. `DATABASE_URL` / `DATABASE_AUTH_TOKEN`
2. `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` (integración de Vercel)
3. `file:./data/league.db` (local, solo desarrollo)

**Cómo saber a qué base está conectado el deploy:**

```
https://TU-APP.vercel.app/api/health
```

Devuelve el host, de qué variable salió, la versión del esquema y cuántas
partidas/jugadores hay. Si ves `matches: 0` o un host distinto de
`league-page-...turso.io`, está apuntando a la base nueva y vacía.

**Qué hacer en ese caso:** cargar a mano `DATABASE_URL` y `DATABASE_AUTH_TOKEN`
con la URL y el token de la base que ya tiene los datos (esas variables ganan
sobre las de la integración) y redeployar. Alternativa: dejar la base nueva y
subirle los datos con `npm run db:copy` apuntando a ella.

## 4. Activar el worker (GitHub Actions)

El cron ya está en `.github/workflows/worker.yml`. Solo hay que darle los
secretos:

1. En GitHub: **Settings → Secrets and variables → Actions → New repository
   secret**, tres veces:

| Secret | Valor |
| --- | --- |
| `RIOT_API_KEY` | `RGAPI-...` |
| `DATABASE_URL` | `libsql://league-page-....turso.io` |
| `DATABASE_AUTH_TOKEN` | `eyJ...` |

2. Pestaña **Actions → worker → Run workflow** para probarlo a mano.
3. Listo: cada 10 minutos baja lo pendiente. Si no hay nada, termina en 2 s.

> Con **dev key** el worker avanza ~250 partidas por corrida (la key permite
> 100 requests cada 2 min). Con **production key** baja ~1.000 en una sola
> corrida de 20 s.

## 5. Pedir la production key de Riot

Necesaria para que el sitio sea público y no muera cada 24 h:

1. <https://developer.riotgames.com> → **Register Product** → *Production*.
2. Requisitos (ya cumplidos por el proyecto):
   - Sitio deployado y funcionando.
   - `/legal/terminos` y `/legal/privacidad` publicadas.
   - Verificación de dominio: Riot te da un string para subir a tu URL
     (creá un archivo público con ese texto).
3. Revisión: semanal, hasta 3 semanas. Cuando la aprueben, reemplazás
   `RIOT_API_KEY` en Vercel y en GitHub Secrets.

## 6. Verificar que todo anda

```bash
# desde tu máquina, contra la base de producción
DATABASE_URL="libsql://..." DATABASE_AUTH_TOKEN="eyJ..." npm run db:stats
```

Y en el sitio: buscá una cuenta nueva → debería mostrar datos al toque y la
barra de progreso; a los ~10 minutos la barra avanza sin que hagas nada.

---

## Cómo se mantiene barato (diseño)

| Medida | Efecto |
| --- | --- |
| Ventana explícita de 2 años (`startTime`) | no pedimos historial que Riot ya no tiene |
| Página 0 en cada corrida + cursor para el resto | las partidas nuevas se ven al instante y el backfill no repite |
| Detalle global por `matchId` | si tu amigo jugó con alguien ya cacheado, no se vuelve a pedir |
| 1 fila por partida + 10 por participantes | 2,6 KB por partida (medido) |
| Presupuesto por corrida (`--budget`, `--minutes`) | nunca se pasa del rate limit ni del timeout |
| Lock por jugador en la base | dos visitas simultáneas no duplican trabajo |
| `fetch` cache + ISR | una visita repetida no toca la base ni Riot |

## Problemas típicos

| Síntoma | Causa | Solución |
| --- | --- | --- |
| `401 Unknown apikey` | dev key vencida (24 h) | regenerar y actualizar env vars |
| Página vacía / error de DB | `DATABASE_URL` mal o token sin permiso | `npm run db:migrate` contra esa base |
| El worker no avanza | secretos faltantes o key vencida | Actions → ver el log del run |
| Datos viejos en el sitio | ISR de 120 s | esperar 2 minutos o recargar con `?v=1` |
