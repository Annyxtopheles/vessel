import React, { useState } from 'react';
import type {
  Account,
  FinanceCategory,
  Transaction,
  SavingsGoal,
  Debt,
  NetWorthSnapshot,
  AccountType,
  TransactionType,
  InventoryItem,
  NumberGroupingOption,
} from '../types';
import {
  deriveAccountBalance,
  deriveAllAccountBalances,
  deriveGoalProgress,
  deriveDebtBalance,
  deriveNetWorth,
  deriveMonthlyCashFlow,
  ensureNetWorthSnapshots,
} from '../utils/finance';
import { formatCurrency } from '../utils/numberFormat';
import { getTodayLocalDateStr } from '../utils/date';
import { sfx } from '../utils/audio';
import { CustomSelect } from './CustomSelect';
import {
  Trash2,
  X,
  CreditCard,
  Building,
  Smartphone,
  PiggyBank,
  TrendingUp,
  Banknote,
  AlertCircle,
} from 'lucide-react';

export type MoneySubTab = 'summary' | 'accounts' | 'transactions' | 'goals' | 'debts';

interface MoneyViewProps {
  accounts: Account[];
  financeCategories: FinanceCategory[];
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  debts: Debt[];
  netWorthSnapshots: NetWorthSnapshot[];
  items: InventoryItem[];
  currencySymbol?: string;
  numberGrouping?: NumberGroupingOption;
  onAddAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  onUpdateAccount: (account: Account) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onAddSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => Promise<void>;
  onUpdateSavingsGoal: (goal: SavingsGoal) => Promise<void>;
  onDeleteSavingsGoal: (id: string) => Promise<void>;
  onAddDebt: (debt: Omit<Debt, 'id'>) => Promise<void>;
  onUpdateDebt: (debt: Debt) => Promise<void>;
  onDeleteDebt: (id: string) => Promise<void>;
  onAddSnapshot?: (snapshot: NetWorthSnapshot) => Promise<void>;
  onNavigateToInventory?: () => void;
}

const ACCOUNT_TYPE_ICONS: Record<AccountType, React.ElementType> = {
  cash: Banknote,
  bank: Building,
  mobile_wallet: Smartphone,
  savings: PiggyBank,
  investment: TrendingUp,
  credit: CreditCard,
  loan: AlertCircle,
};

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: 'Physical Cash',
  bank: 'Bank Account',
  mobile_wallet: 'Mobile Wallet',
  savings: 'Dedicated Savings',
  investment: 'Investments & Equity',
  credit: 'Credit Card (Liability)',
  loan: 'Loan / Financing (Liability)',
};

