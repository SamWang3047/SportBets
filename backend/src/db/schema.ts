import { pgTable, serial, text, timestamp, decimal, integer, boolean, pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const eventStatusEnum = pgEnum('event_status', ['scheduled', 'live', 'finished', 'cancelled']);
export const betStatusEnum = pgEnum('bet_status', ['pending', 'won', 'lost', 'void']);
export const transactionTypeEnum = pgEnum('transaction_type', ['deposit', 'bet_stake', 'bet_payout', 'bet_refund']);
export const sportCodeEnum = pgEnum('sport_code', ['football', 'horse_racing']);

// Users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
}));

// Wallets
export const wallets = pgTable('wallets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  balance: decimal('balance', { precision: 10, scale: 2 }).notNull().default('1000.00'),
  currency: text('currency').notNull().default('CREDITS'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('wallets_user_id_idx').on(table.userId),
}));

// Transactions
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  walletId: integer('wallet_id').notNull().references(() => wallets.id, { onDelete: 'cascade' }),
  type: transactionTypeEnum('type').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal('balance_after', { precision: 10, scale: 2 }).notNull(),
  referenceId: text('reference_id'), // Can reference bet_id, event_id, etc.
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  walletIdIdx: index('transactions_wallet_id_idx').on(table.walletId),
  referenceIdIdx: index('transactions_reference_id_idx').on(table.referenceId),
}));

// Sports
export const sports = pgTable('sports', {
  id: serial('id').primaryKey(),
  code: sportCodeEnum('code').notNull().unique(),
  name: text('name').notNull(),
});

// Events
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  sportId: integer('sport_id').notNull().references(() => sports.id),
  name: text('name').notNull(),
  status: eventStatusEnum('status').notNull().default('scheduled'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  simulationState: text('simulation_state'), // JSON string for simulation state
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  sportIdIdx: index('events_sport_id_idx').on(table.sportId),
  statusIdx: index('events_status_idx').on(table.status),
  startTimeIdx: index('events_start_time_idx').on(table.startTime),
}));

// Markets
export const markets = pgTable('markets', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  marketType: text('market_type').notNull(), // 'match_winner', 'race_winner', 'total_goals', etc.
  name: text('name').notNull(),
  status: text('status').notNull().default('open'), // 'open', 'closed', 'settled'
}, (table) => ({
  eventIdIdx: index('markets_event_id_idx').on(table.eventId),
}));

// Odds
export const odds = pgTable('odds', {
  id: serial('id').primaryKey(),
  marketId: integer('market_id').notNull().references(() => markets.id, { onDelete: 'cascade' }),
  selectionId: text('selection_id').notNull(), // 'home', 'away', 'draw', or horse_id
  selectionName: text('selection_name').notNull(),
  decimalOdds: decimal('decimal_odds', { precision: 5, scale: 2 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  marketIdIdx: index('odds_market_id_idx').on(table.marketId),
  selectionIdIdx: index('odds_selection_id_idx').on(table.selectionId),
}));

// Bets
export const bets = pgTable('bets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventId: integer('event_id').notNull().references(() => events.id),
  marketId: integer('market_id').notNull().references(() => markets.id),
  selectionId: text('selection_id').notNull(),
  stake: decimal('stake', { precision: 10, scale: 2 }).notNull(),
  oddsAtPlacement: decimal('odds_at_placement', { precision: 5, scale: 2 }).notNull(),
  potentialPayout: decimal('potential_payout', { precision: 10, scale: 2 }).notNull(),
  status: betStatusEnum('status').notNull().default('pending'),
  placedAt: timestamp('placed_at').notNull().defaultNow(),
  settledAt: timestamp('settled_at'),
}, (table) => ({
  userIdIdx: index('bets_user_id_idx').on(table.userId),
  eventIdIdx: index('bets_event_id_idx').on(table.eventId),
  statusIdx: index('bets_status_idx').on(table.status),
}));

