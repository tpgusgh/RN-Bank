export interface TransactionWithCategory {
  id: string;
  user_id: string;
  amount: number;
  description?: string;
  transaction_date: string;
  category?: {
    id: string;
    name: string;
    type: 'income' | 'expense';
    color: string;
  };
}

export interface MonthlyStats {
  income: number;
  expense: number;
  total: number;
}

const API_BASE_URL = "https://api2.mieung.kr"; // 🔹 실제 API URL로 변경
export async function fetchTransactions(token: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const response = await fetch(
    `${API_BASE_URL}/transactions/?start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`,
    {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.status}`);
  }

  return response.json() as Promise<TransactionWithCategory[]>;
}
