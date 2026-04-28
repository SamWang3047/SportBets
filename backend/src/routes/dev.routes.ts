import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  generateDevRace,
  getRaceRunners,
  getRaceRunnersWithDetails,
} from '../services/devRace.service';
import { settleDevRace, runDevRace, getRaceSimulationState } from '../services/devRace.service';
import { getEventById } from '../services/event.service';

const router = Router();

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Middleware to block dev routes in production
const devOnly = (req: Request, res: Response, next: () => void) => {
  if (isProduction) {
    return res.status(403).json({ error: 'Dev routes are not available in production' });
  }
  next();
};

// Apply dev-only middleware to all routes
router.use(devOnly);

/**
 * POST /api/dev/races/generate
 * Generate a demo horse racing event
 */
router.post('/races/generate', async (req: Request, res: Response) => {
  try {
    const race = await generateDevRace();
    res.json({
      success: true,
      eventId: race.eventId,
      marketId: race.marketId,
      runners: race.runners,
      odds: race.odds,
    });
  } catch (error: any) {
    console.error('Error generating dev race:', error);
    res.status(500).json({ error: error.message || 'Failed to generate dev race' });
  }
});

/**
 * GET /api/dev/races/:eventId/runners
 * Get race runners for an event
 */
router.get('/races/:eventId/runners', async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId);
    const runners = await getRaceRunnersWithDetails(eventId);
    res.json(runners);
  } catch (error: any) {
    console.error('Error getting race runners:', error);
    res.status(500).json({ error: 'Failed to get race runners' });
  }
});

/**
 * POST /api/dev/races/:eventId/settle
 * Instantly settle a race and resolve all pending bets
 */
router.post('/races/:eventId/settle', async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId);

    // Check if event exists
    const event = await getEventById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if event is already finished
    if (event.status === 'finished') {
      return res.status(400).json({ error: 'Event is already finished' });
    }

    const result = await settleDevRace(eventId);
    res.json({
      success: true,
      eventId,
      winningHorseId: result.winningHorseId,
      finalPositions: result.finalPositions,
      settledBets: result.settledBets,
    });
  } catch (error: any) {
    console.error('Error settling dev race:', error);
    res.status(500).json({ error: error.message || 'Failed to settle dev race' });
  }
});

/**
 * POST /api/dev/races/:eventId/run
 * Start a 30-second demo simulation of a race
 */
router.post('/races/:eventId/run', async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId);

    // Check if event exists
    const event = await getEventById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if event is already running or finished
    if (event.status === 'live') {
      return res.status(400).json({ error: 'Race is already running' });
    }

    if (event.status === 'finished') {
      return res.status(400).json({ error: 'Race is already finished' });
    }

    // Start the simulation
    const simulation = await runDevRace(eventId);

    res.json({
      success: true,
      eventId,
      simulationId: simulation.simulationId,
      estimatedDuration: 30, // seconds
      message: 'Race simulation started',
    });
  } catch (error: any) {
    console.error('Error running dev race:', error);
    res.status(500).json({ error: error.message || 'Failed to run dev race' });
  }
});

/**
 * GET /api/dev/races/:eventId/simulation
 * Get the current simulation state of a race
 */
router.get('/races/:eventId/simulation', async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId);
    const state = await getRaceSimulationState(eventId);

    if (!state) {
      return res.status(404).json({ error: 'No simulation found for this event' });
    }

    res.json(state);
  } catch (error: any) {
    console.error('Error getting simulation state:', error);
    res.status(500).json({ error: 'Failed to get simulation state' });
  }
});

export default router;
