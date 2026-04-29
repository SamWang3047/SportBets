import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { events, sports, markets, odds, horses, jockeys } from '../db/schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { startHorseRaceSimulation, stopSimulation } from '../services/simulation.service';
import { authenticate } from './auth.routes';

const router = Router();

// Admin middleware
const adminOnly = async (req: Request, res: Response, next: Function) => {
  const user = (req as any).user;
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Validation schemas
const createEventSchema = z.object({
  sportId: z.number().int().positive(),
  name: z.string().min(1).max(200),
  startTime: z.string().datetime(),
  duration: z.number().int().positive().optional(),
});

const createMarketSchema = z.object({
  eventId: z.number().int().positive(),
  marketType: z.string(),
  name: z.string(),
  odds: z.array(
    z.object({
      selectionId: z.string(),
      selectionName: z.string(),
      decimalOdds: z.number().positive(),
    })
  ),
});

// POST /api/admin/events
router.post('/events', authenticate, adminOnly, async (req: Request, res: Response) => {
  try {
    const body = createEventSchema.parse(req.body);

    const [newEvent] = await db.insert(events).values({
      sportId: body.sportId,
      name: body.name,
      startTime: new Date(body.startTime),
      status: 'scheduled',
    }).returning();

    res.status(201).json(newEvent);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
    } else {
      res.status(500).json({ error: 'Failed to create event' });
    }
  }
});

// POST /api/admin/events/:eventId/start
router.post('/events/:eventId/start', authenticate, adminOnly, async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId as string);

    const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get sport to determine simulation type
    const [sport] = await db.select().from(sports).where(eq(sports.id, event.sportId)).limit(1);
    if (!sport) {
      return res.status(404).json({ error: 'Sport not found' });
    }

    if (sport.code === 'horse_racing') {
      await startHorseRaceSimulation(eventId);
    } else {
      return res.status(400).json({ error: 'Unsupported sport type' });
    }

    res.json({ message: 'Simulation started', eventId });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to start simulation' });
  }
});

// POST /api/admin/events/:eventId/stop
router.post('/events/:eventId/stop', authenticate, adminOnly, async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId as string);
    stopSimulation(eventId);
    res.json({ message: 'Simulation stopped', eventId });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to stop simulation' });
  }
});

// POST /api/admin/markets
router.post('/markets', authenticate, adminOnly, async (req: Request, res: Response) => {
  try {
    const body = createMarketSchema.parse(req.body);

    const [newMarket] = await db.insert(markets).values({
      eventId: body.eventId,
      marketType: body.marketType,
      name: body.name,
      status: 'open',
    }).returning();

    // Create odds
    const newOdds = await db.insert(odds).values(
      body.odds.map((odd) => ({
        marketId: newMarket.id,
        selectionId: odd.selectionId,
        selectionName: odd.selectionName,
        decimalOdds: odd.decimalOdds.toFixed(2),
        isActive: true,
      }))
    ).returning();

    res.status(201).json({
      market: newMarket,
      odds: newOdds,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
    } else {
      res.status(500).json({ error: 'Failed to create market' });
    }
  }
});

// POST /api/admin/seed
router.post('/seed', authenticate, adminOnly, async (req: Request, res: Response) => {
  try {
    // Create sports if they don't exist
    const existingSports = await db.select().from(sports);
    if (existingSports.length === 0) {
      await db.insert(sports).values([
        { code: 'horse_racing', name: 'Horse Racing' },
      ]);
    }

    // Create sample horses
    const existingHorses = await db.select().from(horses);
    if (existingHorses.length === 0) {
      await db.insert(horses).values([
        { name: 'Thunder Strike', age: 4, speed: 85, stamina: 80, acceleration: 82, consistency: 75, preferredDistance: 1200 },
        { name: 'Silver Bullet', age: 5, speed: 88, stamina: 85, acceleration: 90, consistency: 80, preferredDistance: 1400 },
        { name: 'Midnight Runner', age: 3, speed: 82, stamina: 88, acceleration: 78, consistency: 85, preferredDistance: 1600 },
        { name: 'Golden Gale', age: 4, speed: 86, stamina: 82, acceleration: 84, consistency: 78, preferredDistance: 1200 },
        { name: 'Storm Chaser', age: 6, speed: 84, stamina: 90, acceleration: 80, consistency: 82, preferredDistance: 1800 },
        { name: 'Wind Dancer', age: 3, speed: 80, stamina: 78, acceleration: 88, consistency: 88, preferredDistance: 1000 },
      ]);
    }

    // Create sample jockeys
    const existingJockeys = await db.select().from(jockeys);
    if (existingJockeys.length === 0) {
      await db.insert(jockeys).values([
        { name: 'John Smith', experience: 75, skillRating: 82, aggression: 60 },
        { name: 'Mike Johnson', experience: 80, skillRating: 85, aggression: 55 },
        { name: 'David Williams', experience: 70, skillRating: 78, aggression: 65 },
        { name: 'Robert Brown', experience: 85, skillRating: 88, aggression: 50 },
        { name: 'James Davis', experience: 65, skillRating: 75, aggression: 70 },
        { name: 'William Miller', experience: 90, skillRating: 90, aggression: 45 },
      ]);
    }

    res.json({ message: 'Seed data created successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to seed data' });
  }
});

export default router;
