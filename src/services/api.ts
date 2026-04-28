import axios from 'axios';
import type { AuthResponse, Event, Market, Odd, Bet, Wallet, Transaction } from '../types';

const configuredApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const normalizedApiUrl = configuredApiUrl.replace(/\/+$/, '');
const API_BASE_URL = normalizedApiUrl.endsWith('/api')
  ? normalizedApiUrl
  : `${normalizedApiUrl}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authApi = {
  register: async (email: string, password: string, displayName: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', { email, password, displayName });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Events API
export const eventsApi = {
  getSports: async () => {
    const response = await api.get('/sports');
    return response.data;
  },

  getEvents: async (filters?: { sportId?: number; status?: string; limit?: number }): Promise<Event[]> => {
    const response = await api.get('/events', { params: filters });
    return response.data;
  },

  getEvent: async (eventId: number): Promise<Event> => {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  },

  getEventMarkets: async (eventId: number): Promise<Market[]> => {
    const response = await api.get(`/events/${eventId}/markets`);
    return response.data;
  },

  getEventOdds: async (eventId: number): Promise<Odd[]> => {
    const response = await api.get(`/events/${eventId}/odds`);
    return response.data;
  },
};

// Bets API
export const betsApi = {
  placeBet: async (data: {
    eventId: number;
    marketId: number;
    selectionId: string;
    stake: number;
  }): Promise<Bet> => {
    const response = await api.post('/bets', data);
    return response.data;
  },

  getBets: async (limit?: number): Promise<Bet[]> => {
    const response = await api.get('/bets', { params: { limit } });
    return response.data;
  },

  getBet: async (betId: number): Promise<Bet> => {
    const response = await api.get(`/bets/${betId}`);
    return response.data;
  },
};

// Wallet API
export const walletApi = {
  getWallet: async (): Promise<Wallet> => {
    const response = await api.get('/wallet');
    return response.data;
  },

  getTransactions: async (limit?: number): Promise<Transaction[]> => {
    const response = await api.get('/wallet/transactions', { params: { limit } });
    return response.data;
  },
};

export default api;
