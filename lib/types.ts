export type Transaction = {
  id: string;
  merchant_id?: string | null;
  category_id?: string | null;
  account_id?: string | null;
  merchant: string;
  notes?: string | null;
  description?: string | null;
  category: string;
  amount: number;
  date: string;
  status: "cleared" | "pending";
  loan_id?: string | null;
};

export type TransactionItem = {
  id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

export type Loan = {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  lender: string;
  principal_amount: number;
  outstanding_balance: number;
  status: "active" | "paid" | "closed";
  date_started: string;
  notes?: string | null;
  created_at?: string;
  /** The disbursement transaction that deposited the principal into an account, if any. */
  transaction_id?: string | null;
};

export type LoanPayment = {
  id: string;
  loan_id: string;
  workspace_id: string;
  user_id: string;
  amount: number;
  date: string;
  notes?: string | null;
  created_at?: string;
  /** The repayment transaction that drew this amount from an account, if any. */
  transaction_id?: string | null;
};

export type Account = {
  id: string;
  name: string;
  account_type: string;
  balance: number;
  starting_balance: number;
  institution: string | null;
  last_synced_at: string | null;
};

export type Workspace = {
  id: string;
  name: string;
  owner_id?: string;
  workspace_type: "personal" | "household" | "business";
  base_currency: string;
  created_at?: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url?: string | null;
  email?: string | null;
};
