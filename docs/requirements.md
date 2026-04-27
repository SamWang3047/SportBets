# SportBets Requirements Documentation

## 1. Project Overview

SportBets is a sports betting website simulator. Users can place bets using virtual credits, watch real-time odds, follow simulated sports events, and receive automatic settlement after each event finishes.

This project is designed for simulation and learning purposes only. It should not process real-money gambling transactions.

## 2. Core Requirements

### 2.1 Sports Coverage

The platform must support two sports:

- Horse racing
- Football

Each sport should have its own event data, participant data, simulation logic, odds logic, and result settlement rules.

### 2.2 User Betting

Users must be able to:

- Register and log in.
- View available sports events.
- View betting markets and live odds.
- Place bets with virtual balance.
- Track active bets.
- View settled bets and betting history.
- See wallet balance changes after bets are placed and settled.

### 2.3 Real-Time Odds

The platform must display odds that update during simulated events.

Odds should change based on:

- Event progress.
- Current score or race position.
- Participant/team strength.
- Time remaining.
- Random simulation factors.

Real-time updates should be delivered through WebSockets, preferably using Socket.io.

### 2.4 Simulated Events

The platform must simulate sports events from start to finish.

For football:

- Simulate match time minute by minute.
- Track score, match status, and major match events.
- Support basic events such as goals, shots, yellow cards, and red cards.
- End the match after full time.

For horse racing:

- Simulate race progress second by second.
- Track each horse's position and distance covered.
- Update race ranking during the race.
- End the race when all required finishers are determined.

### 2.5 Bet Settlement

After an event finishes, the system must:

- Determine the final result.
- Check all unsettled bets for the event.
- Mark each bet as won or lost.
- Credit winnings to user wallets.
- Store transaction records.
- Notify users in real time when bets are settled.

## 3. Recommended System Architecture

### 3.1 Frontend

Recommended stack:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Zustand
- Axios
- Zod

Suggested frontend structure:

```text
src/
  pages/
    HomePage.tsx
    LoginPage.tsx
    MarketsPage.tsx
    MatchDetailPage.tsx
    BetHistoryPage.tsx
    AdminPage.tsx
  components/
    OddsBoard.tsx
    BetSlip.tsx
    LiveMatchTimeline.tsx
    WalletSummary.tsx
  services/
    api.ts
    socket.ts
  store/
    authStore.ts
    betSlipStore.ts
  types/
    betting.ts
    sports.ts
```

### 3.2 Backend

Recommended stack:

- Node.js
- Express
- TypeScript
- Socket.io
- PostgreSQL
- Prisma or Drizzle ORM
- JWT authentication
- Zod validation

Suggested backend structure:

```text
backend/src/
  app.ts
  server.ts
  routes/
    auth.routes.ts
    sports.routes.ts
    events.routes.ts
    odds.routes.ts
    bets.routes.ts
    wallet.routes.ts
  services/
    odds.service.ts
    settlement.service.ts
    simulation.service.ts
    wallet.service.ts
  db/
    schema.ts
  sockets/
    odds.socket.ts
```

## 4. Main Domain Models

### 4.1 User

Represents a platform user.

Key fields:

- `id`
- `email`
- `password_hash`
- `display_name`
- `role`
- `created_at`
- `updated_at`

### 4.2 Wallet

Stores the user's virtual balance.

Key fields:

- `id`
- `user_id`
- `balance`
- `currency`
- `created_at`
- `updated_at`

Recommended virtual currency:

- `CREDITS`

### 4.3 Sport

Represents supported sports.

Key fields:

- `id`
- `code`
- `name`

Example values:

- `football`
- `horse_racing`

### 4.4 Event

Represents a football match or horse race.

Key fields:

- `id`
- `sport_id`
- `name`
- `status`
- `start_time`
- `end_time`
- `simulation_state`
- `created_at`
- `updated_at`

Possible statuses:

- `scheduled`
- `live`
- `finished`
- `cancelled`

### 4.5 Market

Represents a betting market for an event.

Examples:

- Football match winner
- Football total goals
- Horse race winner
- Horse race top three

Key fields:

- `id`
- `event_id`
- `market_type`
- `name`
- `status`

### 4.6 Odds

Stores odds for a market selection.

Key fields:

- `id`
- `market_id`
- `selection_id`
- `selection_name`
- `decimal_odds`
- `is_active`
- `created_at`

The platform should store odds snapshots so each placed bet keeps the exact odds available at placement time.

### 4.7 Bet

Represents a user bet.

Key fields:

- `id`
- `user_id`
- `event_id`
- `market_id`
- `selection_id`
- `stake`
- `odds_at_placement`
- `potential_payout`
- `status`
- `placed_at`
- `settled_at`

Possible statuses:

- `pending`
- `won`
- `lost`
- `void`

### 4.8 Transaction

Represents wallet balance changes.

Key fields:

- `id`
- `wallet_id`
- `type`
- `amount`
- `balance_after`
- `reference_id`
- `created_at`

Possible transaction types:

- `deposit`
- `bet_stake`
- `bet_payout`
- `bet_refund`

## 5. Football Data Requirements

### 5.1 Football Team

Key fields:

- `id`
- `name`
- `short_name`
- `country`
- `attack_rating`
- `midfield_rating`
- `defense_rating`
- `form_rating`

### 5.2 Football Player

Key fields:

