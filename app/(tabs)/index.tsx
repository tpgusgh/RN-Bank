import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/app/contexts/AuthContext';
import { fetchTransactions, TransactionWithCategory } from '@/lib/api';
import { useFocusEffect } from 'expo-router';
import styled from 'styled-components/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// 스타일드 컴포넌트 정의
const Container = styled(ScrollView)`
  flex: 1;
  background-color: #f8fafc;
`;

const Header = styled(View)`
  background-color: #ffffff;
  padding-top: 60px;
  padding-horizontal: 24px;
  padding-bottom: 24px;
  border-bottom-width: 1px;
  border-bottom-color: #e2e8f0;
`;

const HeaderTitle = styled(Text)`
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
`;

const HeaderSubtitle = styled(Text)`
  font-size: 16px;
  color: #64748b;
`;

const MonthSelector = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const ExportButton = styled(TouchableOpacity)`
  margin: 16px;
  border-radius: 12px;
`;

const ExportButtonText = styled(Text)`
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
`;

const StatsContainer = styled(View)`
  padding: 16px;
  gap: 12px;
`;

const StatCard = styled(View)`
  background-color: #ffffff;
  border-radius: 16px;
  padding: 20px;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.05;
  shadow-radius: 2px;
  elevation: 2;
`;

const IncomeCard = styled(StatCard)`
  border-left-width: 4px;
  border-left-color: #10b981;
`;

const ExpenseCard = styled(StatCard)`
  border-left-width: 4px;
  border-left-color: #dc2626;
`;

const TotalCard = styled(StatCard)`
  border-left-width: 4px;
  border-left-color: #2563eb;
`;

const StatLabel = styled(Text)`
  font-size: 14px;
  color: #64748b;
  flex: 1;
`;

const StatAmount = styled(Text)`
  font-size: 20px;
  font-weight: 700;
`;

const IncomeText = styled(StatAmount)`
  color: #10b981;
`;

const ExpenseText = styled(StatAmount)`
  color: #dc2626;
`;

const TotalText = styled(StatAmount)`
  color: #2563eb;
`;

const ChartContainer = styled(View)`
  background-color: #ffffff;
  margin: 16px;
  margin-top: 0;
  border-radius: 16px;
  padding: 20px;
`;

const ChartHeader = styled(View)`
  margin-bottom: 20px;
`;

const ChartTitle = styled(Text)`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
`;

const BarChart = styled(View)`
  flex-direction: row;
  justify-content: space-around;
  align-items: flex-end;
  height: 220px;
  padding-bottom: 40px;
`;

const BarWrapper = styled(View)`
  align-items: center;
  gap: 8px;
`;

const Bar = styled(View)`
  width: 80px;
  border-radius: 8px;
  min-height: 10px;
`;

const IncomeBar = styled(Bar)`
  background-color: #10b981;
`;

const ExpenseBar = styled(Bar)`
  background-color: #dc2626;
`;

const BarLabel = styled(Text)`
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
`;

const TransactionsContainer = styled(View)`
  background-color: #ffffff;
  margin: 16px;
  margin-top: 0;
  border-radius: 16px;
  padding: 20px;
`;

const SectionTitle = styled(Text)`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
`;

const TransactionItem = styled(View)`
  flex-direction: row;
  align-items: center;
  padding-vertical: 12px;
  border-bottom-width: 1px;
  border-bottom-color: #f3f4f6;
`;

const CategoryDot = styled(View)`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  margin-right: 12px;
`;

const TransactionInfo = styled(View)`
  flex: 1;
`;

const TransactionDescription = styled(Text)`
  font-size: 16px;
  color: #1e293b;
  font-weight: 500;
  margin-bottom: 4px;
`;

const TransactionCategory = styled(Text)`
  font-size: 13px;
  color: #9ca3af;
`;

const TransactionAmount = styled(Text)`
  font-size: 16px;
  font-weight: 600;
`;