// Football Teams
export const footballTeams = pgTable('football_teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  shortName: text('short_name').notNull(),
  country: text('country').notNull(),
  attackRating: integer('attack_rating').notNull().default(70),
  midfieldRating: integer('midfield_rating').notNull().default(70),
  defenseRating: integer('defense_rating').notNull().default(70),
  formRating: integer('form_rating').notNull().default(70),
});

// Football Players
export const footballPlayers = pgTable('football_players', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => footballTeams.id),
  name: text('name').notNull(),
  position: text('position').notNull(), // 'GK', 'DEF', 'MID', 'FWD'
  age: integer('age').notNull(),
  overallRating: integer('overall_rating').notNull().default(70),
  pace: integer('pace').notNull().default(70),
  shooting: integer('shooting').notNull().default(70),
  passing: integer('passing').notNull().default(70),
  defending: integer('defending').notNull().default(70),
  stamina: integer('stamina').notNull().default(70),
}, (table) => ({
  teamIdIdx: index('football_players_team_id_idx').on(table.teamId),
}));

// Horses
export const horses = pgTable('horses', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  age: integer('age').notNull(),
  speed: integer('speed').notNull().default(70),
  stamina: integer('stamina').notNull().default(70),
  acceleration: integer('acceleration').notNull().default(70),
  consistency: integer('consistency').notNull().default(70),
  preferredDistance: integer('preferred_distance').notNull().default(1200), // in meters
});

// Jockeys
export const jockeys = pgTable('jockeys', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  experience: integer('experience').notNull().default(50), // 0-100
  skillRating: integer('skill_rating').notNull().default(70),
  aggression: integer('aggression').notNull().default(50), // 0-100
});

// Race Runners (links horses and jockeys to races)
export const raceRunners = pgTable('race_runners', {
  id: serial('id').primaryKey(),
  raceId: integer('race_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  horseId: integer('horse_id').notNull().references(() => horses.id),
  jockeyId: integer('jockey_id').notNull().references(() => jockeys.id),
  stallNumber: integer('stall_number').notNull(),
  startingOdds: decimal('starting_odds', { precision: 5, scale: 2 }).notNull(),
  finalPosition: integer('final_position'),
}, (table) => ({
  raceIdIdx: index('race_runners_race_id_idx').on(table.raceId),
}));

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [users.id],
    references: [wallets.userId],
  }),
  bets: many(bets),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
}));

export const sportsRelations = relations(sports, ({ many }) => ({
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  sport: one(sports, {
    fields: [events.sportId],
    references: [sports.id],
  }),
  markets: many(markets),
  bets: many(bets),
}));

export const marketsRelations = relations(markets, ({ one, many }) => ({
  event: one(events, {
    fields: [markets.eventId],
    references: [events.id],
  }),
  odds: many(odds),
  bets: many(bets),
}));

export const oddsRelations = relations(odds, ({ one }) => ({
  market: one(markets, {
    fields: [odds.marketId],
    references: [markets.id],
  }),
}));

export const betsRelations = relations(bets, ({ one }) => ({
  user: one(users, {
    fields: [bets.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [bets.eventId],
    references: [events.id],
  }),
  market: one(markets, {
    fields: [bets.marketId],
    references: [markets.id],
  }),
}));

export const footballTeamsRelations = relations(footballTeams, ({ many }) => ({
  players: many(footballPlayers),
}));

export const footballPlayersRelations = relations(footballPlayers, ({ one }) => ({
  team: one(footballTeams, {
    fields: [footballPlayers.teamId],
    references: [footballTeams.id],
  }),
}));

export const horsesRelations = relations(horses, ({ many }) => ({
  raceRunners: many(raceRunners),
}));

export const jockeysRelations = relations(jockeys, ({ many }) => ({
  raceRunners: many(raceRunners),
}));

export const raceRunnersRelations = relations(raceRunners, ({ one }) => ({
  race: one(events, {
    fields: [raceRunners.raceId],
    references: [events.id],
  }),
  horse: one(horses, {
    fields: [raceRunners.horseId],
    references: [horses.id],
  }),
  jockey: one(jockeys, {
    fields: [raceRunners.jockeyId],
    references: [jockeys.id],
  }),
}));
