# RUNNER//NET — Marathon LFG

Unofficial fan project. Looking-for-Crew uplink for Marathon Runners with
Bungie OAuth as the front door, Cloudflare Workers + D1 as the runtime.

## Phases

- **Phase 1 — Auth + identity.** Bungie OAuth handshake, runner profile,
  bungie.net friend list. ✅
- **Phase 2 — LFG board.** Hosts post infil contracts, guests request a slot,
  pending → confirmed on host calling infil, then a one-click manual friend
  handoff per Runner via bungie.net. ✅

## Stack

- Next.js 16 (App Router) + React 19, TypeScript, Tailwind v4
- Bungie OAuth (Authorization Code flow)
- Cloudflare Workers via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare)
- Cloudflare D1 (`marathon-lfg-db`) for LFG persistence
- In-memory fallback in `next dev` so you don't need bindings to develop UI

## Setup

### 1. Bungie app config

Bungie OAuth requires HTTPS, even in dev. On <https://www.bungie.net/en/Application>,
edit app **52137**:

- **Redirect URL** → `https://localhost:3000/api/auth/callback`
- **Scope** → enable *"Access items like your Bungie.net notifications,
  memberships, and recent Bungie.Net forum activity."* This is the
  `ReadUserData` scope; required for `/Social/Friends/` (so we can render
  the user's contact registry on `/runner/friends`). Note: programmatic
  friend-add is *not* available — Bungie reserves `BnetWrite` for first-party
  apps. The site instead deep-links to each Runner's bungie.net profile so
  the user adds them with one click on bungie.net itself.

### 2. Local env

`.env.local` is already populated with your API key + client_id. If your app
is registered as **Confidential**, drop the secret into `BUNGIE_CLIENT_SECRET`.
If **Public**, leave blank.

### 3. Trust the local HTTPS cert (one-time)

```bash
brew install mkcert
mkcert -install              # prompts for sudo
```

### 4. Run

```bash
npm install
npm run dev                  # https://localhost:3000
```

In dev, the LFG store falls back to in-memory (lost on restart) — fine for
iterating on UI. To exercise D1 locally instead, run:

```bash
npm run db:migrate:local     # apply schema to local miniflare D1
npm run preview              # OpenNext local preview with bindings
```

## Routes

| Path                    | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `/`                     | Landing page with the OAuth CTA                        |
| `/runner`               | Authenticated profile screen                           |
| `/runner/friends`       | Bungie.net contact registry                            |
| `/lfg`                  | Drop manifest — open + recently initiated runs         |
| `/lfg/new`              | Host a new run                                         |
| `/lfg/[id]`             | Run detail — join/leave/initiate/kick/terminate        |
| `/api/auth/login`       | Generates state, redirects to Bungie's authorize URL   |
| `/api/auth/callback`    | Validates state, exchanges code, caches identity       |
| `/api/auth/logout`      | Clears the session cookies                             |
| `/account/delete`       | Confirmation page for full data wipe (typed-confirm)   |
| `/legal/privacy`        | Privacy policy (public, static)                        |
| `/legal/terms`          | Terms of service (public, static)                      |
| `/api/admin/purge-stale`| POST, Bearer-auth — drops contracts older than `?ageHours=N` (default 24). Called by the scheduled cleanup workflow. |

## LFG flow

1. Host opens a new contract (`/lfg/new`) — picks DUO (+1) or TRIO (+2),
   title, optional briefing.
2. The contract appears on the `/lfg` board for every signed-in Runner.
   Guests click **REQUEST SLOT** — they're added immediately as `PENDING`.
3. Host can **EJECT** any guest while the contract is `OPEN`.
4. Host clicks **CALL INFIL — LOCK CREW**. The contract flips to
   `INITIATED`, all guests flip to `CONFIRMED`, and the detail page
   surfaces an **ADD ON BUNGIE.NET ↗** button next to every Runner. Each
   button opens that Runner's bungie.net profile in a new tab; the host
   (and each guest) click "Add Friend" once per Runner.
5. Once friend requests are accepted, everyone launches Marathon and
   invites the crew to a fireteam in-game.
6. **SCRUB CONTRACT** deletes the contract; guests can **DROP SLOT** to
   leave on their own.

> **Why manual friend-add?** Bungie's `POST /Social/Friends/Add` requires
> the `BnetWrite` OAuth scope, which Bungie's own OpenAPI spec describes as
> *"reserved for Bungie.net elevated scope: not meant to be used by third
> party applications."* Self-serve apps can read friend lists but can't
> create friendships. The deep-link approach is the cleanest honest path.

## Cloudflare deployment

Database is already provisioned: D1 `marathon-lfg-db`
(`cb4733fb-b9a9-4bb5-9a1e-fd9dfd6ae512`), schema applied.

### One-time bootstrap

```bash
# First manual deploy so the Worker exists and you learn its URL.
# (After this, GitHub Actions will handle every subsequent deploy
# AND keep the Bungie secrets on the Worker in sync — see below.)
npm run deploy
```

After the first deploy, point a custom domain at the Worker (or use the
auto-assigned `*.workers.dev` URL), then update `BUNGIE_REDIRECT_URI` in
`wrangler.jsonc` to `https://<your-domain>/api/auth/callback` and add the
same URL to the Bungie app's Redirect URL list. Push or redeploy.

This project's production URL is **<https://runneruplink.net>** — bound
to the Worker via the `routes` block in `wrangler.jsonc`.

### Automated deploys (GitHub Actions)

`.github/workflows/deploy.yml` runs on every push and PR:

- **PRs** → runs `npm ci && npm run build` only (gate, no deploy).
- **Push to `main`** → builds, applies D1 migrations (idempotent),
  **syncs the Bungie secret onto the Worker** (`wrangler secret bulk`),
  then runs `opennextjs-cloudflare build && deploy`.

To wire it up, add three repo secrets at
*Settings → Secrets and variables → Actions*:

| Secret                  | Value                                                                |
| ----------------------- | -------------------------------------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID` | `bb7c4ae583bb8f22a5234189e32308ee`                                   |
| `CLOUDFLARE_API_TOKEN`  | A scoped token from <https://dash.cloudflare.com/profile/api-tokens> |
| `BUNGIE_API_KEY`        | The API key from the Bungie app whose `client_id` is in `wrangler.jsonc` |
| `CRON_SECRET`           | A long random string (`openssl rand -hex 32`). Synced to the Worker on deploy and used by the `/api/admin/purge-stale` endpoint. |

…and **one repository variable** at the same screen (Variables tab):

| Variable        | Value                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------- |
| `PROD_BASE_URL` | The site's public URL — `https://runneruplink.net` (no trailing slash). Used by the scheduled-purge workflow to know where to POST. |

The Cloudflare API token needs three permissions on **your account** only
(no zone scope required):

- *Account → Workers Scripts → Edit*
- *Account → D1 → Edit*
- *User → User Details → Read* (so `wrangler whoami` works)

GitHub Secrets are the canonical store — to rotate the Bungie key, update
the GH secret and push to `main`. CI overwrites the Worker secret to match.
For a Confidential OAuth client you'd add a `BUNGIE_CLIENT_SECRET` GH
secret and extend the `jq` payload in the workflow's "Sync Worker secrets"
step; this app uses a Public client so it's not needed.

If you want a manual run, the workflow has `workflow_dispatch` enabled — just
hit *Run workflow* on the Actions tab.

### Scheduled cleanup

`.github/workflows/purge-stale.yml` runs every 6 hours and POSTs to
`/api/admin/purge-stale`, dropping contracts older than 24h so the board
doesn't fill up with abandoned posts. Authenticated via the same
`CRON_SECRET` that's synced to the Worker. Trigger it manually from the
Actions tab with a custom `ageHours` if you need a one-off flush (range
1–168 hours).

### Observability

Errors and notable events are logged via `src/lib/log.ts` as one JSON
line per event. View them in the Cloudflare dashboard → Workers &
Pages → `marathon-lfg` → Logs (real-time tail) or under Logpush for
historical search. No third-party APM is configured — Workers Logs +
structured events cover real visibility for $0 at this scale.

### Migrations

The repo uses Wrangler's native migration runner. Each file in `migrations/`
is applied in order, and Wrangler records the applied set in a `d1_migrations`
table on the database itself, so re-runs are no-ops.

To add a new migration, drop a new SQL file in `migrations/` named with the
next sequential prefix (e.g. `0002_add_invites.sql`). The next deploy will
pick it up automatically.

```bash
npm run db:migrate:remote     # apply pending migrations to production D1
npm run db:migrate:local      # ditto for local Miniflare D1
npm run db:migrations:list    # see which migrations are pending vs applied
```

## Notes

- Sessions are httpOnly + secure cookies. No refresh-token handling yet — re-auth
  on Bungie token expiry (~1h).
- D1 access goes through `@opennextjs/cloudflare`'s `getCloudflareContext()`
  binding. When the binding isn't present (dev without preview), the LFG store
  uses an in-memory `Map` so the UI still works.
- Marathon and all related marks are © Bungie. This project is unaffiliated.
