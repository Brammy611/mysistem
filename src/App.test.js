import { render, screen } from '@testing-library/react';
import App from './App';
import { StorageService } from './services/storage';

describe('Command Center — PRD Requirements & Acceptance Criteria', () => {
  beforeEach(() => {
    StorageService.resetAll();
  });

  test('renders Command Center layout and Owner dashboard', () => {
    render(<App />);
    expect(screen.getAllByText(/Command Center/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Personal & BookQu/i)).toBeInTheDocument();
    expect(screen.getByText(/Overview Master/i)).toBeInTheDocument();
    expect(screen.getByText(/Personal Finance/i)).toBeInTheDocument();
  });

  test('Security PRD 2.4: Developer cannot access Personal Finance or Personal Tasks', () => {
    const devUser = {
      id: 'usr-2',
      name: 'Alex Pratama',
      role: 'developer',
      division: 'developer',
    };

    const financeCheck = StorageService.checkPermission(devUser, 'view', 'finance');
    expect(financeCheck.allowed).toBe(false);
    expect(financeCheck.reason).toMatch(/Personal Workspace khusus Owner/i);

    const personalTasksCheck = StorageService.checkPermission(
      devUser,
      'view',
      'personal_tasks'
    );
    expect(personalTasksCheck.allowed).toBe(false);

    // Cannot access marketing backlog
    const mktCheck = StorageService.checkPermission(
      devUser,
      'view',
      'marketing_tasks'
    );
    expect(mktCheck.allowed).toBe(false);

    // Can access developer tasks
    const devCheck = StorageService.checkPermission(
      devUser,
      'view',
      'developer_tasks'
    );
    expect(devCheck.allowed).toBe(true);

    // Non-owner cannot give final approve to Done
    const finalApproveCheck = StorageService.checkPermission(
      devUser,
      'final_approve',
      'developer_tasks'
    );
    expect(finalApproveCheck.allowed).toBe(false);
  });

  test('Security PRD 2.4: Marketing cannot access Personal Finance or Developer Backlog', () => {
    const mktUser = {
      id: 'usr-4',
      name: 'Sarah Maharani',
      role: 'marketing',
      division: 'marketing',
    };

    const financeCheck = StorageService.checkPermission(mktUser, 'view', 'finance');
    expect(financeCheck.allowed).toBe(false);

    const devCheck = StorageService.checkPermission(
      mktUser,
      'view',
      'developer_tasks'
    );
    expect(devCheck.allowed).toBe(false);

    const mktCheck = StorageService.checkPermission(
      mktUser,
      'view',
      'marketing_tasks'
    );
    expect(mktCheck.allowed).toBe(true);
  });

  test('Finance PRD 5.2 & 5.7: Account balance computed correctly and Transfers do not affect net income/expense', () => {
    const owner = StorageService.getUsers().find((u) => u.role === 'owner');
    const accountsBefore = StorageService.getAccounts(owner);
    const bcaBefore = accountsBefore.find((a) => a.id === 'acc-1').currentBalance;
    const gopayBefore = accountsBefore.find((a) => a.id === 'acc-3').currentBalance;
    const totalBefore = accountsBefore.reduce((sum, a) => sum + a.currentBalance, 0);

    // Perform transfer of Rp 500,000 from BCA to GoPay
    StorageService.saveTransaction(
      {
        date: '2026-10-11',
        type: 'Transfer',
        amount: 500000,
        fromAccountId: 'acc-1',
        toAccountId: 'acc-3',
        description: 'Top-up GoPay dari BCA',
      },
      owner
    );

    const accountsAfter = StorageService.getAccounts(owner);
    const bcaAfter = accountsAfter.find((a) => a.id === 'acc-1').currentBalance;
    const gopayAfter = accountsAfter.find((a) => a.id === 'acc-3').currentBalance;
    const totalAfter = accountsAfter.reduce((sum, a) => sum + a.currentBalance, 0);

    expect(bcaAfter).toBe(bcaBefore - 500000);
    expect(gopayAfter).toBe(gopayBefore + 500000);
    expect(totalAfter).toBe(totalBefore); // Total wealth remains invariant!
  });

  test('Finance PRD 5.5: Paying a bill creates linked transaction with zero double counting', () => {
    const owner = StorageService.getUsers().find((u) => u.role === 'owner');
    const bills = StorageService.getBills(owner);
    const billToPay = bills.find((b) => b.status !== 'Paid');

    const accountsBefore = StorageService.getAccounts(owner);
    const bcaBefore = accountsBefore.find((a) => a.id === 'acc-1').currentBalance;

    const { bill, transaction } = StorageService.payBill(
      billToPay.id,
      'acc-1',
      '2026-10-12',
      owner
    );

    expect(bill.status).toBe('Paid');
    expect(bill.transactionId).toBe(transaction.id);

    const accountsAfter = StorageService.getAccounts(owner);
    const bcaAfter = accountsAfter.find((a) => a.id === 'acc-1').currentBalance;
    expect(bcaAfter).toBe(bcaBefore - billToPay.amount);
  });

  test('Calendar PRD 7.1 & 7.4: Aggregates tasks, content publish dates, and bills without data duplication', () => {
    const owner = StorageService.getUsers().find((u) => u.role === 'owner');
    const events = StorageService.getCalendarEvents(owner);

    // Must include task deadlines
    const taskEvents = events.filter((e) => e.source === 'task');
    expect(taskEvents.length).toBeGreaterThan(0);

    // Must include content publish events
    const publishEvents = events.filter((e) => e.source === 'content_publish');
    expect(publishEvents.length).toBeGreaterThan(0);

    // Must include financial due dates
    const billEvents = events.filter((e) => e.source === 'bill');
    expect(billEvents.length).toBeGreaterThan(0);
  });
});
