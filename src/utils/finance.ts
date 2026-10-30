import type {
  Account,
  FinanceCategory,
  Transaction,
  SavingsGoal,
  Debt,
  NetWorthSnapshot,
} from '../types';
import { getTodayLocalDateStr } from './date';

/**
 * Derives the real-time balance of a single financial account from transactions.
 * Never typed in or persisted directly.
 */
export function deriveAccountBalance(
  account: Account,
  transactions: Transaction[]
): number {
  const activeTx = transactions.filter(
    (t) => !t.deleted_at && !(t as any).deletedAt && t.account_id === account.id
  );

  const opening = account.opening_balance || 0;

  if (account.type === 'credit' || account.type === 'loan') {
    // Liability accounts:
    // Opening balance represents initial amount owed
    // Expense = additional charges/borrowing (+ owed)
    // Income = payment made towards the debt (- owed)
    // Transfer in = payment received (- owed)
    // Transfer out = cash advance / borrow (+ owed)
    let owed = opening;
    for (const t of activeTx) {
      if (t.type === 'expense') {
        owed += t.amount;
      } else if (t.type === 'income') {
        owed -= t.amount;
      } else if (t.type === 'transfer') {
        if (t.transfer_direction === 'in') {
          owed -= t.amount; // Payment into credit card
        } else {
          owed += t.amount; // Cash advance out of credit card
        }
      }
    }
    return owed;
  }

  // Asset accounts (cash, bank, mobile_wallet, savings, investment)
  let balance = opening;
  for (const t of activeTx) {
    if (t.type === 'income') {
      balance += t.amount;
    } else if (t.type === 'expense') {
      balance -= t.amount;
    } else if (t.type === 'transfer') {
      if (t.transfer_direction === 'in') {
        balance += t.amount;
      } else {
        balance -= t.amount;
      }
    }
  }

  return balance;
}

/**
 * Computes derived balances for all active accounts as a lookup map { [accountId]: balance }
 */
export function deriveAllAccountBalances(
  accounts: Account[],
  transactions: Transaction[]
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const acc of accounts) {
    map[acc.id] = deriveAccountBalance(acc, transactions);
  }
  return map;
}

/**
 * Derives current progress towards a SavingsGoal from transactions and linked accounts.
 */
export function deriveGoalProgress(
  goal: SavingsGoal,
  account: Account | undefined,
  transactions: Transaction[]
): { current: number; target: number; percent: number } {
  const target = goal.target_amount || 0;
  let current = 0;

  if (account) {
    // If goal has a dedicated account, balance of that account represents current saved amount
    current = Math.max(0, deriveAccountBalance(account, transactions));
  } else {
    // Or transactions tagged specifically with note or category matching the goal
    const goalTx = transactions.filter(
      (t) =>
        !t.deleted_at &&
        !(t as any).deletedAt &&
        (t.note?.toLowerCase().includes(goal.name.toLowerCase()) ||
          t.category_id === goal.id)
    );
    current = goalTx.reduce((sum, t) => {
      if (t.type === 'income' || t.transfer_direction === 'in') return sum + t.amount;
      if (t.type === 'expense' || t.transfer_direction === 'out') return sum - t.amount;
      return sum;
    }, 0);
    current = Math.max(0, current);
  }

  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return { current, target, percent };
}

/**
 * Derives the remaining balance and payoff progress for a debt from linked payment transactions.
 */
export function deriveDebtBalance(
  debt: Debt,
  transactions: Transaction[]
): { remaining: number; paid: number; percent: number } {
  const principal = debt.principal || 0;
  const payments = transactions.filter(
    (t) =>
      !t.deleted_at &&
      !(t as any).deletedAt &&
      (t.debt_id === debt.id ||
        (t.note && t.note.toLowerCase().includes(`debt:${debt.id}`)))
  );

  const paid = payments.reduce((sum, t) => sum + t.amount, 0);
  const remaining = Math.max(0, principal - paid);
  const percent = principal > 0 ? Math.min(100, Math.round((paid / principal) * 100)) : 100;

  return { remaining, paid, percent };
}

