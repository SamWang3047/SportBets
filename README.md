# SportBets - Sports Betting Web Application

A modern sports betting platform built with React, TypeScript, Node.js, and Express.

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing
- **Zustand** - State management
- **TanStack Query** - Data fetching and caching
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### Backend
- **Node.js + Express** - REST API
- **TypeScript** - Type safety
- **Socket.io** - Real-time odds updates
- **JWT** - Authentication
- **Zod** - API validation

## Project Structure

```
SportBets/
├── src/                      # React frontend
│   ├── components/          # Reusable components
│   ├── pages/               # Page components
│   ├── hooks/               # Custom hooks
│   ├── store/               # Zustand store
│   ├── services/            # API services
│   └── types/               # TypeScript types
├── backend/                 # Express backend
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   ├── utils/           # Utility functions
│   │   └── types/           # TypeScript types
│   └── package.json
└── package.json
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

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend development server** (in a new terminal)
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript
- `npm start` - Start production server

## Features

- [ ] User authentication and authorization
- [ ] Real-time odds updates via WebSockets
- [ ] Place and track bets
- [ ] User wallet/balance management
- [ ] Bet history and analytics
- [ ] Admin panel for odds management
- [ ] Responsive design

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
