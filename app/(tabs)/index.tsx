import { useState, useEffect, useCallback } from 'react';
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
import { useFocusEffect } from 'expo-router';

import * as XLSX from "xlsx";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";


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

  const [selectedMonth, setSelectedMonth] = useState(new Date());

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

  const filteredTransactions = transactions.filter(t => {
    const tDate = new Date(t.transaction_date);
    return tDate.getMonth() === selectedMonth.getMonth() && tDate.getFullYear() === selectedMonth.getFullYear();
  });

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
      setSelectedMonth(new Date()); 
    }, [token])
  );

const exportToExcel = async () => {
  try {
    const filename = `${selectedMonth.getFullYear()}-${selectedMonth.getMonth() + 1}-거래내역.xlsx`;
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;

    // 전체 거래내역 준비
    const sheetData = filteredTransactions.map(t => ({
      날짜: t.transaction_date,
      설명: t.description || "거래",
      카테고리: t.category?.name || "카테고리 없음",
      유형: t.category?.type === "income" ? "수익" : "지출",
      금액: Number(t.amount)
    }));

    // 수익/지출 분류
    const incomeTransactions = filteredTransactions.filter(t => t.category?.type === "income");
    const expenseTransactions = filteredTransactions.filter(t => t.category?.type === "expense");

    const incomeTotal = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const expenseTotal = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    // 카테고리별 합계 계산
    const calcCategoryTotals = (transactions: any[]) => {
      const totals: Record<string, number> = {};
      transactions.forEach(t => {
        const categoryName = t.category?.name || "카테고리 없음";
        totals[categoryName] = (totals[categoryName] || 0) + Number(t.amount);
      });
      return Object.entries(totals).map(([category, amount]) => ({
        카테고리: category,
        합계금액: amount
      }));
    };

    const expenseCategoryTotals = calcCategoryTotals(expenseTransactions);
    const incomeCategoryTotals = calcCategoryTotals(incomeTransactions);

    // 시트 생성
    const wb = XLSX.utils.book_new();

    // 1. 거래내역 시트
    const wsTransactions = XLSX.utils.json_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, wsTransactions, "거래내역");

    // 2. 지출 내역 시트
    const expenseSheetData = [
      ...expenseTransactions.map(t => ({
        날짜: t.transaction_date,
        설명: t.description || "거래",
        카테고리: t.category?.name || "카테고리 없음",
        금액: Number(t.amount)
      })),
      {}, // 빈 행
      { 설명: "지출 총합계", 금액: expenseTotal },
      {}, // 빈 행
      { 설명: "지출 카테고리별 합계" },
      ...expenseCategoryTotals
    ];
    const wsExpense = XLSX.utils.json_to_sheet(expenseSheetData);
    XLSX.utils.book_append_sheet(wb, wsExpense, "지출 내역");

    // 3. 수익 내역 시트
    const incomeSheetData = [
      ...incomeTransactions.map(t => ({
        날짜: t.transaction_date,
        설명: t.description || "거래",
        카테고리: t.category?.name || "카테고리 없음",
        금액: Number(t.amount)
      })),
      {},
      { 설명: "수익 총합계", 금액: incomeTotal },
      {},
      { 설명: "수익 카테고리별 합계" },
      ...incomeCategoryTotals
    ];
    const wsIncome = XLSX.utils.json_to_sheet(incomeSheetData);
    XLSX.utils.book_append_sheet(wb, wsIncome, "수익 내역");

    // 4. 총 합계 시트
    const wsTotals = XLSX.utils.json_to_sheet([
      { 설명: "수익 총합계", 금액: incomeTotal },
      { 설명: "지출 총합계", 금액: expenseTotal },
      { 설명: "순이익(수익-지출)", 금액: incomeTotal - expenseTotal }
    ]);
    XLSX.utils.book_append_sheet(wb, wsTotals, "총 합계");

    // 엑셀 파일 저장
    const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
    await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: "base64" });

    await Sharing.shareAsync(fileUri, {
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: "거래 내역 공유",
      UTI: "com.microsoft.excel.xlsx"
    });

  } catch (error) {
    console.error("엑셀 내보내기 실패:", error);
  }
};



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

      {/* 엑셀 저장 버튼 */}
      <TouchableOpacity style={styles.exportButton} onPress={exportToExcel}>
        <Text style={styles.exportButtonText}>엑셀로 저장</Text>
      </TouchableOpacity>

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
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 220, // 기존 180에서 확장
    paddingBottom: 40, // 바 레이블 공간 확보
  },
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
  exportButton: {
  backgroundColor: "#3B82F6",
  padding: 12,
  borderRadius: 8,
  alignItems: "center",
  margin: 16,
},
exportButtonText: {
  color: "#FFFFFF",
  fontWeight: "bold",
  fontSize: 16,
},

});
