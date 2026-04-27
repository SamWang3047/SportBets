import { wallets, transactions, users } from '../db/schema';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { transactionTypeEnum } from '../db/schema';

export interface Transaction {
  id: number;
  type: string;
  amount: string;
  balanceAfter: string;
  referenceId?: string;
  description?: string;
  createdAt: Date;
}

export async function getWalletByUserId(userId: number) {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  return {
    id: wallet.id,
    balance: parseFloat(wallet.balance),
    currency: wallet.currency,
  };
}

export async function getWalletTransactions(userId: number, limit = 50) {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const txs = await db
    .select()
    .from(transactions)
    .where(eq(transactions.walletId, wallet.id))
    .orderBy(transactions.createdAt)
    .limit(limit);

  return txs.map((tx) => ({
    id: tx.id,
    type: tx.type,
    amount: parseFloat(tx.amount),
    balanceAfter: parseFloat(tx.balanceAfter),
    referenceId: tx.referenceId,
    description: tx.description,
    createdAt: tx.createdAt,
  }));
}

export async function createTransaction(
  walletId: number,
  type: typeof transactionTypeEnum.enumValues[number],
  amount: number,
  referenceId?: string,
  description?: string
) {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId)).limit(1);
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const currentBalance = parseFloat(wallet.balance);
  const newBalance = currentBalance + amount;

  if (newBalance < 0) {
    throw new Error('Insufficient balance');
  }

  await db.update(wallets).set({
    balance: newBalance.toFixed(2),
    updatedAt: new Date(),
  }).where(eq(wallets.id, walletId));

  const [transaction] = await db.insert(transactions).values({
    walletId,
    type,
    amount: amount.toFixed(2),
    balanceAfter: newBalance.toFixed(2),
    referenceId,
    description,
  }).returning();

  return {
    id: transaction.id,
    type: transaction.type,
    amount: parseFloat(transaction.amount),
    balanceAfter: parseFloat(transaction.balanceAfter),
    referenceId: transaction.referenceId,
    description: transaction.description,
    createdAt: transaction.createdAt,
  };
}

export async function deductForBet(userId: number, betId: number, amount: number) {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  return createTransaction(
    wallet.id,
    'bet_stake',
    -amount,
    betId.toString(),
    `Bet placement #${betId}`
  );
}

export async function payoutBet(userId: number, betId: number, amount: number) {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  return createTransaction(
    wallet.id,
    'bet_payout',
    amount,
    betId.toString(),
    `Bet payout #${betId}`
  );
}

export async function refundBet(userId: number, betId: number, amount: number) {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  return createTransaction(
    wallet.id,
    'bet_refund',
    amount,
    betId.toString(),
    `Bet refund #${betId}`
  );
}
