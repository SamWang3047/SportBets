# Implementation Plan: Horse Racing Dev Simulator

## Overview
Add a development-only horse racing simulator to SportBets. It should randomly generate a horse race, horses, jockeys, race runners, a `race_winner` market, and basic odds. After a user places a bet, the race can be instantly skipped and settled, or later run through a short demo simulation under 30 seconds.

## Architecture Decisions
- **No new database tables for MVP**: existing `events`, `horses`, `jockeys`, `raceRunners`, `markets`, `odds`, `bets`, and `wallets` are enough.
- **Add dev-only API routes**: use something like `backend/src/routes/dev.routes.ts`, enabled only outside production.
- **Keep business logic in a service**: add `backend/src/services/devRace.service.ts`.
- **Build instant settlement first**: prove the betting and wallet loop before adding timed simulation.

## Task List

### Task 1: Dev Race Generator Service
Create a service that generates one scheduled horse racing event with 6 horses, 6 jockeys, 6 race runners, one `race_winner` market, and odds for each horse.

Acceptance criteria:
- Generates a `horse_racing` event with status `scheduled`
- Generates horse and jockey attributes
- Creates race runners with stall numbers
- Creates market and odds using `horse.id.toString()` as `selectionId`

Verification:
- Generated race appears in `GET /api/events`
- `GET /api/events/:eventId/markets` returns runner odds

Files likely touched:
- `backend/src/services/devRace.service.ts`

---

### Task 2: Dev API Routes
Add API endpoints for creating demo races.

Acceptance criteria:
- `POST /api/dev/races/generate` creates a demo race
- Response includes `eventId`, `marketId`, runners, and odds
- Route is blocked in production

Verification:
- `curl` can generate a race locally
- Generated event can be opened in the frontend

Files likely touched:
- `backend/src/routes/dev.routes.ts`
- `backend/src/index.ts`

---

### Task 3: Instant Race Settlement
Add a dev endpoint that instantly resolves a race and settles all pending bets.

Acceptance criteria:
- `POST /api/dev/races/:eventId/settle` finishes the race
- Generates final ranking
- Writes `finalPosition` to `raceRunners`
- Sets event status to `finished`
- Settles pending bets as `won` or `lost`
- Winning bets pay out to wallet

Verification:
- Place a bet, call settle, then check:
  - `GET /api/bets`
  - `GET /api/wallet`
  - `GET /api/wallet/transactions`

Files likely touched:
- `backend/src/services/devRace.service.ts`
- `backend/src/routes/dev.routes.ts`

---

### Checkpoint 1: Backend Closed Loop
- Generate race
- Place bet
- Instantly settle race
- Confirm bet status changes
- Confirm wallet balance updates

---

### Task 4: Frontend Dev Controls
Add simple frontend controls for development testing.

Acceptance criteria:
- Button to generate demo race
- Button or link to open generated race
- Button to skip and settle race
- After settlement, user can see updated bets and wallet

Verification:
- Browser flow works:
  - Generate race
  - Open event
  - Place bet
  - Skip and settle
  - Check bets/wallet

Files likely touched:
- `src/services/api.ts`
- `src/pages/HomePage.tsx` or a new dev page
- `src/pages/EventDetailPage.tsx`

---

### Task 5: 30-Second Demo Run
Add an optional short simulation mode.

Acceptance criteria:
- `POST /api/dev/races/:eventId/run` starts a short race
- Race moves from `scheduled` to `live` to `finished`
- `simulationState` includes progress, ranking, timeline, winner
- Race settles automatically within 30 seconds
- Duplicate runs/settlements are prevented

Verification:
- Call run endpoint
- Observe event state changes
- Confirm bets settle automatically

Files likely touched:
- `backend/src/services/devRace.service.ts`
- `backend/src/routes/dev.routes.ts`

## Risks
- Duplicate settlement could pay users twice: guard by only settling `pending` bets and refusing already finished events.
- `selectionId` mismatch could break settlement: always use `horse.id.toString()`.
- Existing backend TypeScript build has config/lint issues: may need a small backend build cleanup before verification.
- Dev routes must not be available in production.

## Recommended Order
1. Task 1
2. Task 2
3. Task 3
4. Backend closed-loop verification
5. Task 4
6. Task 5 as enhancement

The best first milestone is Tasks 1-3: generate race, place bet, instantly settle.