- `id`
- `team_id`
- `name`
- `position`
- `age`
- `overall_rating`
- `pace`
- `shooting`
- `passing`
- `defending`
- `stamina`

### 5.3 Football Match Simulation

The simulation should consider:

- Team attack rating.
- Team defense rating.
- Team form rating.
- Match time.
- Current score.
- Random match events.

Minimum supported market for MVP:

- Home win
- Draw
- Away win

## 6. Horse Racing Data Requirements

### 6.1 Horse

Key fields:

- `id`
- `name`
- `age`
- `speed`
- `stamina`
- `acceleration`
- `consistency`
- `preferred_distance`

### 6.2 Jockey

Key fields:

- `id`
- `name`
- `experience`
- `skill_rating`
- `aggression`

### 6.3 Race Runner

Links horses and jockeys to a specific race.

Key fields:

- `id`
- `race_id`
- `horse_id`
- `jockey_id`
- `stall_number`
- `starting_odds`
- `final_position`

### 6.4 Horse Race Simulation

The simulation should consider:

- Horse speed.
- Horse stamina.
- Horse acceleration.
- Horse consistency.
- Jockey skill.
- Race distance.
- Random race variation.

Minimum supported market for MVP:

- Race winner

## 7. API Requirements

### 7.1 Authentication

Required endpoints:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### 7.2 Sports and Events

Required endpoints:

```text
GET /api/sports
GET /api/events
GET /api/events/:eventId
GET /api/events/:eventId/markets
```

### 7.3 Odds

Required endpoints:

```text
GET /api/events/:eventId/odds
```

### 7.4 Bets

Required endpoints:

```text
POST /api/bets
GET  /api/bets
GET  /api/bets/:betId
```

### 7.5 Wallet

Required endpoints:

```text
GET /api/wallet
GET /api/wallet/transactions
```

### 7.6 Admin and Simulation

Recommended admin endpoints:

```text
POST /api/admin/events
POST /api/admin/events/:eventId/start
POST /api/admin/events/:eventId/settle
POST /api/admin/seed
```

## 8. WebSocket Requirements

The backend should broadcast live updates through Socket.io.

Recommended events:

```text
event:update
odds:update
bet:placed
bet:settled
wallet:update
```

### 8.1 event:update

Used to update match or race progress.

Example payload:

```json
{
  "eventId": "event_123",
  "status": "live",
  "timeElapsed": 42,
  "score": {
    "home": 1,
    "away": 0
  }
}
```

### 8.2 odds:update

Used to update odds for an event.

Example payload:

```json
{
  "eventId": "event_123",
  "marketId": "market_123",
  "odds": [
    {
      "selectionId": "home",
      "selectionName": "Home Win",
      "decimalOdds": 1.85
    },
    {
      "selectionId": "draw",
      "selectionName": "Draw",
      "decimalOdds": 3.4
    },
    {
      "selectionId": "away",
      "selectionName": "Away Win",
      "decimalOdds": 4.2
    }
  ]
}
```

## 9. Betting Rules

### 9.1 Placing a Bet

When a user places a bet, the system must:

1. Validate the user is authenticated.
2. Validate the event and market are open.
3. Validate the selected odds are active.
4. Validate the user has enough wallet balance.
5. Deduct the stake from the wallet.
6. Store the bet with the odds at placement time.
7. Store a wallet transaction.

### 9.2 Payout Formula

For decimal odds:

```text
payout = stake * decimal_odds
profit = payout - stake
```

Example:

```text
stake = 100
odds = 2.50
payout = 250
profit = 150
```

### 9.3 Settlement

When an event finishes:

- Winning bets receive payout.
- Losing bets receive no payout.
- Void bets receive stake refund.
- All settlement changes must be recorded in transactions.

## 10. MVP Scope

The first version should include:

- User registration and login.
- Virtual wallet balance.
- Seeded football teams, football players, horses, and jockeys.
- Event list page.
- Event detail page.
- Live odds display.
- Bet slip.
- Bet placement.
- Basic football simulation.
- Basic horse racing simulation.
- Automatic bet settlement.
- Bet history page.

## 11. Future Enhancements

Possible later features:

- Admin dashboard.
- More football markets.
- More horse racing markets.
- Parlay or accumulator bets.
- Leaderboard.
- User analytics.
- More advanced odds engine.
- Richer event timeline.
- Replay simulation.
- Responsible gaming notices, even though this is virtual-only.

## 12. Development Roadmap

Recommended implementation order:

1. Set up PostgreSQL and ORM.
2. Create database schema.
3. Add seed data for users, wallets, football, and horse racing.
4. Implement authentication.
5. Implement events and markets APIs.
6. Implement odds APIs.
7. Implement wallet and bet placement.
8. Implement simulation services.
9. Implement settlement service.
10. Add Socket.io live updates.
11. Build frontend pages.
12. Add admin tools.
13. Add tests for betting, wallet, and settlement logic.

## 13. Technical Notes From Current Project

The current project already has a useful foundation:

- React + TypeScript frontend exists.
- Express + TypeScript backend exists.
- Socket.io is installed in the backend.
- React Query, Zustand, Axios, Zod, and React Hook Form are installed in the frontend.

Important gaps:

- No database ORM is installed yet.
- No database schema exists yet.
- The backend currently only has a health check route.
- The frontend currently only has a placeholder page.
- README mentions folders that have not been created yet.
- README mentions React 18, but the project uses React 19.