export const MoneyView: React.FC<MoneyViewProps> = ({
  accounts,
  financeCategories,
  transactions,
  savingsGoals,
  debts,
  netWorthSnapshots,
  items,
  currencySymbol = '৳',
  numberGrouping = 'bangladeshi',
  onAddAccount,
  onDeleteAccount,
  onAddTransaction,
  onDeleteTransaction,
  onAddSavingsGoal,
  onDeleteSavingsGoal,
  onAddDebt,
  onDeleteDebt,
  onNavigateToInventory,
}) => {
  const [activeTab, setActiveTab] = useState<MoneySubTab>('summary');
  const todayStr = getTodayLocalDateStr();

  // Active filters for transactions table
  const [txSearch, setTxSearch] = useState('');
  const [txAccountFilter, setTxAccountFilter] = useState('ALL');
  const [txCategoryFilter, setTxCategoryFilter] = useState('ALL');
  const [txTypeFilter, setTxTypeFilter] = useState<'ALL' | TransactionType>('ALL');

  // Fast Add Transaction state
  const [fastAmount, setFastAmount] = useState('');
  const [fastAccount, setFastAccount] = useState(accounts[0]?.id || '');
  const [fastCategory, setFastCategory] = useState(financeCategories[0]?.id || '');
  const [fastDate, setFastDate] = useState(todayStr);
  const [fastType, setFastType] = useState<TransactionType>('expense');
  const [fastNote, setFastNote] = useState('');

  // Transfer destination account (if type === 'transfer')
  const [transferDestAccount, setTransferDestAccount] = useState(accounts[1]?.id || '');

  // Modals
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>('bank');
  const [newAccOpening, setNewAccOpening] = useState('0');

  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDate, setGoalDate] = useState('');
  const [goalAccountId, setGoalAccountId] = useState('');
  const [goalWishlistId, setGoalWishlistId] = useState('');

  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [debtName, setDebtName] = useState('');
  const [debtLender, setDebtLender] = useState('');
  const [debtPrincipal, setDebtPrincipal] = useState('');
  const [debtInterest, setDebtInterest] = useState('');
  const [debtMinPayment, setDebtMinPayment] = useState('');
  const [debtDueDay, setDebtDueDay] = useState('');

  const [activePayDebt, setActivePayDebt] = useState<Debt | null>(null);
  const [payDebtAmount, setPayDebtAmount] = useState('');
  const [payDebtAccountId, setPayDebtAccountId] = useState(accounts[0]?.id || '');

  // Effective defaults so dropdowns work immediately after async IndexedDB hydration
  const effectiveFastAccount = fastAccount || accounts[0]?.id || '';
  const effectiveFastCategory = fastCategory || financeCategories[0]?.id || '';
  const effectiveTransferDest =
    (transferDestAccount && transferDestAccount !== effectiveFastAccount
      ? transferDestAccount
      : accounts.find((a) => a.id !== effectiveFastAccount)?.id) || '';
  const effectivePayDebtAccount = payDebtAccountId || accounts[0]?.id || '';

  // Derived core financial figures
  const { assets, liabilities, netWorth } = deriveNetWorth(accounts, debts, transactions);
  const accountBalances = deriveAllAccountBalances(accounts, transactions);
  const cashFlow = deriveMonthlyCashFlow(transactions);

  // Auto-snapshot check
  const { snapshots } = ensureNetWorthSnapshots(netWorthSnapshots, accounts, debts, transactions);

  // Month-over-month Net Worth change
  const previousMonthSnapshot = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null;
  const previousNetWorth = previousMonthSnapshot
    ? previousMonthSnapshot.assets - previousMonthSnapshot.liabilities
    : netWorth;
  const netWorthDelta = netWorth - previousNetWorth;
  const netWorthDeltaPercent =
    previousNetWorth !== 0 ? ((netWorthDelta / Math.abs(previousNetWorth)) * 100).toFixed(1) : '0.0';

  // Filtered transactions
  const activeTxList = transactions.filter((t) => !t.deleted_at && !(t as any).deletedAt);
  const filteredTx = activeTxList.filter((tx) => {
    if (txAccountFilter !== 'ALL' && tx.account_id !== txAccountFilter) return false;
    if (txCategoryFilter !== 'ALL' && tx.category_id !== txCategoryFilter) return false;
    if (txTypeFilter !== 'ALL' && tx.type !== txTypeFilter) return false;
    if (txSearch.trim()) {
      const q = txSearch.toLowerCase();
      const noteMatch = (tx.note || '').toLowerCase().includes(q);
      const amountMatch = String(tx.amount).includes(q);
      const catMatch = financeCategories
        .find((c) => c.id === tx.category_id)
        ?.name.toLowerCase()
        .includes(q);
      if (!noteMatch && !amountMatch && !catMatch) return false;
    }
    return true;
  });

  const handleFastAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(fastAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || !effectiveFastAccount) return;

    if (fastType === 'transfer') {
      if (!effectiveTransferDest || effectiveTransferDest === effectiveFastAccount) return;
      const pairId = `pair-${Date.now()}`;
      const srcAcc = accounts.find((a) => a.id === effectiveFastAccount)?.name || 'Account';
      const destAcc = accounts.find((a) => a.id === effectiveTransferDest)?.name || 'Account';

      // Outflow transaction
      await onAddTransaction({
        account_id: effectiveFastAccount,
        date: fastDate || todayStr,
        amount: parsedAmount,
        type: 'transfer',
        transfer_pair_id: pairId,
        transfer_direction: 'out',
        note: fastNote.trim() ? `${fastNote} (Transfer to ${destAcc})` : `Transfer to ${destAcc}`,
      });

      // Inflow transaction
      await onAddTransaction({
        account_id: effectiveTransferDest,
        date: fastDate || todayStr,
        amount: parsedAmount,
        type: 'transfer',
        transfer_pair_id: pairId,
        transfer_direction: 'in',
        note: fastNote.trim() ? `${fastNote} (Transfer from ${srcAcc})` : `Transfer from ${srcAcc}`,
      });
    } else {
      await onAddTransaction({
        account_id: effectiveFastAccount,
        date: fastDate || todayStr,
        amount: parsedAmount,
        type: fastType,
        category_id: effectiveFastCategory || undefined,
        note: fastNote.trim() || undefined,
      });
    }

    setFastAmount('');
    setFastNote('');
    sfx.playClick();
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;
    const opening = parseFloat(newAccOpening) || 0;

    await onAddAccount({
      name: newAccName.trim(),
      type: newAccType,
      opening_balance: opening,
      archived: false,
    });

    setNewAccName('');
    setNewAccOpening('0');
    setIsAddAccountOpen(false);
    sfx.playClick();
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(goalTarget);
    if (!goalName.trim() || isNaN(target) || target <= 0) return;

    await onAddSavingsGoal({
      name: goalName.trim(),
      target_amount: target,
      target_date: goalDate || undefined,
      account_id: goalAccountId || undefined,
      wishlist_item_id: goalWishlistId || undefined,
    });

    setGoalName('');
    setGoalTarget('');
    setGoalDate('');
    setGoalAccountId('');
    setGoalWishlistId('');
    setIsAddGoalOpen(false);
    sfx.playClick();
  };

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(debtPrincipal);
    if (!debtName.trim() || !debtLender.trim() || isNaN(p) || p <= 0) return;

    await onAddDebt({
      name: debtName.trim(),
      lender: debtLender.trim(),
      principal: p,
      interest_rate: debtInterest ? parseFloat(debtInterest) : undefined,
      minimum_payment: debtMinPayment ? parseFloat(debtMinPayment) : undefined,
      due_day: debtDueDay ? parseInt(debtDueDay, 10) : undefined,
    });

    setDebtName('');
    setDebtLender('');
    setDebtPrincipal('');
    setDebtInterest('');
    setDebtMinPayment('');
    setDebtDueDay('');
    setIsAddDebtOpen(false);
    sfx.playClick();
  };

  const handleLogDebtPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePayDebt) return;
    const parsed = parseFloat(payDebtAmount);
    if (isNaN(parsed) || parsed <= 0 || !effectivePayDebtAccount) return;

    await onAddTransaction({
      account_id: effectivePayDebtAccount,
      date: todayStr,
      amount: parsed,
      type: 'expense',
      debt_id: activePayDebt.id,
      note: `Installment Payment for ${activePayDebt.name} (${activePayDebt.lender})`,
    });

    setActivePayDebt(null);
    setPayDebtAmount('');
    sfx.playEquip();
  };

  // Group accounts by Asset vs Liability
  const assetAccounts = accounts.filter(
    (a) => !a.archived && a.type !== 'credit' && a.type !== 'loan'
  );
  const liabilityAccounts = accounts.filter(
    (a) => !a.archived && (a.type === 'credit' || a.type === 'loan')
  );

  return (
    <div className="space-y-6">
      {/* 1. Sub-tab Bar & Header */}
      <div className="pb-2 border-b border-[#E4DED2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-[14px]">
          {(
            [
              { id: 'summary', label: 'Summary' },
              { id: 'accounts', label: 'Accounts' },
              { id: 'transactions', label: 'Transactions' },
              { id: 'goals', label: 'Goals' },
              { id: 'debts', label: 'Debts' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                sfx.playClick();
                setActiveTab(tab.id);
              }}
              className={`px-3 py-1.5 rounded-[4px] font-medium transition-colors cursor-pointer shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#1F1B16] text-[#FBF9F4]'
                  : 'text-[#6B645A] hover:text-[#1F1B16] hover:bg-[#FBF9F4]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Global Net Worth Badge */}
        <div className="flex items-center gap-2 text-[12px] tabular-nums self-end sm:self-center">
          <span className="text-[#6B645A]">Net Worth:</span>
          <span className="font-serif text-[16px] font-medium text-[#1F1B16]">
            {formatCurrency(netWorth, currencySymbol, numberGrouping)}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SUMMARY                                                            */}
      {/* ========================================================================= */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Net Worth */}
            <div className="bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-5 flex flex-col justify-between">
              <span className="text-[13px] font-medium text-[#6B645A]">Current Net Worth</span>
              <div className="my-2">
                <div className="font-serif text-[32px] font-normal text-[#1F1B16] tabular-nums leading-none">
                  {formatCurrency(netWorth, currencySymbol, numberGrouping)}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[12px] tabular-nums">
                  <span
                    className={
                      netWorthDelta >= 0 ? 'text-[#3F6B4F] font-medium' : 'text-[#9C3D2A] font-medium'
                    }
                  >
                    {netWorthDelta >= 0 ? '+' : ''}
                    {formatCurrency(netWorthDelta, currencySymbol, numberGrouping)} ({netWorthDeltaPercent}%)
                  </span>
                  <span className="text-[#6B645A]">vs last month</span>
                </div>
              </div>
              <div className="pt-2 border-t border-[#E4DED2] text-[12px] text-[#6B645A] flex items-center justify-between">
                <span>Assets: {formatCurrency(assets, currencySymbol, numberGrouping)}</span>
                <span>Liabilities: {formatCurrency(liabilities, currencySymbol, numberGrouping)}</span>
              </div>
            </div>

            {/* This Month's Income & Inflow */}
            <div className="bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-5 flex flex-col justify-between">
              <span className="text-[13px] font-medium text-[#6B645A]">October Cash Flow</span>
              <div className="my-2 space-y-1">
                <div className="flex items-center justify-between text-[13px] tabular-nums">
                  <span className="text-[#6B645A]">Income Received</span>
                  <span className="font-serif text-[18px] text-[#3F6B4F]">
                    +{formatCurrency(cashFlow.income, currencySymbol, numberGrouping)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[13px] tabular-nums">
                  <span className="text-[#6B645A]">Expenses Incurred</span>
                  <span className="font-serif text-[18px] text-[#1F1B16]">
                    -{formatCurrency(cashFlow.expenses, currencySymbol, numberGrouping)}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-[#E4DED2] text-[12px] text-[#1F1B16] flex items-center justify-between font-medium">
                <span>Net Savings</span>
                <span className={`tabular-nums ${cashFlow.net >= 0 ? 'text-[#3F6B4F]' : 'text-[#9C3D2A]'}`}>
                  {cashFlow.net >= 0 ? '+' : ''}
                  {formatCurrency(cashFlow.net, currencySymbol, numberGrouping)}
                </span>
              </div>
            </div>

            {/* Total Balance & Allocations */}
            <div className="bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-5 flex flex-col justify-between">
              <span className="text-[13px] font-medium text-[#6B645A]">Active Allocations</span>
              <div className="my-2 space-y-2">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#6B645A]">Active Accounts</span>
                  <span className="font-serif text-[18px] text-[#1F1B16] tabular-nums">
                    {accounts.filter((a) => !a.archived).length} accounts
                  </span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#6B645A]">Active Goals</span>
                  <span className="font-serif text-[18px] text-[#1F1B16] tabular-nums">
                    {savingsGoals.length} milestones
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-[#E4DED2] text-[12px] text-[#6B645A] flex items-center justify-between">
                <span>Outstanding Debts</span>
                <span className="font-serif text-[#1F1B16] tabular-nums">
                  {formatCurrency(
                    debts.reduce((sum, d) => sum + deriveDebtBalance(d, transactions).remaining, 0),
                    currencySymbol,
                    numberGrouping
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Net Worth Line Chart */}
          <div className="bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4DED2]">
              <div>
                <h3 className="font-serif text-[18px] font-normal text-[#1F1B16]">
                  Net Worth Trajectory
                </h3>
                <p className="text-[12px] text-[#6B645A] mt-0.5">
                  Monthly snapshot progression derived on the 1st of each calendar month.
                </p>
              </div>
              <span className="text-[11px] tabular-nums text-[#6B645A] px-2 py-0.5 rounded-[4px] bg-[#EFEAE0] border border-[#E4DED2]">
                {snapshots.length} monthly snapshots
              </span>
            </div>

            {/* SVG Visual Progression */}
            <div className="pt-2">
              <div className="h-56 w-full flex items-end gap-2 relative">
                {snapshots.map((s) => {
                  const sNetWorth = s.assets - s.liabilities;
                  const maxNet = Math.max(...snapshots.map((sn) => sn.assets - sn.liabilities), 1000000);
                  const minNet = Math.min(...snapshots.map((sn) => sn.assets - sn.liabilities), 0);
                  const range = maxNet - minNet || 1;
                  const heightPercent = Math.max(15, Math.min(100, Math.round(((sNetWorth - minNet) / range) * 100)));

                  return (
                    <div
                      key={s.date}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Hover Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-10 bg-[#1F1B16] text-[#FBF9F4] text-[11px] px-2 py-1 rounded-[4px] whitespace-nowrap pointer-events-none tabular-nums shadow-sm">
                        <div>{s.date}: {formatCurrency(sNetWorth, currencySymbol, numberGrouping)}</div>
                        <div className="text-[10px] text-[#E4DED2]">Assets: {formatCurrency(s.assets, currencySymbol, numberGrouping)}</div>
                      </div>

                      {/* Bar / Pillar Element */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[48px] bg-[#EFEAE0] border border-[#E4DED2] group-hover:bg-[#1F1B16] group-hover:border-[#1F1B16] transition-colors rounded-[3px]"
                      />

                      {/* X-axis label */}
                      <span className="text-[11px] text-[#6B645A] mt-2 tabular-nums">
                        {s.date.slice(5, 7)}/{s.date.slice(2, 4)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ACCOUNTS                                                           */}
      {/* ========================================================================= */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-[20px] font-normal text-[#1F1B16]">
              Financial Accounts & Vaults
            </h3>
            <button
              type="button"
              onClick={() => setIsAddAccountOpen(true)}
              className="editorial-btn-primary"
            >
              Add Account
            </button>
          </div>

          {/* 1. Asset Accounts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#E4DED2]">
              <span className="text-[12px] uppercase tracking-wider font-medium text-[#6B645A]">
                Assets ({assetAccounts.length})
              </span>
              <span className="text-[12px] font-serif tabular-nums text-[#1F1B16]">
                Total: {formatCurrency(assets, currencySymbol, numberGrouping)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {assetAccounts.map((acc) => {
                const Icon = ACCOUNT_TYPE_ICONS[acc.type] || Building;
                const bal = accountBalances[acc.id] ?? deriveAccountBalance(acc, transactions);
                const txCount = transactions.filter((t) => t.account_id === acc.id).length;

                return (
                  <div
                    key={acc.id}
                    className="p-4 rounded-[6px] border border-[#E4DED2] bg-[#FBF9F4] flex flex-col justify-between hover:border-[#1F1B16] transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-[4px] bg-[#EFEAE0] text-[#6B645A] border border-[#E4DED2] flex items-center gap-1">
                          <Icon className="w-3 h-3" />
                          <span>{ACCOUNT_TYPE_LABELS[acc.type]}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] tabular-nums text-[#6B645A]">
                            {txCount} transactions
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              sfx.playClick();
                              if (confirm(`Delete account "${acc.name}"?`)) {
                                onDeleteAccount(acc.id);
                              }
                            }}
                            title="Delete account"
                            className="p-1 rounded text-[#6B645A] hover:text-[#9C3D2A] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-serif text-[17px] font-medium text-[#1F1B16]">
                        {acc.name}
                      </h4>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E4DED2] flex items-baseline justify-between">
                      <span className="text-[11px] text-[#6B645A]">
                        Opening: {formatCurrency(acc.opening_balance, currencySymbol, numberGrouping)}
                      </span>
                      <div className="font-serif text-[20px] font-medium text-[#1F1B16] tabular-nums">
                        {formatCurrency(bal, currencySymbol, numberGrouping)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Liability Accounts */}
          {liabilityAccounts.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-[#E4DED2]">
              <div className="flex items-center justify-between pb-1 border-b border-[#E4DED2]">
                <span className="text-[12px] uppercase tracking-wider font-medium text-[#9C3D2A]">
                  Liabilities & Credit ({liabilityAccounts.length})
                </span>
                <span className="text-[12px] font-serif tabular-nums text-[#9C3D2A]">
                  Balance Owed
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {liabilityAccounts.map((acc) => {
                  const Icon = ACCOUNT_TYPE_ICONS[acc.type] || CreditCard;
                  const bal = accountBalances[acc.id] ?? deriveAccountBalance(acc, transactions);

                  return (
                    <div
                      key={acc.id}
                      className="p-4 rounded-[6px] border border-[#E4DED2] bg-[#FBF9F4] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-[4px] bg-[#F6F2EA] text-[#9C3D2A] border border-[#9C3D2A]/30 flex items-center gap-1">
                            <Icon className="w-3 h-3" />
                            <span>{ACCOUNT_TYPE_LABELS[acc.type]}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              sfx.playClick();
                              if (confirm(`Delete account "${acc.name}"?`)) {
                                onDeleteAccount(acc.id);
                              }
                            }}
                            title="Delete account"
                            className="p-1 rounded text-[#6B645A] hover:text-[#9C3D2A] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h4 className="font-serif text-[17px] font-medium text-[#1F1B16]">
                          {acc.name}
                        </h4>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#E4DED2] flex items-baseline justify-between">
                        <span className="text-[11px] text-[#6B645A]">Outstanding Liability</span>
                        <div className="font-serif text-[20px] font-medium text-[#9C3D2A] tabular-nums">
                          {formatCurrency(bal, currencySymbol, numberGrouping)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TRANSACTIONS                                                       */}
      {/* ========================================================================= */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Fast Add Form */}
          <form
            onSubmit={handleFastAddTransaction}
            className="p-4 rounded-[6px] bg-[#FBF9F4] border border-[#E4DED2] space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-serif text-[16px] text-[#1F1B16]">Fast Record</span>
              <div className="flex items-center gap-1.5">
                {(['expense', 'income', 'transfer'] as TransactionType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFastType(t)}
                    className={`px-2.5 py-0.5 rounded-[4px] text-[12px] capitalize transition-colors cursor-pointer ${
                      fastType === t
                        ? 'bg-[#1F1B16] text-[#FBF9F4]'
                        : 'bg-[#F6F2EA] text-[#6B645A] border border-[#E4DED2]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
              {/* Amount */}
              <div>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  placeholder="Amount"
                  value={fastAmount}
                  onChange={(e) => setFastAmount(e.target.value)}
                  className="ship-input w-full text-[13px] tabular-nums"
                />
              </div>

              {/* Source Account */}
              <div>
                <CustomSelect
                  value={effectiveFastAccount}
                  options={accounts.map((a) => ({ id: a.id, label: a.name }))}
                  onChange={(val) => setFastAccount(val)}
                  buttonClassName="py-1.5 text-[13px]"
                />
              </div>

              {/* Destination Account (if transfer) or Category */}
              {fastType === 'transfer' ? (
                <div>
                  <CustomSelect
                    value={effectiveTransferDest}
                    options={accounts
                      .filter((a) => a.id !== effectiveFastAccount)
                      .map((a) => ({ id: a.id, label: `To: ${a.name}` }))}
                    onChange={(val) => setTransferDestAccount(val)}
                    buttonClassName="py-1.5 text-[13px]"
                  />
                </div>
              ) : (
                <div>
                  <CustomSelect
                    value={effectiveFastCategory}
                    options={[
                      { id: '', label: 'Uncategorized' },
                      ...financeCategories.map((c) => ({ id: c.id, label: c.name })),
                    ]}
                    onChange={(val) => setFastCategory(val)}
                    buttonClassName="py-1.5 text-[13px]"
                  />
                </div>
              )}

              {/* Date */}
              <div>
                <input
                  type="date"
                  required
                  value={fastDate}
                  onChange={(e) => setFastDate(e.target.value)}
                  className="ship-input w-full text-[13px] tabular-nums"
                />
              </div>

              {/* Note */}
              <div className="lg:col-span-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Note or purpose..."
                  value={fastNote}
                  onChange={(e) => setFastNote(e.target.value)}
                  className="ship-input flex-1 text-[13px]"
                />
                <button type="submit" className="editorial-btn-primary shrink-0">
                  Record
                </button>
              </div>
            </div>
          </form>

          {/* Filters & Search Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-44">
                <CustomSelect
                  value={txAccountFilter}
                  options={[
                    { id: 'ALL', label: 'All Accounts' },
                    ...accounts.map((a) => ({ id: a.id, label: a.name })),
                  ]}
                  onChange={(val) => setTxAccountFilter(val)}
                  buttonClassName="py-1 text-[12px]"
                />
              </div>

              <div className="w-44">
                <CustomSelect
                  value={txCategoryFilter}
                  options={[
                    { id: 'ALL', label: 'All Categories' },
                    ...financeCategories.map((c) => ({ id: c.id, label: c.name })),
                  ]}
                  onChange={(val) => setTxCategoryFilter(val)}
                  buttonClassName="py-1 text-[12px]"
                />
              </div>

              <div className="inline-flex p-0.5 bg-[#EFEAE0] rounded-[4px] border border-[#E4DED2]">
                {(['ALL', 'expense', 'income', 'transfer'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTxTypeFilter(t)}
                    className={`px-2 py-0.5 rounded-[3px] text-[11px] capitalize cursor-pointer ${
                      txTypeFilter === t
                        ? 'bg-[#FBF9F4] text-[#1F1B16] font-medium'
                        : 'text-[#6B645A]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full sm:w-60">
              <input
                type="text"
                placeholder="Search transactions..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="w-full px-3 py-1 bg-[#FBF9F4] border border-[#E4DED2] rounded-[4px] text-[13px] text-[#1F1B16] focus:outline-none focus:border-[#1F1B16]"
              />
            </div>
          </div>

          {/* Dense Transactions Table */}
          <div className="border border-[#E4DED2] rounded-[6px] overflow-hidden bg-[#FBF9F4]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[#E4DED2] bg-[#F6F2EA] text-[#6B645A] font-medium text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Account</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Note / Linked Item</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4DED2]">
                  {filteredTx.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#6B645A]">
                        No transactions recorded matching this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTx.map((tx) => {
                      const acc = accounts.find((a) => a.id === tx.account_id);
                      const cat = financeCategories.find((c) => c.id === tx.category_id);
                      const linkedItem = items.find((i) => i.id === tx.item_id);

                      return (
                        <tr key={tx.id} className="hover:bg-[#F6F2EA]/60 transition-colors">
                          <td className="py-2 px-3 font-mono text-[12px] text-[#6B645A] tabular-nums whitespace-nowrap">
                            {tx.date}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`text-[10px] uppercase font-medium px-1.5 py-0.5 rounded-[3px] border ${
                                tx.type === 'income'
                                  ? 'bg-[#3F6B4F]/10 text-[#3F6B4F] border-[#3F6B4F]/30'
                                  : tx.type === 'transfer'
                                  ? 'bg-[#2D4A6B]/10 text-[#2D4A6B] border-[#2D4A6B]/30'
                                  : 'bg-[#EFEAE0] text-[#1F1B16] border-[#E4DED2]'
                              }`}
                            >
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-[#1F1B16] font-medium whitespace-nowrap">
                            {acc?.name || 'Account'}
                          </td>
                          <td className="py-2 px-3 text-[#6B645A] whitespace-nowrap">
                            {cat?.name || '—'}
                          </td>
                          <td className="py-2 px-3 text-[#1F1B16]">
                            <div className="flex items-center gap-2">
                              {linkedItem && (
                                <div
                                  className="w-4 h-4 rounded-[3px] border border-[#E4DED2] bg-[#EFEAE0] flex items-center justify-center overflow-hidden shrink-0"
                                  title={`Linked to: ${linkedItem.name}`}
                                >
                                  {linkedItem.imageUrl ? (
                                    <img
                                      src={linkedItem.imageUrl}
                                      alt={linkedItem.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="font-serif text-[9px] font-medium text-[#1F1B16]">
                                      {(linkedItem.name || '?')[0].toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              )}
                              <span className="truncate max-w-xs">{tx.note || '—'}</span>
                            </div>
                          </td>
                          <td
                            className={`py-2 px-3 text-right font-serif tabular-nums font-medium whitespace-nowrap ${
                              tx.type === 'income' ? 'text-[#3F6B4F]' : 'text-[#1F1B16]'
                            }`}
                          >
                            {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                            {formatCurrency(tx.amount, currencySymbol, numberGrouping)}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                sfx.playClick();
                                onDeleteTransaction(tx.id);
                              }}
                              className="p-1 text-[#6B645A] hover:text-[#9C3D2A] transition-colors cursor-pointer"
                              title="Delete transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GOALS                                                              */}
      {/* ========================================================================= */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-[20px] font-normal text-[#1F1B16]">
                Target Endowments & Savings Goals
              </h3>
              <p className="text-[12px] text-[#6B645A] mt-0.5">
                Progress derived directly from dedicated account balances and earmarked transactions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddGoalOpen(true)}
              className="editorial-btn-primary"
            >
              Add Goal
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savingsGoals.map((goal) => {
              const acc = accounts.find((a) => a.id === goal.account_id);
              const { current, target, percent } = deriveGoalProgress(goal, acc, transactions);
              const linkedWishlistItem = items.find((i) => i.id === goal.wishlist_item_id);

              return (
                <div
                  key={goal.id}
                  className="p-5 rounded-[6px] border border-[#E4DED2] bg-[#FBF9F4] flex flex-col justify-between space-y-4 hover:border-[#1F1B16] transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif text-[18px] font-medium text-[#1F1B16]">
                        {goal.name}
                      </h4>
                      <span className="font-serif text-[16px] font-medium text-[#1F1B16] tabular-nums">
                        {percent}%
                      </span>
                    </div>

                    {goal.target_date && (
                      <p className="text-[12px] text-[#6B645A] mt-0.5">
                        Target Date: {goal.target_date}
                      </p>
                    )}

                    {/* Linked Wishlist Item Banner */}
                    {linkedWishlistItem && (
                      <div className="mt-3 p-2.5 rounded-[4px] bg-[#F6F2EA] border border-[#E4DED2] flex items-center justify-between text-[12px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-5 h-5 rounded-[3px] border border-[#E4DED2] bg-[#EFEAE0] flex items-center justify-center shrink-0">
                            {linkedWishlistItem.imageUrl ? (
                              <img
                                src={linkedWishlistItem.imageUrl}
                                alt={linkedWishlistItem.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="font-serif text-[10px] text-[#1F1B16]">
                                {(linkedWishlistItem.name || '?')[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => onNavigateToInventory?.()}
                            className="truncate text-[#1F1B16] font-medium hover:underline cursor-pointer text-left"
                            title="View in Inventory"
                          >
                            {linkedWishlistItem.name}
                          </button>
                        </div>
                        <span className="text-[11px] tabular-nums text-[#6B645A] font-medium shrink-0">
                          Price:{' '}
                          {formatCurrency(
                            linkedWishlistItem.targetPrice || linkedWishlistItem.goldValue,
                            currencySymbol,
                            numberGrouping
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar & Amounts */}
                  <div className="space-y-2">
                    <div className="w-full h-1.5 bg-[#E4DED2] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1F1B16] transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex items-baseline justify-between text-[13px] tabular-nums">
                      <span className="font-serif text-[16px] text-[#1F1B16] font-medium">
                        {formatCurrency(current, currencySymbol, numberGrouping)}
                      </span>
                      <span className="text-[12px] text-[#6B645A]">
                        Target: {formatCurrency(target, currencySymbol, numberGrouping)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E4DED2] flex items-center justify-between text-[11px] text-[#6B645A]">
                    <span>
                      {acc ? `Linked Account: ${acc.name}` : 'Calculated via tagged transactions'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        sfx.playClick();
                        onDeleteSavingsGoal(goal.id);
                      }}
                      className="text-[#6B645A] hover:text-[#9C3D2A] cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: DEBTS                                                              */}
      {/* ========================================================================= */}
      {activeTab === 'debts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-[20px] font-normal text-[#1F1B16]">
                Outstanding Obligations & Debts
              </h3>
              <p className="text-[12px] text-[#6B645A] mt-0.5">
                Balances reduce automatically whenever a payment transaction linked to the debt is recorded.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddDebtOpen(true)}
              className="editorial-btn-primary"
            >
              Add Debt
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {debts.map((debt) => {
              const { remaining, paid, percent } = deriveDebtBalance(debt, transactions);

              return (
                <div
                  key={debt.id}
                  className="p-5 rounded-[6px] border border-[#E4DED2] bg-[#FBF9F4] flex flex-col justify-between space-y-4 hover:border-[#1F1B16] transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-serif text-[18px] font-medium text-[#1F1B16]">
                          {debt.name}
                        </h4>
                        <span className="text-[12px] text-[#6B645A]">
                          Lender: {debt.lender} {debt.interest_rate ? `• ${debt.interest_rate}% APR` : ''}
                        </span>
                      </div>
                      <span className="font-serif text-[16px] font-medium text-[#3F6B4F] tabular-nums">
                        {percent}% Paid
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar & Balances */}
                  <div className="space-y-2">
                    <div className="w-full h-1.5 bg-[#E4DED2] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#3F6B4F] transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex items-baseline justify-between text-[13px] tabular-nums">
                      <div>
                        <span className="text-[11px] text-[#6B645A] block">Remaining Owed</span>
                        <span className="font-serif text-[20px] text-[#9C3D2A] font-medium">
                          {formatCurrency(remaining, currencySymbol, numberGrouping)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-[#6B645A] block">
                          Paid: {formatCurrency(paid, currencySymbol, numberGrouping)}
                        </span>
                        <span className="text-[13px] text-[#1F1B16]">
                          of {formatCurrency(debt.principal, currencySymbol, numberGrouping)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E4DED2] flex items-center justify-between">
                    <div className="text-[12px] text-[#6B645A]">
                      {debt.minimum_payment && (
                        <span>
                          Min Installment: {formatCurrency(debt.minimum_payment, currencySymbol, numberGrouping)}
                        </span>
                      )}
                      {debt.due_day && <span> (Due {debt.due_day}th)</span>}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActivePayDebt(debt);
                          setPayDebtAmount(String(debt.minimum_payment || remaining));
                        }}
                        className="editorial-btn-primary py-1 px-3 text-[12px]"
                      >
                        Log Payment
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          sfx.playClick();
                          onDeleteDebt(debt.id);
                        }}
                        className="p-1 text-[#6B645A] hover:text-[#9C3D2A]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD ACCOUNT                                                        */}
      {/* ========================================================================= */}
      {isAddAccountOpen && (
        <div
          onClick={() => setIsAddAccountOpen(false)}
          className="fixed inset-0 z-50 bg-[#1F1B16]/30 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-6 cursor-default space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4DED2]">
              <h3 className="font-serif text-[18px] text-[#1F1B16]">Add Financial Account</h3>
              <button
                type="button"
                onClick={() => setIsAddAccountOpen(false)}
                className="p-1 text-[#6B645A] hover:text-[#1F1B16]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-[#1F1B16] mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HSBC Primary, bKash Personal, Vanguard Index..."
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="ship-input w-full text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#1F1B16] mb-1">Type</label>
                <CustomSelect
                  value={newAccType}
                  options={(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((t) => ({
                    id: t,
                    label: ACCOUNT_TYPE_LABELS[t],
                  }))}
                  onChange={(val) => setNewAccType(val as AccountType)}
                  buttonClassName="py-1.5 text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#1F1B16] mb-1">
                  Opening Balance
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={newAccOpening}
                  onChange={(e) => setNewAccOpening(e.target.value)}
                  className="ship-input w-full text-[13px] tabular-nums"
                />
              </div>

              <div className="pt-3 border-t border-[#E4DED2] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAccountOpen(false)}
                  className="editorial-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="editorial-btn-primary">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD SAVINGS GOAL                                                   */}
      {/* ========================================================================= */}
      {isAddGoalOpen && (
        <div
          onClick={() => setIsAddGoalOpen(false)}
          className="fixed inset-0 z-50 bg-[#1F1B16]/30 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-6 cursor-default space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4DED2]">
              <h3 className="font-serif text-[18px] text-[#1F1B16]">Add Savings Goal</h3>
              <button
                type="button"
                onClick={() => setIsAddGoalOpen(false)}
                className="p-1 text-[#6B645A] hover:text-[#1F1B16]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-[#1F1B16] mb-1">Goal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hajj Fund, Studio Upgrade, 6-Month Emergency..."
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="ship-input w-full text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#1F1B16] mb-1">
                  Target Amount
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  className="ship-input w-full text-[13px] tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#1F1B16] mb-1">
                  Target Date (Optional)
                </label>
                <input
                  type="date"
                  value={goalDate}
                  onChange={(e) => setGoalDate(e.target.value)}
                  className="ship-input w-full text-[13px] tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#1F1B16] mb-1">
                  Dedicated Account (Optional)
                </label>
                <CustomSelect
                  value={goalAccountId}
                  options={[
                    { id: '', label: 'None (Compute from tagged transactions)' },
                    ...accounts.map((a) => ({ id: a.id, label: a.name })),
                  ]}
                  onChange={(val) => setGoalAccountId(val)}
                  buttonClassName="py-1.5 text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#1F1B16] mb-1">
                  Link to Wishlist Item (Optional)
                </label>
                <CustomSelect
                  value={goalWishlistId}
                  options={[
                    { id: '', label: 'None' },
                    ...items
                      .filter((i) => i.ownershipStatus === 'wishlist')
                      .map((i) => ({
                        id: i.id,
                        label: `${i.name} (${formatCurrency(i.targetPrice || i.goldValue, currencySymbol, numberGrouping)})`,
                      })),
                  ]}
                  onChange={(val) => {
                    setGoalWishlistId(val);
                    const item = items.find((i) => i.id === val);
                    if (item && !goalTarget) {
                      setGoalTarget(String(item.targetPrice || item.goldValue || ''));
                      if (!goalName) setGoalName(`Acquisition: ${item.name}`);
                    }
                  }}
                  buttonClassName="py-1.5 text-[13px]"
                />
              </div>

              <div className="pt-3 border-t border-[#E4DED2] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddGoalOpen(false)}
                  className="editorial-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="editorial-btn-primary">
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD DEBT                                                           */}
      {/* ========================================================================= */}
      {isAddDebtOpen && (
        <div
          onClick={() => setIsAddDebtOpen(false)}
          className="fixed inset-0 z-50 bg-[#1F1B16]/30 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-6 cursor-default space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4DED2]">
              <h3 className="font-serif text-[18px] text-[#1F1B16]">Add Debt Obligation</h3>
              <button
                type="button"
                onClick={() => setIsAddDebtOpen(false)}
                className="p-1 text-[#6B645A] hover:text-[#1F1B16]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDebt} className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-[#1F1B16] mb-1">
                  Obligation Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Higher Studies Loan, Personal Family Debt..."
                  value={debtName}
                  onChange={(e) => setDebtName(e.target.value)}
                  className="ship-input w-full text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#1F1B16] mb-1">
                  Lender / Entity
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elder Council, Bank, Colleague"
                  value={debtLender}
                  onChange={(e) => setDebtLender(e.target.value)}
                  className="ship-input w-full text-[13px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[12px] font-medium text-[#1F1B16] mb-1">
                    Principal Amount
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0"
                    value={debtPrincipal}
                    onChange={(e) => setDebtPrincipal(e.target.value)}
                    className="ship-input w-full text-[13px] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#1F1B16] mb-1">
                    Interest Rate % (Opt)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.0"
                    value={debtInterest}
                    onChange={(e) => setDebtInterest(e.target.value)}
                    className="ship-input w-full text-[13px] tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[12px] font-medium text-[#1F1B16] mb-1">
                    Min Payment (Opt)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={debtMinPayment}
                    onChange={(e) => setDebtMinPayment(e.target.value)}
                    className="ship-input w-full text-[13px] tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#1F1B16] mb-1">
                    Due Day of Month (Opt)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="1 - 31"
                    value={debtDueDay}
                    onChange={(e) => setDebtDueDay(e.target.value)}
                    className="ship-input w-full text-[13px] tabular-nums"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E4DED2] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDebtOpen(false)}
                  className="editorial-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="editorial-btn-primary">
                  Save Debt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LOG DEBT PAYMENT                                                   */}
      {/* ========================================================================= */}
      {activePayDebt && (
        <div
          onClick={() => setActivePayDebt(null)}
          className="fixed inset-0 z-50 bg-[#1F1B16]/30 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-6 cursor-default space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4DED2]">
              <div>
                <h3 className="font-serif text-[18px] text-[#1F1B16]">
                  Record Debt Payment
                </h3>
                <span className="text-[12px] text-[#6B645A]">
                  {activePayDebt.name} • {activePayDebt.lender}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActivePayDebt(null)}
                className="p-1 text-[#6B645A] hover:text-[#1F1B16]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogDebtPayment} className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-[#1F1B16] mb-1">
                  Payment Amount
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0"
                  value={payDebtAmount}
                  onChange={(e) => setPayDebtAmount(e.target.value)}
                  className="ship-input w-full text-[13px] tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#1F1B16] mb-1">
                  Pay From Account
                </label>
                <CustomSelect
                  value={effectivePayDebtAccount}
                  options={accounts.map((a) => ({ id: a.id, label: a.name }))}
                  onChange={(val) => setPayDebtAccountId(val)}
                  buttonClassName="py-1.5 text-[13px]"
                />
              </div>

              <p className="text-[11px] text-[#6B645A] leading-relaxed">
                This writes a verified expense transaction linked directly to this debt obligation and automatically reduces its outstanding principal.
              </p>

              <div className="pt-3 border-t border-[#E4DED2] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActivePayDebt(null)}
                  className="editorial-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="editorial-btn-primary">
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
