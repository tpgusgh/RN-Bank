import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '@/app/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category } from '@/types/database';
import { useFocusEffect } from 'expo-router';
import styled from 'styled-components/native';
import { LinearGradient } from 'expo-linear-gradient';

interface CategoryStats {
  transactionId?: string;
  category?: Category | null;
  total: number;
  count: number;
  percentage: number;
  descriptions?: string;
  date?: string;
}

const API_BASE_URL = 'https://api2.mieung.kr';

// 스타일드 컴포넌트 정의
const Container = styled(View)`
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

const MonthSelector = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 8px;
`;

const MonthButton = styled(TouchableOpacity)`
  padding-horizontal: 10px;
`;

const MonthButtonText = styled(Text)`
  font-size: 20px;
  font-weight: 700;
  color: #2563eb;
`;

const HeaderSubtitle = styled(Text)`
  font-size: 18px;
  color: #64748b;
  font-weight: 600;
`;

const TypeSelector = styled(View)`
  flex-direction: row;
  padding: 16px;
  gap: 12px;
`;

const TypeButton = styled(TouchableOpacity)`
  flex: 1;
  padding-vertical: 12px;
  border-radius: 12px;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const TypeButtonActive = styled(TypeButton)`
  border: 1px solid #2563eb;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const TypeButtonText = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
`;

const Content = styled(ScrollView)`
  flex: 1;
`;

const TotalCard = styled(View)`
  background-color: #ffffff;
  margin: 16px;
  margin-top: 0;
  padding: 24px;
  border-radius: 16px;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const TotalLabel = styled(Text)`
  font-size: 14px;
  color: #64748b;
  margin-bottom: 8px;
`;

const TotalAmount = styled(Text)`
  font-size: 32px;
  font-weight: 700;
`;

const IncomeText = styled(TotalAmount)`
  color: #10b981;
`;

const ExpenseText = styled(TotalAmount)`
  color: #dc2626;
`;

const StatsContainer = styled(View)`
  padding: 16px;
  padding-top: 0;
  gap: 12px;
`;

const StatCard = styled(View)`
  background-color: #ffffff;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const StatHeader = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const CategoryInfo = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const CategoryDot = styled(View)`
  width: 12px;
  height: 12px;
  border-radius: 6px;
`;

const CategoryName = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
`;

const StatCount = styled(Text)`
  font-size: 14px;
  color: #64748b;
`;

const StatDescription = styled(Text)`
  font-size: 14px;
  color: #4b5563;
  margin-bottom: 8px;
`;

const StatDate = styled(Text)`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
`;

const ProgressBar = styled(View)`
  height: 8px;
  background-color: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
`;

const ProgressFill = styled(View)`
  height: 100%;
  border-radius: 4px;
`;

const StatFooter = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const StatAmount = styled(Text)`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
`;

const StatPercentage = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: #64748b;
`;

const EmptyContainer = styled(View)`
  padding: 40px;
  align-items: center;
`;

const EmptyText = styled(Text)`
  font-size: 14px;
  color: #9ca3af;
`;

const DeleteButton = styled(TouchableOpacity)`
  border-radius: 8px;
  align-self: flex-end;
