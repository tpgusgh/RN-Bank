import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/app/contexts/AuthContext';
import { fetchTransactions, TransactionWithCategory } from '@/lib/api';

export default function HomeScreen() {
  const { token, user } = useAuth();
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState({
    income: 0,
    expense: 0,
    total: 0,
  });

  const [selectedMonth, setSelectedMonth] = useState(new Date()); // 현재 선택된 월

  const loadTransactions = async () => {

    try {
      const data = await fetchTransactions(token);
      setTransactions(data);
      calculateMonthlyStats(data, selectedMonth);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateMonthlyStats = (data: TransactionWithCategory[], month: Date) => {
    let income = 0;
    let expense = 0;

    data.forEach((t) => {
      const tDate = new Date(t.transaction_date);
      if (tDate.getMonth() === month.getMonth() && tDate.getFullYear() === month.getFullYear()) {
        if (t.category?.type === 'income') {
          income += Number(t.amount);
        } else {
          expense += Number(t.amount);
        }
      }
    });

    setMonthlyStats({
      income,
      expense,
      total: income - expense,
    });
  };

  useEffect(() => {
    loadTransactions();
  }, [user, selectedMonth]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString('ko-KR')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(selectedMonth.getMonth() + offset);
    setSelectedMonth(newDate);
  };

  // 해당 월의 거래만 필터링
  const filteredTransactions = transactions.filter(t => {
    const tDate = new Date(t.transaction_date);
    return tDate.getMonth() === selectedMonth.getMonth() && tDate.getFullYear() === selectedMonth.getFullYear();
  });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>가계부</Text>

        {/* 월 변경 UI */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={() => changeMonth(-1)}>
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>

          <Text style={styles.headerSubtitle}>
            {selectedMonth.getFullYear()}년 {selectedMonth.getMonth() + 1}월
          </Text>

          <TouchableOpacity onPress={() => changeMonth(1)}>
            <ChevronRight size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* STATS */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.incomeCard]}>
          <TrendingUp size={24} color="#10B981" />
          <Text style={styles.statLabel}>수익</Text>
          <Text style={[styles.statAmount, styles.incomeText]}>
            {formatCurrency(monthlyStats.income)}
          </Text>
        </View>

        <View style={[styles.statCard, styles.expenseCard]}>
          <TrendingDown size={24} color="#EF4444" />
          <Text style={styles.statLabel}>지출</Text>
          <Text style={[styles.statAmount, styles.expenseText]}>
            {formatCurrency(monthlyStats.expense)}
          </Text>
        </View>

        <View style={[styles.statCard, styles.totalCard]}>
          <Wallet size={24} color="#3B82F6" />
          <Text style={styles.statLabel}>총합</Text>
          <Text style={[styles.statAmount, styles.totalText]}>
            {formatCurrency(monthlyStats.total)}
          </Text>
        </View>
      </View>

      {/* CHART */}
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>수익 vs 지출</Text>
        </View>
        <View style={styles.barChart}>
          <View style={styles.barWrapper}>
            <View
              style={[
                styles.bar,
                styles.incomeBar,
                {
                  height:
                    Math.max(monthlyStats.income, monthlyStats.expense) > 0
                      ? (monthlyStats.income /
                          Math.max(monthlyStats.income, monthlyStats.expense)) *
                        150
                      : 0,
                },
              ]}
            />
            <Text style={styles.barLabel}>수익</Text>
          </View>
          <View style={styles.barWrapper}>
            <View
              style={[
                styles.bar,
                styles.expenseBar,
                {
                  height:
                    Math.max(monthlyStats.income, monthlyStats.expense) > 0
                      ? (monthlyStats.expense /
                          Math.max(monthlyStats.income, monthlyStats.expense)) *
                        150
                      : 0,
                },
              ]}
            />
            <Text style={styles.barLabel}>지출</Text>
          </View>
        </View>
      </View>

      {/* TRANSACTIONS */}
      <View style={styles.transactionsContainer}>
        <Text style={styles.sectionTitle}>최근 거래</Text>
        {filteredTransactions.length === 0 ? (
          <Text style={styles.emptyText}>거래 내역이 없습니다</Text>
        ) : (
          filteredTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View
                style={[
                  styles.categoryDot,
                  { backgroundColor: transaction.category?.color || '#6B7280' },
                ]}
              />
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionDescription}>
                  {transaction.description || '거래'}
                </Text>
                <Text style={styles.transactionCategory}>
                  {transaction.category?.name || '카테고리 없음'} •{' '}
                  {formatDate(transaction.transaction_date)}
                </Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  transaction.category?.type === 'income'
                    ? styles.incomeText
                    : styles.expenseText,
                ]}
              >
                {transaction.category?.type === 'income' ? '+' : '-'}
                {formatCurrency(Number(transaction.amount))}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#FFFFFF', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  headerSubtitle: { fontSize: 16, color: '#6B7280' },
  statsContainer: { padding: 16, gap: 12 },
  statCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  incomeCard: { borderLeftWidth: 4, borderLeftColor: '#10B981' },
  expenseCard: { borderLeftWidth: 4, borderLeftColor: '#EF4444' },
  totalCard: { borderLeftWidth: 4, borderLeftColor: '#3B82F6' },
  statLabel: { fontSize: 14, color: '#6B7280', flex: 1 },
  statAmount: { fontSize: 20, fontWeight: 'bold' },
  incomeText: { color: '#10B981' },
  expenseText: { color: '#EF4444' },
  totalText: { color: '#3B82F6' },
  chartContainer: { backgroundColor: '#FFFFFF', margin: 16, marginTop: 0, borderRadius: 16, padding: 20 },
  chartHeader: { marginBottom: 20 },
  chartTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  barChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 180, paddingBottom: 30 },
  barWrapper: { alignItems: 'center', gap: 8 },
  bar: { width: 80, borderRadius: 8, minHeight: 10 },
  incomeBar: { backgroundColor: '#10B981' },
  expenseBar: { backgroundColor: '#EF4444' },
  barLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  transactionsContainer: { backgroundColor: '#FFFFFF', margin: 16, marginTop: 0, borderRadius: 16, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 16 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  categoryDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  transactionInfo: { flex: 1 },
  transactionDescription: { fontSize: 16, color: '#1F2937', fontWeight: '500', marginBottom: 4 },
  transactionCategory: { fontSize: 13, color: '#9CA3AF' },
  transactionAmount: { fontSize: 16, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 14, paddingVertical: 20 },
});
