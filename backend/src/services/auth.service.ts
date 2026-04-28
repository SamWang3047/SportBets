import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { users, wallets } from '../db/schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function registerUser(email: string, password: string, displayName: string) {
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingUser.length > 0) {
    throw new Error('User already exists');
  }

  const passwordHash = await hashPassword(password);

  const [newUser] = await db.insert(users).values({
    email,
    passwordHash,
    displayName,
    role: 'user',
  }).returning();

  // Create wallet with initial balance
  await db.insert(wallets).values({
    userId: newUser.id,
    balance: '1000.00',
    currency: 'CREDITS',
  });

  const token = generateToken({
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
  });

  return {
    user: {
      id: newUser.id,
      email: newUser.email,
      displayName: newUser.displayName,
      role: newUser.role,
    },
    token,
  };
}

export async function loginUser(email: string, password: string) {
  console.log('Login attempt for email:', email);
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    console.log('User found:', !!user);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    console.log('Password valid:', isValid);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      token,
    };
  } catch (error: any) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function getUserById(userId: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
}
