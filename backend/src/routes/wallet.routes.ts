import { Router, Request, Response } from 'express';
import { getWalletByUserId, getWalletTransactions } from '../services/wallet.service';
import { authenticate } from './auth.routes';

const router = Router();

// GET /api/wallet
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const wallet = await getWalletByUserId(userId);
    res.json(wallet);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get wallet' });
  }
});

// GET /api/wallet/transactions
router.get('/transactions', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const transactions = await getWalletTransactions(userId, limit);
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

export default router;
