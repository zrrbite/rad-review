# rad-review

A math practice app for a 7th grader at a Danish folkeskole. It finds the
skills she's weak in, drills them, brings solid ones back for review, and has
a Claude tutor explain wrong answers in Danish. A parent page shows progress
and every tutor conversation.

- Design: [`docs/superpowers/specs/2026-10-13-math-review-design.md`](docs/superpowers/specs/2026-10-13-math-review-design.md)
- Plan: [`docs/superpowers/plans/2026-10-13-math-review.md`](docs/superpowers/plans/2026-10-13-math-review.md)
- Example problems, for proofreading: [`docs/examples.md`](docs/examples.md)

## Running it locally

Needs Node 24 or newer.

```bash
npm install
cp .env.example .env    # then set the two passwords and SESSION_SECRET (openssl rand -hex 32)
npm run dev             # http://localhost:5173
```

Without `ANTHROPIC_API_KEY`, "Hvorfor?" shows the worked solution. Set
`TUTOR_FAKE=1` to get a canned tutor reply instead.

## Checks

```bash
npm test            # unit tests, including 500 seeded problems per skill and level
npm run check       # types
npm run test:e2e    # browser smoke test against the production build (fake tutor)
```

## Scripts

| Command | What it does |
|---|---|
| `npm run examples` | Writes `docs/examples.md`: three problems per skill and level. |
| `npm run tutor-eval` | Sends twelve typical mistakes to the real tutor and prints the replies. Costs a few cents; needs `ANTHROPIC_API_KEY`. |
| `npm run rebuild-state` | Recomputes every skill's state from the stored answers after a rule change in `src/lib/adaptive/state.ts`. |

## Deploying to Fly.io

One-time setup:

```bash
brew install flyctl
fly auth login
fly apps create rad-review          # pick another name if taken; then update fly.toml (app, ORIGIN)
fly volumes create data --region arn --size 1
fly secrets set STUDENT_PASSWORD='…' PARENT_PASSWORD='…' \
  SESSION_SECRET="$(openssl rand -hex 32)" ANTHROPIC_API_KEY='sk-ant-…'
```

Also set a monthly spend limit for the key in the Anthropic console, as a
second safety net next to the app's own cap (`TUTOR_MONTHLY_CAP_USD`, default
$10).

Each deploy:

```bash
fly deploy
```

Optional settings, also via `fly secrets set`:
- `TUTOR_MODEL` (default `claude-sonnet-5-5`)
- `TUTOR_MONTHLY_CAP_USD` (default 10)
- `TUTOR_PRICE_INPUT_PER_MTOK`, `TUTOR_PRICE_OUTPUT_PER_MTOK`, used for the cost shown on the parent page (defaults 2 and 10)

## Backups and data

Everything lives in one SQLite file on the Fly volume. Fly snapshots the volume
daily and keeps the snapshots for 5 days (`fly volumes snapshots list`). To take
a copy yourself:

```bash
fly ssh sftp get /data/rad-review.db ./rad-review-backup.db
```

To rebuild all skill states after changing the rules, run `npm run rebuild-state`
locally with `DATABASE_PATH` pointing at a downloaded copy, and put it back with
`fly ssh sftp shell` (`put`) while the app is stopped.
