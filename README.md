# SportBets - Sports Betting Web Application

A modern sports betting platform built with React, TypeScript, Node.js, and Express.

## Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing
- **Zustand** - State management
- **Axios** - HTTP client

### Backend
- **Node.js + Express** - REST API
- **TypeScript** - Type safety
- **Socket.io** - Real-time updates
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Zod** - Schema validation

## Project Structure

```
SportBets/
├── src/                      # React frontend
│   ├── pages/               # Page components
│   ├── services/            # API services
│   ├── store/               # Zustand store
│   └── types/               # TypeScript types
├── backend/                 # Express backend
│   ├── src/
│   │   ├── db/             # Database schema
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── sockets/        # WebSocket
│   │   └── seed.ts         # Database seed
│   └── drizzle.config.ts   # Drizzle config
└── docs/                    # Documentation
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Install frontend dependencies**
   ```bash
   npm install
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

3. **Configure environment variables**

   Frontend (`.env`):
   ```
   VITE_API_URL=http://localhost:3001
   ```

   Backend (`backend/.env`):
   ```
   PORT=3001
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   DATABASE_URL=postgresql://user:password@localhost:5432/sportbets
   ```

### Running the Application

**Option 1: Run both together (recommended)**

```bash
npm run dev:all
```

**Option 2: Run separately**

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend development server** (in a new terminal)
   ```bash
   npm run dev
   ```

**Option 3: Use scripts**

- Windows: `dev.bat`
- Linux/Mac: `./dev.sh`

3. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

### Frontend (root)
- `npm run dev` - Start Vite dev server
- `npm run dev:all` - Start both frontend and backend
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Backend
- `npm run dev` - Start Express dev server
- `npm run build` - Build TypeScript
- `npm run start` - Start production server
- `npm run seed` - Seed database with sample data
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Drizzle Studio

## Features

- [x] User authentication and authorization
- [x] Real-time odds updates via WebSockets
- [x] Place and track bets
- [x] User wallet/balance management
- [x] Bet history and analytics
- [ ] Admin panel for odds management
- [x] Responsive design

## Development Roadmap

1. **Phase 1: Core Features**
   - User authentication
   - Basic betting functionality
   - Odds display

2. **Phase 2: Advanced Features**
   - Real-time odds updates
   - Bet history
   - User wallet

3. **Phase 3: Admin Features**
   - Admin panel
   - Odds management
   - User management

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License.
