# Deploy a producción (todo gratis)

Objetivo: el sitio online, con la base en la nube y el historial completándose
solo en segundo plano.

```
Vercel (Next.js)  ──►  Turso (SQLite en la nube)
      ▲                        ▲
      │                        │
   usuario                 GitHub Actions
                    (worker + snapshots de rango)
```

| Pieza | Plan gratis | Alcanza para |
| --- | --- | --- |
| Vercel Hobby | 1M invocaciones/mes | el sitio |
| Turso | 5 GB, 500M lecturas, 10M escrituras/mes | ~800 cuentas completas |
| GitHub Actions | gratis en repo público | worker cada 10 min + rango cada 30 min |

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

### Bajar producción al SQLite local (paridad dev/prod)

`npm run dev` lee `data/league.db`; la web lee Turso. Si el local está atrasado,
el mismo perfil muestra otro pool de campeones y otros picks. Para que dev vea
exactamente lo que hay en producción:

```bash
npm run db:pull     # Turso -> data/league.db (sólo SELECT a prod, idempotente)
```

No apuntes dev a Turso: el sync on-demand del perfil **escribe** en la base.

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
| `RIOT_SYNC_CHUNK` | requests por tanda del botón "Cargar todo": `30` con personal key · `300` con production key |
| `RIOT_SYNC_DEADLINE_MS` | tope de tiempo por tanda: `40000` (deja margen bajo el `maxDuration` de 60 s) |
| `RIOT_REQUEST_TIMEOUT_MS` | corte por request a Riot: `15000` |
| `TURSO` | no hace falta en Vercel (solo para los scripts locales) |

**Por qué el chunk es 30 y no 40:** con dev key el límite es 100 requests cada
2 minutos (~0,83 por segundo). 30 requests son ~36 s; 40 se acercaban a los 60 s
de `maxDuration` y, si la función moría a mitad de tanda, el lock quedaba tomado
10 minutos. Ahora, además, cada tanda corta sola a los 40 s (`RIOT_SYNC_DEADLINE_MS`)
y devuelve lo que alcanzó a hacer.

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

## 4. Activar los crons (GitHub Actions)

Hay dos workflows y **los dos** necesitan los mismos tres secretos:

| Workflow | Qué hace | Cuándo |
| --- | --- | --- |
| `worker.yml` | baja las partidas que faltan | cada 10 min |
| `ranks.yml` | toma la foto de rango de cada cuenta (el gráfico de LP) | cada 30 min |

1. En GitHub: **Settings → Secrets and variables → Actions → New repository
   secret**, tres veces:

| Secret | Valor |
| --- | --- |
| `RIOT_API_KEY` | `RGAPI-...` |
| `DATABASE_URL` | `libsql://league-page-....turso.io` |
| `DATABASE_AUTH_TOKEN` | `eyJ...` |

2. Pestaña **Actions**. Si es la primera vez, GitHub pide confirmar que querés
   habilitar los workflows.
3. **Actions → worker → Run workflow** para probarlo a mano. Después
   **Actions → ranks → Run workflow**.
4. Listo: el worker baja lo pendiente cada 10 min y `ranks` mantiene el
   historial de rango de las cuentas de la cola (`puuid_sync`).

> **Ojo con la dev key**: se vence cada 24 h y el cron empieza a fallar con
> 401/403 (el log de `ranks` lo dice explícito). Mientras tanto, regenerala en
> el portal o corré `npm run snapshot:ranks -- --prod` a mano desde tu máquina.
> Con dev key, además, `worker` y `ranks` comparten el límite de 100
> requests/2 min: van a aparecer 429 y las corridas avanzan menos cuentas. Con
> **production key** no hay problema.

> GitHub desactiva los crons de un repo sin actividad durante 60 días; si pasa,
> entrá a **Actions** y volvé a habilitarlos (o hacé un commit).

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

## Cuánto tarda completar una cuenta

| Partidas de la cuenta | Requests | Personal key | Production key |
| --- | --- | --- | --- |
| 300 | ~310 | ~6 min | ~10 s |
| 600 | ~610 | ~12 min | ~15 s |
| 1.000 | ~1.011 | ~20 min | ~25 s |

Se paga **una sola vez** por cuenta. Después, actualizarla cuesta 1 request
(página 0). El botón **"Cargar todo el historial"** del perfil hace esto mismo
desde la web, en tandas, con barra de progreso y sin bloquear la página.

El tope real de cuentas es Turso: 10M escrituras/mes ÷ 12 por partida ≈ **830
cuentas completas por mes** (y 5 GB dan para ~1.900).

## Problemas típicos

| Síntoma | Causa | Solución |
| --- | --- | --- |
| `401 Unknown apikey` | dev key vencida (24 h) | regenerar y actualizar env vars |
| Página vacía / error de DB | `DATABASE_URL` mal o token sin permiso | `npm run db:migrate` contra esa base |
| El worker no avanza | secretos faltantes o key vencida | Actions → ver el log del run |
| Datos viejos en el sitio | ISR de 120 s | esperar 2 minutos o recargar con `?v=1` |
