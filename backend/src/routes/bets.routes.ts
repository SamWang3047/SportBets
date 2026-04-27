import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { placeBet, getUserBets, getBetById } from '../services/bet.service';
import { authenticate } from './auth.routes';

const router = Router();

// Validation schemas
const placeBetSchema = z.object({
  eventId: z.number().int().positive(),
  marketId: z.number().int().positive(),
  selectionId: z.string(),
  stake: z.number().positive().max(10000),
});

// POST /api/bets
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const body = placeBetSchema.parse(req.body);
    const userId = (req as any).user.id;

    const bet = await placeBet({
      userId,
      eventId: body.eventId,
      marketId: body.marketId,
      selectionId: body.selectionId,
      stake: body.stake,
    });

    res.status(201).json(bet);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
    } else {
      res.status(400).json({ error: error.message || 'Failed to place bet' });
    }
  }
});

// GET /api/bets
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const bets = await getUserBets(userId, limit);
    res.json(bets);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get bets' });
  }
});

// GET /api/bets/:betId
router.get('/:betId', authenticate, async (req: Request, res: Response) => {
  try {
    const betId = parseInt(req.params.betId as string);
    const userId = (req as any).user.id;

    const bet = await getBetById(betId, userId);

    if (!bet) {
      return res.status(404).json({ error: 'Bet not found' });
    }

    res.json(bet);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get bet' });
  }
});

export default router;
