# RUNNER//NET — Roadmap

A living list of "what would meaningfully improve the product" with honest
size and impact estimates. Curated, not exhaustive — features are pruned
when they stop being good ideas.

## Done (the MVP)

- ✅ Bungie OAuth + identity caching
- ✅ Friend-list view (`/runner/friends`)
- ✅ LFG board with crew formation (DUO / TRIO), pending → confirmed
- ✅ Manual friend handoff via bungie.net deep links
- ✅ Cloudflare Workers + D1 deployment via OpenNext
- ✅ GitHub Actions CI/CD with secret sync to Worker
- ✅ Privacy policy, terms of service, delete-my-data
- ✅ Marathon-themed UI (HUD aesthetic, lore-correct vocab)

## Done in the ship-now sprint

- ✅ **Auto-purge stale contracts** — scheduled GH Action hits the
  `/api/admin/purge-stale` endpoint every 6 hours, drops contracts older
  than 24h. Configurable via `?ageHours=N` for one-off cleanup.
- ✅ **Live updates on the contract detail page** — `<AutoRefresh>`
  client component polls `router.refresh()` every 5s while the tab is
  visible. Disabled once status is `INITIATED` (no point polling a final
  state). Same component on `/lfg` for the board (10s interval).
- ✅ **OG / social share cards** — `generateMetadata` on `/lfg/[id]`
  produces a clean preview ("Trio infil · 2/3 Runners · OPEN — Dire
  Marsh sweep") for Discord/Twitter shares. Marked `noindex` since
  individual contracts are ephemeral.
- ✅ **Board filtering** — `?size=duo|trio` and `?show=open|all` query
  params with a sticky filter bar. Empty states adapt to the filter.
- ✅ **Structured logging** — `logInfo` / `logWarn` / `logError` helpers
  in `src/lib/log.ts` emit one JSON line per event into Workers Logs
  (free, 7-day retention, real-time tail in CF dashboard). Wired into
  OAuth callback first; spread to other critical paths as we touch them.

## Considered tier — high value, more effort

> If the site gets even 50 weekly users, do these next.

### 1. Browser push notifications
Guests close the tab, miss when the host calls infil, the run dies.
Push fixes that.

- **Effort:** ~half a day. PWA service worker, push subscription
  endpoint, Web Push protocol.
- **Cloudflare-friendly:** D1 stores subscriptions; Workers can
  send pushes via `web-push` library directly. No external dependency.
- **Risk:** browser permission UX is friction; ~30% of users grant push
  on first ask. Make the prompt contextual ("notify me when host calls
  infil") not blanket.

### 2. Discord webhook integration
Per-server channel that auto-announces new contracts. Often a *better*
fit than push for an LFG use case because Discord is where Marathon
crews already organize.

- **Effort:** half a day. New `webhooks` table in D1, settings UI on
  `/runner` to add/remove webhook URLs, helper that POSTs to webhook on
  contract create.
- **Risk:** moderation. Bad-actor host could abuse webhooks for spam.
  Rate-limit per-host (e.g., max 3 webhook fires per hour).

### 3. Read-only board for unauthenticated visitors
Right now a curious user has to OAuth before seeing anything. Letting
them browse (with names redacted to bungie.net handle initial only)
before sign-in lifts conversion.

- **Effort:** small. Make `/lfg` and `/lfg/[id]` accessible without
  session; gate write actions only.
- **Risk:** if you want to keep the site gated to verified Runners
  for trust, skip this. Trade-off between growth and moderation.

### 4. Block list
"I don't want this Runner ever joining my contracts again." Prevents
the bad-actor problem from going viral.

- **Effort:** ~half a day. New `blocks` table (blocker_id,
  blocked_id, created_at), check on `joinLfgAction` against blocks
  for the host, button on member rows + on `/runner/friends`.
- **Risk:** none, low blast radius. Safer than reputation/ratings as
  a first moderation primitive.

### 5. Saved crews
Mark certain Runners as your "go-to crew" so you can quickly recreate
contracts with them. Bonus: notify saved crew when you post.

- **Effort:** ~half a day. New `saved_crews` table, list/add/remove on
  `/runner`, optional pre-fill of guests on `/lfg/new`.
- **Risk:** none.

### 6. Per-region / timezone filter
Marathon has matchmaking regions; LFG should respect that. Add a
`region` field on contracts (defaulted to user's timezone-inferred
region), filter on the board.

- **Effort:** ~2 hours. New column, dropdown on `/lfg/new`, query
  param on `/lfg`.
- **Risk:** none.

### 7. Reputation / "good crew" tag
After a contract initiates, both host and guests can mark each other
"good crew." Aggregate count visible on profile.

- **Effort:** ~1 day. New `endorsements` table, post-initiate UI prompt,
  display on member rows.
- **Risk:** ratings inflation. Mitigate by capping endorsements per
  contract (one per pair) and not showing a numeric score until
  threshold met.

### 8. Dynamic OG images via @vercel/og or Next ImageResponse
The text-based OG cards from the ship-now sprint are fine, but
generating actual visual cards (with Marathon HUD aesthetic) makes
shared links way more clickable.

- **Effort:** ~2 hours. Add a route that returns an `ImageResponse`
  with the contract title, status, crew composition styled in the
  RUNNER//NET design language; wire up in `generateMetadata`.
- **Risk:** OpenNext + edge-runtime image generation has historically
  been fiddly. Test on the Worker, not just `next dev`.

### 9. Sitemap + indexable landing
The landing page should be indexable by Google so "Marathon LFG"
searches surface us. Generate `sitemap.xml` automatically.

- **Effort:** ~1 hour with Next 16's `app/sitemap.ts` API.
- **Risk:** none.

## Skip tier — resist these until proven need

> Each of these sounds like a good idea but isn't. Documented so we
> remember why.

### In-app chat
**Why skip:** Discord exists and every Marathon player is already on
some Marathon Discord. Building chat means moderation, message
storage, real-time infrastructure, mobile keyboard UX, file uploads,
abuse reporting — and we'd lose to Discord on every dimension.
**When to revisit:** never, probably. Maybe a per-contract one-shot
"leave a note for your future crew" text field, but that's a comment
box, not chat.

### Numeric rating system (1-5 stars / ELO)
**Why skip:** ratings inflation, abuse, smurf accounts gaming the
score, "perfect 5" pressure. The block list (Considered #4) handles
the actual problem ("I don't want to play with this person again")
without the social-engineering surface area.
**When to revisit:** if block list isn't enough and we see the same
toxic Runners cycling through.

### Multi-game support (Destiny, Tarkov, Marathon)
**Why skip:** focus is the moat. The instant we support multiple games,
we're competing with DestinyTracker, Tarkov.dev, etc. — established
sites with way more capital. Marathon-only means we can build features
nobody else can match.
**When to revisit:** never. If we want to expand, fork the codebase for
a sibling product.

### Analytics dashboards (PostHog / Mixpanel / our own)
**Why skip:** premature at this scale. Workers Analytics + the
structured logs from `lib/log.ts` cover real visibility for $0. Adding
an analytics vendor adds a cookie banner, latency, and a privacy
policy update for ~zero actionable insight at hobby-scale traffic.
**When to revisit:** when DAU > 100 and we're making product decisions
we can't reason about from logs alone.

### Custom emoji / theme picker / vanity profile fields
**Why skip:** scope creep. We're an LFG board. Surface area belongs to
"find a crew, get on bungie.net, play Marathon" — not personalization.

### Mobile native app
**Why skip:** the web app already works on mobile. A native app means
two codebases, App Store review cycles, push-notification certificate
juggling, and zero advantage over the existing PWA-able web app.
**When to revisit:** when push-notification UX (Considered #1) hits
real limits on iOS Safari. Possibly never.

### Full game-state sync (currently online, in-match, etc.)
**Why skip:** Bungie API may eventually expose rich Marathon presence
(it does for Destiny via `currentActivityHash`), but the design
question — "show me Runners currently on Tau Ceti so I can pick one
to friend" — is solved by the existing friend-list view + bungie.net's
own online indicator. We don't need to mirror it.
**When to revisit:** if Bungie ships a public "looking for fireteam"
flag in the Marathon API, integrate that instead of building our own.

## Ops / non-feature backlog

> The boring stuff that prevents 2am pages.

- **Status page** — even a static `status.runner.network` with manual
  updates is enough at this scale.
- **Backup script** — D1 has automatic backups on paid tier. Free tier
  needs `wrangler d1 export` on a schedule.
- **Staging environment** — second Worker (`marathon-lfg-staging`) +
  D1 (`marathon-lfg-db-staging`) so we can test schema changes before
  prod.
- **Rate limiting** — Cloudflare's built-in rate-limiting rules can
  cap abusive IPs without code changes. Worth setting up before launch.
- **Sentry** — if Workers Logs ever stop being enough; the
  `@sentry/cloudflare` SDK + a small worker-entrypoint wrap is the
  upgrade path.

## How to use this doc

When picking what to work on:

1. Anything in **Done** is shipped — link to the PR/commit if relevant.
2. Anything in **Considered** is on-deck. Pick whichever has the
   highest value-to-effort right now and move it to "Done in [sprint]".
3. Anything in **Skip** stays skipped unless something changes about
   the product or audience that invalidates the reasoning. If you
   move something out of Skip, write down what changed.
4. **Ops** items don't compete for product time — pull them in
   alongside feature work when relevant.

> The single most important non-feature thing remains: **get a real
> Marathon player using the site for a real run.** A 30-minute session
> reveals more than a month of speculation. Watch them sign in, post,
> get joined, hit "Call Infil," try to add a friend on bungie.net.
> Where they get stuck is the next sprint, not anything written here.
