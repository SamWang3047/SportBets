import { events, sports, markets, odds, footballTeams, horses, jockeys, raceRunners } from '../db/schema';
import { db } from '../db';
import { eq, and, desc, asc } from 'drizzle-orm';
import { eventStatusEnum } from '../db/schema';

export interface Event {
  id: number;
  sportId: number;
  name: string;
  status: string;
  startTime: Date;
  endTime?: Date;
  simulationState?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Market {
  id: number;
  eventId: number;
  marketType: string;
  name: string;
  status: string;
}

export interface Odd {
  id: number;
  marketId: number;
  selectionId: string;
  selectionName: string;
  decimalOdds: number;
  isActive: boolean;
}

export async function getAllSports() {
  const allSports = await db.select().from(sports);
  return allSports;
}

export async function getEvents(filters?: {
  sportId?: number;
  status?: string;
  limit?: number;
}) {
  const conditions = [];

  if (filters?.sportId) {
    conditions.push(eq(events.sportId, filters.sportId));
  }

  if (filters?.status) {
    conditions.push(eq(events.status, filters.status as any));
  }

  let query = db.select().from(events) as any;

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  query = query.orderBy(events.startTime);

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const allEvents = await query;
  return allEvents;
}

export async function getEventById(eventId: number) {
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) {
    return null;
  }

  return event;
}

export async function getEventMarkets(eventId: number) {
  const eventMarkets = await db
    .select()
    .from(markets)
    .where(eq(markets.eventId, eventId));

  return eventMarkets;
}

export async function getMarketOdds(marketId: number) {
  const marketOdds = await db
    .select()
    .from(odds)
    .where(and(eq(odds.marketId, marketId), eq(odds.isActive, true)));

  return marketOdds.map((odd) => ({
    id: odd.id,
    marketId: odd.marketId,
    selectionId: odd.selectionId,
    selectionName: odd.selectionName,
    decimalOdds: parseFloat(odd.decimalOdds),
    isActive: odd.isActive,
  }));
}

export async function getEventWithOdds(eventId: number) {
  const event = await getEventById(eventId);
  if (!event) {
    return null;
  }

  const eventMarkets = await getEventMarkets(eventId);

  const marketsWithOdds = await Promise.all(
    eventMarkets.map(async (market) => ({
      ...market,
      odds: await getMarketOdds(market.id),
    }))
  );

  return {
    ...event,
    markets: marketsWithOdds,
  };
}

export async function updateEventStatus(eventId: number, status: typeof eventStatusEnum.enumValues[number]) {
  const [updatedEvent] = await db
    .update(events)
    .set({
      status,
      updatedAt: new Date(),
      ...(status === 'finished' ? { endTime: new Date() } : {}),
    })
    .where(eq(events.id, eventId))
    .returning();

  return updatedEvent;
}

export async function updateEventSimulationState(eventId: number, simulationState: any) {
  const [updatedEvent] = await db
    .update(events)
    .set({
      simulationState: JSON.stringify(simulationState),
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId))
    .returning();

  return updatedEvent;
}

export async function updateOdds(marketId: number, oddsUpdates: Array<{ selectionId: string; decimalOdds: number }>) {
  await Promise.all(
    oddsUpdates.map((update) =>
      db
        .update(odds)
        .set({
          decimalOdds: update.decimalOdds.toFixed(2),
        })
        .where(
          and(
            eq(odds.marketId, marketId),
            eq(odds.selectionId, update.selectionId)
          )
        )
    )
  );
}

export async function closeMarket(marketId: number) {
  const [updatedMarket] = await db
    .update(markets)
    .set({
      status: 'closed',
    })
    .where(eq(markets.id, marketId))
    .returning();

  return updatedMarket;
}

export async function settleMarket(marketId: number, winningSelectionId: string) {
  const [updatedMarket] = await db
    .update(markets)
    .set({
      status: 'settled',
    })
    .where(eq(markets.id, marketId))
    .returning();

  return updatedMarket;
}