/**
 * Derives overall Net Worth, Assets, and Liabilities.
 */
export function deriveNetWorth(
  accounts: Account[],
  debts: Debt[],
  transactions: Transaction[]
): { assets: number; liabilities: number; netWorth: number } {
  const activeAccounts = accounts.filter((a) => !a.archived && !a.deleted_at && !(a as any).deletedAt);
  const activeDebts = debts.filter((d) => !d.deleted_at && !(d as any).deletedAt);

  let totalAssets = 0;
  let totalLiabilities = 0;

  for (const acc of activeAccounts) {
    const bal = deriveAccountBalance(acc, transactions);
    if (acc.type === 'credit' || acc.type === 'loan') {
      totalLiabilities += Math.max(0, bal);
    } else {
      totalAssets += Math.max(0, bal);
    }
  }

  for (const d of activeDebts) {
    const { remaining } = deriveDebtBalance(d, transactions);
    totalLiabilities += remaining;
  }

  return {
    assets: totalAssets,
    liabilities: totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
  };
}

/**
 * Derives this month's Income vs Expenses cash flow.
 */
export function deriveMonthlyCashFlow(
  transactions: Transaction[],
  monthPrefix?: string // e.g. "2026-10"
): { income: number; expenses: number; net: number } {
  const targetPrefix = monthPrefix || getTodayLocalDateStr().slice(0, 7);
  const activeTx = transactions.filter(
    (t) => !t.deleted_at && !(t as any).deletedAt && t.date && t.date.startsWith(targetPrefix)
  );

  let income = 0;
  let expenses = 0;

  for (const t of activeTx) {
    if (t.type === 'income') {
      income += t.amount;
    } else if (t.type === 'expense') {
      expenses += t.amount;
    }
  }

  return {
    income,
    expenses,
    net: income - expenses,
  };
}

/**
 * Returns net worth snapshots with auto-generation for the 1st of each month.
 */
export function ensureNetWorthSnapshots(
  existingSnapshots: NetWorthSnapshot[],
  accounts: Account[],
  debts: Debt[],
  transactions: Transaction[]
): { snapshots: NetWorthSnapshot[]; createdSnapshot?: NetWorthSnapshot } {
  const today = getTodayLocalDateStr();
  const currentMonthFirst = `${today.slice(0, 7)}-01`;
  const current = deriveNetWorth(accounts, debts, transactions);

  const existingMap = new Map<string, NetWorthSnapshot>();
  for (const s of existingSnapshots) {
    if (s.date) existingMap.set(s.date, s);
  }

  let createdSnapshot: NetWorthSnapshot | undefined = undefined;

  // If no snapshot exists for current month's 1st, create one
  if (!existingMap.has(currentMonthFirst)) {
    createdSnapshot = {
      id: `nw-${currentMonthFirst}`,
      date: currentMonthFirst,
      assets: current.assets,
      liabilities: current.liabilities,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      revision: 1,
    };
    existingMap.set(currentMonthFirst, createdSnapshot);
  }

  const sorted = Array.from(existingMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  return { snapshots: sorted, createdSnapshot };
}

// ==========================================
// INITIAL SEED DATA FOR CLEAN ONBOARDING
// ==========================================

export const INITIAL_FINANCE_CATEGORIES: FinanceCategory[] = [
  { id: 'cat-income-salary', name: 'Primary Salary / Client Retainer' },
  { id: 'cat-income-freelance', name: 'Software Consulting & Royalties' },
  { id: 'cat-living-housing', name: 'Housing & Utilities', monthly_budget: 35000 },
  { id: 'cat-living-groceries', name: 'Clean Nutrition & Provisions', monthly_budget: 18000 },
  { id: 'cat-living-health', name: 'Physical Training & Health', monthly_budget: 6000 },
  { id: 'cat-gear-inventory', name: 'Hardware & Apparel Acquisitions', monthly_budget: 15000 },
  { id: 'cat-craft-software', name: 'Servers & Digital Subscriptions', monthly_budget: 4500 },
  { id: 'cat-debt-payoff', name: 'Debt & Obligation Repayments' },
];

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-bank-main',
    name: 'Standard Chartered Checking',
    type: 'bank',
    opening_balance: 145000,
  },
  {
    id: 'acc-cash-vault',
    name: 'Physical Reserve & Cash',
    type: 'cash',
    opening_balance: 12500,
  },
  {
    id: 'acc-mobile-bKash',
    name: 'bKash Primary Mobile Wallet',
    type: 'mobile_wallet',
    opening_balance: 8400,
  },
  {
    id: 'acc-savings-hajj',
    name: 'Hajj & Sacred Journey Fund',
    type: 'savings',
    opening_balance: 220000,
  },
  {
    id: 'acc-inv-equity',
    name: 'Equities & Long-term Index',
    type: 'investment',
    opening_balance: 480000,
  },
  {
    id: 'acc-credit-platinum',
    name: 'City Bank Amex Platinum',
    type: 'credit',
    opening_balance: 18500,
  },
];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'goal-hajj',
    name: 'Hajj Pilgrimage Endowment',
    target_amount: 850000,
    target_date: '2028-06-01',
    account_id: 'acc-savings-hajj',
  },
  {
    id: 'goal-macbook',
    name: 'Studio M3 Max Workstation Upgrade',
    target_amount: 320000,
    target_date: '2027-01-15',
    wishlist_item_id: 'item-tech-2',
  },
];

