import type { AccentKey } from '../theme/colors';

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  imageUri?: string;
  emoji?: string;
  accent: AccentKey;
  createdAt: number;
}

export type TransactionType = 'deposit' | 'withdrawal';

export interface Transaction {
  id: string;
  goalId: string;
  type: TransactionType;
  amount: number;
  note?: string;
  createdAt: number;
}

export interface CreateGoalInput {
  name: string;
  targetAmount: number;
  imageUri?: string;
  emoji?: string;
}
