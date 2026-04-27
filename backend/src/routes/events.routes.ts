import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getAllSports, getEvents, getEventById, getEventWithOdds } from '../services/event.service';
import { authenticate } from './auth.routes';

const router = Router();

// GET /api/sports
router.get('/sports', async (req: Request, res: Response) => {
  try {
    const sports = await getAllSports();
    res.json(sports);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get sports' });
  }
});

// GET /api/events
router.get('/events', async (req: Request, res: Response) => {
  try {
    const sportId = req.query.sportId ? parseInt(req.query.sportId as string) : undefined;
    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    const events = await getEvents({ sportId, status, limit });
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get events' });
  }
});

// GET /api/events/:eventId
router.get('/events/:eventId', async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId as string);
    const event = await getEventById(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get event' });
  }
});

// GET /api/events/:eventId/markets
router.get('/events/:eventId/markets', async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId as string);
    const eventWithOdds = await getEventWithOdds(eventId);

    if (!eventWithOdds) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(eventWithOdds.markets);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get event markets' });
  }
});

// GET /api/events/:eventId/odds
router.get('/events/:eventId/odds', async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.eventId as string);
    const eventWithOdds = await getEventWithOdds(eventId);

    if (!eventWithOdds) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Flatten odds from all markets
    const allOdds = eventWithOdds.markets.flatMap((market: any) =>
      market.odds.map((odd: any) => ({
        ...odd,
        marketId: market.id,
        marketType: market.marketType,
        marketName: market.name,
      }))
    );

    res.json(allOdds);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get event odds' });
  }
});

export default router;