const EmptyText = styled(Text)`
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  padding-vertical: 20px;
`;

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
      console.error('Failed to load transactions:', error);
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

  const filteredTransactions = transactions.filter((t) => {
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

      const sheetData = filteredTransactions.map((t) => ({
        날짜: t.transaction_date,
        설명: t.description || '거래',
        카테고리: t.category?.name || '카테고리 없음',
        유형: t.category?.type === 'income' ? '수익' : '지출',
        금액: Number(t.amount),
      }));

      const incomeTransactions = filteredTransactions.filter((t) => t.category?.type === 'income');
      const expenseTransactions = filteredTransactions.filter((t) => t.category?.type === 'expense');

      const incomeTotal = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const expenseTotal = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

      const calcCategoryTotals = (transactions: TransactionWithCategory[]) => {
        const totals: Record<string, number> = {};
        transactions.forEach((t) => {
          const categoryName = t.category?.name || '카테고리 없음';
          totals[categoryName] = (totals[categoryName] || 0) + Number(t.amount);
        });
        return Object.entries(totals).map(([category, amount]) => ({
          카테고리: category,
          합계금액: amount,
        }));
      };

      const expenseCategoryTotals = calcCategoryTotals(expenseTransactions);
      const incomeCategoryTotals = calcCategoryTotals(incomeTransactions);

      const wb = XLSX.utils.book_new();

      const wsTransactions = XLSX.utils.json_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, wsTransactions, '거래내역');

      const expenseSheetData = [
        ...expenseTransactions.map((t) => ({
          날짜: t.transaction_date,
          설명: t.description || '거래',
          카테고리: t.category?.name || '카테고리 없음',
          금액: Number(t.amount),
        })),
        {},
        { 설명: '지출 총합계', 금액: expenseTotal },
        {},
        { 설명: '지출 카테고리별 합계' },
        ...expenseCategoryTotals,
      ];
      const wsExpense = XLSX.utils.json_to_sheet(expenseSheetData);
      XLSX.utils.book_append_sheet(wb, wsExpense, '지출 내역');

      const incomeSheetData = [
        ...incomeTransactions.map((t) => ({
          날짜: t.transaction_date,
          설명: t.description || '거래',
          카테고리: t.category?.name || '카테고리 없음',
          금액: Number(t.amount),
        })),
        {},
        { 설명: '수익 총합계', 금액: incomeTotal },
        {},
        { 설명: '수익 카테고리별 합계' },
        ...incomeCategoryTotals,
      ];
      const wsIncome = XLSX.utils.json_to_sheet(incomeSheetData);
      XLSX.utils.book_append_sheet(wb, wsIncome, '수익 내역');

      const wsTotals = XLSX.utils.json_to_sheet([
        { 설명: '수익 총합계', 금액: incomeTotal },
        { 설명: '지출 총합계', 금액: expenseTotal },
        { 설명: '순이익(수익-지출)', 금액: incomeTotal - expenseTotal },
      ]);
      XLSX.utils.book_append_sheet(wb, wsTotals, '총 합계');

      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: 'base64' });

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: '거래 내역 공유',
        UTI: 'com.microsoft.excel.xlsx',
      });
    } catch (error) {
      console.error('엑셀 내보내기 실패:', error);
    }
  };

  return (
    <Container refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Header>
        <HeaderTitle>가계부</HeaderTitle>
        <MonthSelector>
          <TouchableOpacity onPress={() => changeMonth(-1)}>
            <ChevronLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <HeaderSubtitle>
            {selectedMonth.getFullYear()}년 {selectedMonth.getMonth() + 1}월
          </HeaderSubtitle>
          <TouchableOpacity onPress={() => changeMonth(1)}>
            <ChevronRight size={24} color="#1e293b" />
          </TouchableOpacity>
        </MonthSelector>
      </Header>

      <ExportButton onPress={exportToExcel}>
        <LinearGradient
          colors={['#2563eb', '#1e40af']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: 'center',
            width: '100%',
          }}
        >
          <ExportButtonText>엑셀로 저장</ExportButtonText>
        </LinearGradient>
      </ExportButton>

      <StatsContainer>
        <IncomeCard>
          <TrendingUp size={24} color="#10b981" />
          <StatLabel>수익</StatLabel>
          <IncomeText>{formatCurrency(monthlyStats.income)}</IncomeText>
        </IncomeCard>
        <ExpenseCard>
          <TrendingDown size={24} color="#dc2626" />
          <StatLabel>지출</StatLabel>
          <ExpenseText>{formatCurrency(monthlyStats.expense)}</ExpenseText>
        </ExpenseCard>
        <TotalCard>
          <Wallet size={24} color="#2563eb" />
          <StatLabel>총합</StatLabel>
          <TotalText>{formatCurrency(monthlyStats.total)}</TotalText>
        </TotalCard>
      </StatsContainer>

      <ChartContainer>
        <ChartHeader>
          <ChartTitle>수익 vs 지출</ChartTitle>
        </ChartHeader>
        <BarChart>
          <BarWrapper>
            <IncomeBar
              style={{
                height:
                  Math.max(monthlyStats.income, monthlyStats.expense) > 0
                    ? (monthlyStats.income /
                        Math.max(monthlyStats.income, monthlyStats.expense)) *
                      150
                    : 0,
              }}
            />
            <BarLabel>수익</BarLabel>
          </BarWrapper>
          <BarWrapper>
            <ExpenseBar
              style={{
                height:
                  Math.max(monthlyStats.income, monthlyStats.expense) > 0
                    ? (monthlyStats.expense /
                        Math.max(monthlyStats.income, monthlyStats.expense)) *
                      150
                    : 0,
              }}
            />
            <BarLabel>지출</BarLabel>
          </BarWrapper>
        </BarChart>
      </ChartContainer>

      <TransactionsContainer>
        <SectionTitle>최근 거래</SectionTitle>
        {filteredTransactions.length === 0 ? (
          <EmptyText>거래 내역이 없습니다</EmptyText>
        ) : (
          filteredTransactions.map((transaction) => (
            <TransactionItem key={transaction.id}>
              <CategoryDot
                style={{ backgroundColor: transaction.category?.color || '#64748b' }}
              />
              <TransactionInfo>
                <TransactionDescription>
                  {transaction.description || '거래'}
                </TransactionDescription>
                <TransactionCategory>
                  {transaction.category?.name || '카테고리 없음'} •{' '}
                  {formatDate(transaction.transaction_date)}
                </TransactionCategory>
              </TransactionInfo>
              <TransactionAmount
                style={
                  transaction.category?.type === 'income'
                    ? { color: '#10b981' }
                    : { color: '#dc2626' }
                }
              >
                {transaction.category?.type === 'income' ? '+' : '-'}
                {formatCurrency(Number(transaction.amount))}
              </TransactionAmount>
            </TransactionItem>
          ))
        )}
      </TransactionsContainer>
    </Container>
  );
}