`;

const DeleteButtonText = styled(Text)`
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
`;

export default function StatisticsScreen() {
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>('income');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [token, setToken] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatMonth = (date: Date) => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
  };

  const loadStatistics = async () => {
    if (!token) {
      console.error('토큰이 없습니다.');
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

      const startOfMonthStr = formatDate(startOfMonth);
      const endOfMonthStr = formatDate(endOfMonth);

      const res = await fetch(
        `${API_BASE_URL}/statistics/?type=${selectedType}&startDate=${startOfMonthStr}&endDate=${endOfMonthStr}`,
        {
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${res.statusText}`);
      }

      const data = await res.json();

      const transformedStats: CategoryStats[] = data.categoryStats.map((stat: any) => ({
        transactionId: stat.transaction_id,
        category: {
          id: stat.category_id,
          name: stat.category_name,
          color: stat.category_color,
        },
        total: stat.total,
        count: stat.count,
        percentage: stat.percentage,
        descriptions: stat.descriptions || '',
        date: stat.date || null,
      }));

      setCategoryStats(transformedStats);
      setTotalAmount(data.totalAmount || 0);
    } catch (error) {
      console.error('통계 로드 실패:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const getToken = async () => {
      const savedToken = await AsyncStorage.getItem('token');
      setToken(savedToken);
    };
    getToken();
  }, []);

  useEffect(() => {
    if (token) {
      loadStatistics();
    }
  }, [token, selectedType, selectedMonth]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStatistics();
  };

  const formatCurrency = (amount: number) => {
    return `₩${amount.toLocaleString('ko-KR')}`;
  };

  const handleDeleteTransaction = (transactionId?: string) => {
    if (!transactionId) return;

    Alert.alert('삭제 확인', '정말 이 거래를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/statistics/transaction/${transactionId}`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token?.trim()}`,
                'Content-Type': 'application/json',
              },
            });

            if (!res.ok) throw new Error(`삭제 실패: ${res.status}`);

            setCategoryStats((prev) => prev.filter((stat) => stat.transactionId !== transactionId));
          } catch (error) {
            console.error('삭제 오류:', error);
            Alert.alert('오류', '삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      const getToken = async () => {
        const savedToken = await AsyncStorage.getItem('token');
        setToken(savedToken);
      };
      getToken();
      setSelectedType('income');
      loadStatistics();
    }, [token])
  );

  return (
    <Container>
      <Header>
        <HeaderTitle>카테고리별 통계</HeaderTitle>
        <MonthSelector>
          <MonthButton
            onPress={() =>
              setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1))
            }
          >
            <MonthButtonText>◀</MonthButtonText>
          </MonthButton>
          <HeaderSubtitle>{formatMonth(selectedMonth)}</HeaderSubtitle>
          <MonthButton
            onPress={() =>
              setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1))
            }
          >
            <MonthButtonText>▶</MonthButtonText>
          </MonthButton>
        </MonthSelector>
      </Header>

      <TypeSelector>
        <TypeButton
          as={selectedType === 'income' ? TypeButtonActive : TypeButton}
          onPress={() => setSelectedType('income')}
        >
          <LinearGradient
            colors={selectedType === 'income' ? ['#10b981', '#059669'] : ['#e2e8f0', '#cbd5e1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
              width: '100%',
            }}
          >
            <TypeButtonText>수익</TypeButtonText>
          </LinearGradient>
        </TypeButton>
        <TypeButton
          as={selectedType === 'expense' ? TypeButtonActive : TypeButton}
          onPress={() => setSelectedType('expense')}
        >
          <LinearGradient
            colors={selectedType === 'expense' ? ['#dc2626', '#b91c1c'] : ['#e2e8f0', '#cbd5e1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
              width: '100%',
            }}
          >
            <TypeButtonText>지출</TypeButtonText>
          </LinearGradient>
        </TypeButton>
      </TypeSelector>

      <Content refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <TotalCard>
          <TotalLabel>총 {selectedType === 'income' ? '수익' : '지출'}</TotalLabel>
          <TotalAmount as={selectedType === 'income' ? IncomeText : ExpenseText}>
            {formatCurrency(totalAmount)}
          </TotalAmount>
        </TotalCard>

        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#64748b' }}>로딩 중...</Text>
        ) : categoryStats.length === 0 ? (
          <EmptyContainer>
            <EmptyText>거래 내역이 없습니다</EmptyText>
          </EmptyContainer>
        ) : (
          <StatsContainer>
            {categoryStats.map((stat, index) => (
              <StatCard key={`${stat.category?.id ?? 'unknown'}-${index}`}>
                <StatHeader>
                  <CategoryInfo>
                    <CategoryDot style={{ backgroundColor: stat.category?.color ?? '#000' }} />
                    <CategoryName>{stat.category?.name ?? '알 수 없음'}</CategoryName>
                  </CategoryInfo>
                  <StatCount>{stat.count}건</StatCount>
                </StatHeader>

                {stat.descriptions ? <StatDescription>{stat.descriptions}</StatDescription> : null}

                {stat.date && <StatDate>{stat.date}</StatDate>}

                <ProgressBar>
                  <ProgressFill
                    style={{
                      width: `${Math.max(stat.percentage, 1).toFixed(1)}%`,
                      backgroundColor: stat.category?.color ?? '#000',
                    }}
                  />
                </ProgressBar>

                <StatFooter>
                  <StatAmount>{formatCurrency(stat.total)}</StatAmount>
                  <StatPercentage>{stat.percentage.toFixed(1)}%</StatPercentage>
                </StatFooter>

                <DeleteButton onPress={() => handleDeleteTransaction(stat.transactionId)}>
                  <LinearGradient
                    colors={['#ef4444', '#b91c1c']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 8,
                      padding: 6,
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <DeleteButtonText>삭제</DeleteButtonText>
                  </LinearGradient>
                </DeleteButton>
              </StatCard>
            ))}
          </StatsContainer>
        )}
      </Content>
    </Container>
  );
}