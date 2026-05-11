# SportBets

SportBets is a local sports betting simulator for virtual-credit wagering. The current application is centered on horse racing: users can register, sign in, view race markets, place race-winner bets, manage a wallet, and use a development control room to generate, run, and settle simulated races.

This project is for simulation and learning only. It must not be used for real-money gambling.

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Zustand
- Axios
- Vitest

### Backend

- Node.js
- Express
- TypeScript
- PostgreSQL
- Drizzle ORM
- Socket.io
- JWT authentication
- Zod validation

## Quick Start

### Prerequisites

- Node.js 18 or newer
- npm
- PostgreSQL database available locally or through a hosted provider

### Install Dependencies

```bash
npm install
cd backend
npm install
cd ..
```

### Configure Environment

Create the frontend environment file at the repo root:

```bash
cp .env.example .env
```

Expected frontend value:

```env
VITE_API_URL=http://localhost:3001/api
```

Create the backend environment file:

```bash
cp backend/.env.example backend/.env
```

Expected backend values:

```env
DATABASE_URL=postgres://localhost:5432/sportbets
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
FRONTEND_URL=http://localhost:5173
```

### Prepare the Database

From `backend/`, push the Drizzle schema and seed sample data:

```bash
cd backend
npm run db:push
npm run seed
cd ..
```

The seed creates a sample horse-racing event and this test user:

```text
Email: test@example.com
Password: password123
```

### Run the App

Run frontend and backend together:

```bash
npm run dev:all
```

Or run them separately:

```bash
cd backend
npm run dev
```

```bash
npm run dev
```

Open the frontend at `http://localhost:5173`. The backend listens on `http://localhost:3001`.

Windows and Unix helper scripts are also available:

- `dev.bat`
- `./dev.sh`

## Commands

### Root

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite frontend dev server |
| `npm run dev:all` | Start frontend and backend together |
| `npm run build` | Type-check and build the frontend |
| `npm run lint` | Run ESLint |
| `npm run test` | Run the Vitest test suite |
| `npm run preview` | Preview the production frontend build |

### Backend

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Express API with nodemon and ts-node |
| `npm run build` | Compile backend TypeScript |
| `npm run start` | Run the compiled backend |
| `npm run test` | Run backend scheduler logic tests through Vitest |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run Drizzle migrations |
| `npm run db:push` | Push schema changes directly to the database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run seed` | Seed sample sports, race, odds, user, and wallet data |

## Application Routes

| Route | Purpose |
| --- | --- |
| `/login` | Sign in or register |
| `/` | Dashboard with race highlights and upcoming markets |
| `/events/:eventId` | Race detail, runners, odds, and bet placement |
| `/live` | Live race listing |
| `/upcoming` | Upcoming race listing |
| `/dev/race-control` | Development control room for generating, betting, running, and settling races |
| `/bets` | User bet history |
| `/wallet` | Wallet balance and transactions |
| `/settings` | User settings |

All routes except `/login` require authentication.

## API Overview

The backend exposes REST endpoints under `/api` plus a `/health` check.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Sports and events | `GET /api/sports`, `GET /api/events`, `GET /api/events/:eventId` |
| Markets and odds | `GET /api/events/:eventId/markets`, `GET /api/events/:eventId/odds`, `GET /api/events/:eventId/runners` |
| Bets | `POST /api/bets`, `GET /api/bets`, `GET /api/bets/:betId` |
| Wallet | `GET /api/wallet`, `GET /api/wallet/transactions` |
| Admin | `/api/admin/*` |
| Development tools | `/api/dev/*`, disabled when `NODE_ENV=production` |

Socket.io is initialized by the backend for real-time updates.

## Development Race Workflow

Use `/dev/race-control` when testing the complete betting loop locally:

1. Deposit virtual credits into the signed-in user's wallet.
2. Generate a race.
3. Select race-winner odds and place a test bet.
4. Run the 30-second simulation or instantly settle the race.
5. Review settlement in the race page, bet history, wallet balance, and transaction history.

The supporting development API includes:

- `POST /api/dev/wallet/deposit`
- `POST /api/dev/races/generate`
- `GET /api/dev/races/:eventId/runners`
- `POST /api/dev/races/:eventId/run`
- `POST /api/dev/races/:eventId/settle`
- `GET /api/dev/races/:eventId/simulation`

## Project Structure

```text
SportBets/
  src/                         React frontend
    components/                Shared UI and shell components
    pages/                     Route-level pages and page logic helpers
    services/                  API client
    store/                     Zustand state
    styles/                    Design-system CSS
    types/                     Shared frontend types
  backend/
    src/
      db/                      Drizzle schema and database client
      routes/                  Express route modules
      services/                Domain and simulation logic
      sockets/                 Socket.io setup
      seed.ts                  Sample data seeding
  docs/                        Requirements and implementation notes
  tests/                       Vitest logic tests
```

## Testing

Run the frontend and shared logic tests from the repo root:

```bash
npm run test
```

Run the backend scheduler test entry from `backend/`:

```bash
cd backend
npm run test
```

Current tests cover race scheduler logic, live race control helpers, and upcoming page logic.

## Notes

- Wallets use virtual `CREDITS`; no payment provider is integrated.
- Dev routes are intended for local testing and are blocked when `NODE_ENV=production`.
- `DATABASE_URL` must point to a PostgreSQL database before running migrations, seeding, or the backend.
- Requirements and implementation notes live in `docs/`.

## License

ISC
