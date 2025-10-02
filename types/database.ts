export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  description: string;
  transaction_date: string;
  created_at: string;
}

export interface TransactionWithCategory extends Transaction {
  category: Category | null;
}
