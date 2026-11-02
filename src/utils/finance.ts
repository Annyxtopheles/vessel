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
  if (debt.status === 'settled') {
    return { remaining: 0, paid: principal, percent: 100 };
  }
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
    if (d.direction === 'owed_to_me') {
      totalAssets += remaining; // Receivables coming to me count as assets
    } else {
      totalLiabilities += remaining;
    }
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
  { id: 'cat-income-salary', name: 'Work Monthly Salary', monthly_budget: 32000 },
  { id: 'cat-family-mom', name: 'Mother Allowance (Fixed Monthly)', monthly_budget: 15000 },
  { id: 'cat-living-rent', name: 'Room & Living Rent Fees', monthly_budget: 2000 },
  { id: 'cat-travel-commute', name: 'Travel & Commute Expenses', monthly_budget: 3000 },
  { id: 'cat-living-provisions', name: 'Food, Provisions & Health', monthly_budget: 5000 },
  { id: 'cat-gear-inventory', name: 'Gear & Apparel Maintenance', monthly_budget: 3000 },
  { id: 'cat-debt-payoff', name: 'Settled Dues & Repayments' },
];

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-bank-main',
    name: 'Primary Salary Account',
    type: 'bank',
    opening_balance: 32000,
  },
  {
    id: 'acc-mobile-bKash',
    name: 'bKash Mobile Wallet',
    type: 'mobile_wallet',
    opening_balance: 4500,
  },
  {
    id: 'acc-cash-reserve',
    name: 'Physical Cash in Hand',
    type: 'cash',
    opening_balance: 2500,
  },
];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'goal-emergency',
    name: '3-Month Resilience Reserve',
    target_amount: 60000,
    target_date: '2027-06-01',
    account_id: 'acc-bank-main',
  },
];

export const INITIAL_DEBTS: Debt[] = [
  // Settled / Cleared Dues (Zero money owed to anyone)
  {
    id: 'debt-utshob-bus',
    name: 'Utshob Bus Transport Dues',
    lender: 'Utshob Bus Counter',
    principal: 2000,
    direction: 'i_owe',
    status: 'settled',
    notes: 'Paid and settled in full. Zero outstanding dues.',
  },
  {
    id: 'debt-past-dues',
    name: 'Historical Academic & Personal Dues',
    lender: 'Past Dues & Obligations',
    principal: 15000,
    direction: 'i_owe',
    status: 'settled',
    notes: 'All dues cleared. I owe nobody money.',
  },
  // Receivables (Money Owed To Me)
  {
    id: 'recv-shihab',
    name: 'Personal Advance to Shihab',
    lender: 'Shihab',
    principal: 5500,
    direction: 'owed_to_me',
    status: 'active',
    notes: 'Shihab owes 5,000 – 6,000 BDT.',
  },
  {
    id: 'recv-rafayet',
    name: 'Personal Advance to Rafayet',
    lender: 'Rafayet',
    principal: 5000,
    direction: 'owed_to_me',
    status: 'active',
    notes: 'Rafayet owes 5,000 BDT.',
  },
  {
    id: 'recv-kamrul',
    name: 'Mohakhali Room Rent from Kamrul',
    lender: 'Kamrul',
    principal: 1000,
    direction: 'owed_to_me',
    status: 'active',
    notes: '1,000 BDT minus final electricity bill deduction.',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-salary-nov',
    account_id: 'acc-bank-main',
    date: '2026-11-01',
    amount: 32000,
    type: 'income',
    category_id: 'cat-income-salary',
    note: 'November Work Salary (32,000 BDT)',
  },
  {
    id: 'tx-mom-nov',
    account_id: 'acc-bank-main',
    date: '2026-11-01',
    amount: 15000,
    type: 'expense',
    category_id: 'cat-family-mom',
    note: 'Mother Monthly Allowance (15,000 BDT)',
  },
  {
    id: 'tx-rent-nov',
    account_id: 'acc-bank-main',
    date: '2026-11-02',
    amount: 2000,
    type: 'expense',
    category_id: 'cat-living-rent',
    note: 'Monthly Rent Fees (2,000 BDT)',
  },
  {
    id: 'tx-travel-nov',
    account_id: 'acc-cash-reserve',
    date: '2026-11-02',
    amount: 1200,
    type: 'expense',
    category_id: 'cat-travel-commute',
    note: 'Weekly Commute & Travel Expenses',
  },
  {
    id: 'tx-utshob-cleared',
    account_id: 'acc-mobile-bKash',
    date: '2026-10-25',
    amount: 2000,
    type: 'expense',
    category_id: 'cat-debt-payoff',
    debt_id: 'debt-utshob-bus',
    note: 'Utshob Bus settlement payment — cleared in full',
  },
  {
    id: 'tx-past-dues-cleared',
    account_id: 'acc-bank-main',
    date: '2026-10-15',
    amount: 15000,
    type: 'expense',
    category_id: 'cat-debt-payoff',
    debt_id: 'debt-past-dues',
    note: 'All outstanding historical dues paid in full',
  },
];

export const INITIAL_NET_WORTH_SNAPSHOTS: NetWorthSnapshot[] = [
  { id: 'nw-2026-08', date: '2026-08-01', assets: 25000, liabilities: 0 },
  { id: 'nw-2026-09', date: '2026-09-01', assets: 32000, liabilities: 0 },
  { id: 'nw-2026-10', date: '2026-10-01', assets: 39000, liabilities: 0 },
  { id: 'nw-2026-11', date: '2026-11-01', assets: 50500, liabilities: 0 },
];