export const INITIAL_DEBTS: Debt[] = [
  {
    id: 'debt-study',
    name: 'Higher Studies Family Loan',
    lender: 'Family Elder Council',
    principal: 150000,
    minimum_payment: 10000,
    due_day: 5,
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    account_id: 'acc-bank-main',
    date: '2026-10-01',
    amount: 220000,
    type: 'income',
    category_id: 'cat-income-salary',
    note: 'October Engineering Retainer & Architectural Deliverable',
  },
  {
    id: 'tx-2',
    account_id: 'acc-bank-main',
    date: '2026-10-02',
    amount: 32000,
    type: 'expense',
    category_id: 'cat-living-housing',
    note: 'October Studio Rent & Fiber Optic Connection',
  },
  {
    id: 'tx-3',
    account_id: 'acc-bank-main',
    date: '2026-10-05',
    amount: 10000,
    type: 'expense',
    category_id: 'cat-debt-payoff',
    debt_id: 'debt-study',
    note: 'October Installment - Higher Studies Loan',
  },
  {
    id: 'tx-4',
    account_id: 'acc-bank-main',
    date: '2026-10-08',
    amount: 14500,
    type: 'expense',
    category_id: 'cat-gear-inventory',
    item_id: 'item-apparel-1',
    note: 'Acquisition: Canvas Field Overshirt (Direct Payment)',
  },
  {
    id: 'tx-5',
    account_id: 'acc-bank-main',
    date: '2026-10-15',
    amount: 25000,
    type: 'transfer',
    transfer_pair_id: 'pair-hajj-oct',
    transfer_direction: 'out',
    note: 'Monthly Hajj Allocation -> Hajj Savings Account',
  },
  {
    id: 'tx-6',
    account_id: 'acc-savings-hajj',
    date: '2026-10-15',
    amount: 25000,
    type: 'transfer',
    transfer_pair_id: 'pair-hajj-oct',
    transfer_direction: 'in',
    note: 'Monthly Inflow from Main Checking for Hajj',
  },
];

export const INITIAL_NET_WORTH_SNAPSHOTS: NetWorthSnapshot[] = [
  { id: 'nw-2026-06', date: '2026-06-01', assets: 680000, liabilities: 190000 },
  { id: 'nw-2026-07', date: '2026-07-01', assets: 725000, liabilities: 180000 },
  { id: 'nw-2026-08', date: '2026-08-01', assets: 770000, liabilities: 170000 },
  { id: 'nw-2026-09', date: '2026-09-01', assets: 815000, liabilities: 160000 },
  { id: 'nw-2026-10', date: '2026-10-01', assets: 865900, liabilities: 158500 },
];
