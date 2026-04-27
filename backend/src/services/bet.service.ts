import { bets, events, markets, odds, users } from '../db/schema';
import { db } from '../db';
import { eq, and, sql } from 'drizzle-orm';
import { betStatusEnum } from '../db/schema';
import { deductForBet, payoutBet, getWalletByUserId } from './wallet.service';

export interface PlaceBetInput {
  userId: number;
  eventId: number;
  marketId: number;
  selectionId: string;
  stake: number;
}

export interface Bet {
  id: number;
  eventId: number;
  marketId: number;
  selectionId: string;
  stake: number;
  oddsAtPlacement: number;
  potentialPayout: number;
  status: string;
  placedAt: Date;
  settledAt?: Date;
}

export async function placeBet(input: PlaceBetInput) {
  // Validate event is open for betting
  const [event] = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
  if (!event) {
    throw new Error('Event not found');
  }

  if (event.status !== 'scheduled') {
    throw new Error('Event is not open for betting');
  }

  // Validate market is open
  const [market] = await db.select().from(markets).where(eq(markets.id, input.marketId)).limit(1);
  if (!market) {
    throw new Error('Market not found');
  }

  if (market.status !== 'open') {
    throw new Error('Market is not open for betting');
  }

  // Get current odds for selection
  const [odd] = await db
    .select()
    .from(odds)
    .where(
      and(
        eq(odds.marketId, input.marketId),
        eq(odds.selectionId, input.selectionId),
        eq(odds.isActive, true)
      )
    )
    .limit(1);

  if (!odd) {
    throw new Error('Odds not found for selection');
  }

  const decimalOdds = parseFloat(odd.decimalOdds);
  const potentialPayout = input.stake * decimalOdds;

  // Check user balance
  const wallet = await getWalletByUserId(input.userId);
  if (wallet.balance < input.stake) {
    throw new Error('Insufficient balance');
  }

  // Create bet
  const [bet] = await db.insert(bets).values({
    userId: input.userId,
    eventId: input.eventId,
    marketId: input.marketId,
    selectionId: input.selectionId,
    stake: input.stake.toFixed(2),
    oddsAtPlacement: decimalOdds.toFixed(2),
    potentialPayout: potentialPayout.toFixed(2),
    status: 'pending',
  }).returning();

  // Deduct from wallet
  await deductForBet(input.userId, bet.id, input.stake);

  return {
    id: bet.id,
    eventId: bet.eventId,
    marketId: bet.marketId,
    selectionId: bet.selectionId,
    stake: parseFloat(bet.stake),
    oddsAtPlacement: parseFloat(bet.oddsAtPlacement),
    potentialPayout: parseFloat(bet.potentialPayout),
    status: bet.status,
    placedAt: bet.placedAt,
  };
}

export async function getUserBets(userId: number, limit = 50) {
  const userBets = await db
    .select()
    .from(bets)
    .where(eq(bets.userId, userId))
    .orderBy(bets.placedAt)
    .limit(limit);

  return userBets.map((bet) => ({
    id: bet.id,
    eventId: bet.eventId,
    marketId: bet.marketId,
    selectionId: bet.selectionId,
    stake: parseFloat(bet.stake),
    oddsAtPlacement: parseFloat(bet.oddsAtPlacement),
    potentialPayout: parseFloat(bet.potentialPayout),
    status: bet.status,
    placedAt: bet.placedAt,
    settledAt: bet.settledAt,
  }));
}

export async function getBetById(betId: number, userId: number) {
  const [bet] = await db
    .select()
    .from(bets)
    .where(and(eq(bets.id, betId), eq(bets.userId, userId)))
    .limit(1);

  if (!bet) {
    return null;
  }

  return {
    id: bet.id,
    eventId: bet.eventId,
    marketId: bet.marketId,
    selectionId: bet.selectionId,
    stake: parseFloat(bet.stake),
    oddsAtPlacement: parseFloat(bet.oddsAtPlacement),
    potentialPayout: parseFloat(bet.potentialPayout),
    status: bet.status,
    placedAt: bet.placedAt,
    settledAt: bet.settledAt,
  };
}

export async function getPendingBetsForEvent(eventId: number) {
  const pendingBets = await db
    .select()
    .from(bets)
    .where(and(eq(bets.eventId, eventId), eq(bets.status, 'pending')));

  return pendingBets;
}

export async function settleBet(betId: number, won: boolean) {
  const [bet] = await db.select().from(bets).where(eq(bets.id, betId)).limit(1);
  if (!bet) {
    throw new Error('Bet not found');
  }

  if (bet.status !== 'pending') {
    throw new Error('Bet already settled');
  }

  const status = won ? 'won' : 'lost';

  await db
    .update(bets)
    .set({
      status,
      settledAt: new Date(),
    })
    .where(eq(bets.id, betId));

  // If won, payout
  if (won) {
    const payout = parseFloat(bet.potentialPayout);
    await payoutBet(bet.userId, bet.id, payout);
  }

  return {
    id: bet.id,
    userId: bet.userId,
    status,
    payout: won ? parseFloat(bet.potentialPayout) : 0,
  };
}

export async function settleEventBets(eventId: number, winningSelectionId: string) {
  const pendingBets = await getPendingBetsForEvent(eventId);

  const results = await Promise.all(
    pendingBets.map(async (bet) => {
      const won = bet.selectionId === winningSelectionId;
      return settleBet(bet.id, won);
    })
  );

  return results;
}
