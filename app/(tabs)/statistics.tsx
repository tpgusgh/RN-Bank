import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/app/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category } from '@/types/database';

interface CategoryStats {
  category?: Category | null;
  total: number;
  count: number;
  percentage: number;
  descriptions?: string;
}

const API_BASE_URL = "https://api2.mieung.kr";

export default function StatisticsScreen() {
  const { user } = useAuth();
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>('expense');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [token, setToken] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatMonth = (date: Date) => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
  };

  const loadStatistics = async () => {
    if (!token) {
      console.error("토큰이 없습니다.");
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
            "Authorization": `Bearer ${token.trim()}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${res.statusText}`);
      }

      const data = await res.json();
      console.log("통계 데이터:", data);

      const transformedStats: CategoryStats[] = data.categoryStats.map((stat: any) => ({
        category: {
          id: stat.category_id,
          name: stat.category_name,
          color: stat.category_color,
        },
        total: stat.total,
        count: stat.count,
        percentage: stat.percentage,
        descriptions: stat.descriptions || "", 
      }));

      setCategoryStats(transformedStats);
      setTotalAmount(data.totalAmount || 0);

    } catch (error) {
      console.error("통계 로드 실패:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const getToken = async () => {
      const savedToken = await AsyncStorage.getItem("token");
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>카테고리별 통계</Text>

        {/* 월 변경 UI */}
        <View style={styles.monthSelector}>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1))}
          >
            <Text style={styles.monthButtonText}>◀</Text>
          </TouchableOpacity>

          <Text style={styles.headerSubtitle}>{formatMonth(selectedMonth)}</Text>

          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1))}
          >
            <Text style={styles.monthButtonText}>▶</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            selectedType === "expense" && styles.typeButtonActive,
          ]}
          onPress={() => setSelectedType("expense")}
        >
          <Text
            style={[
              styles.typeButtonText,
              selectedType === "expense" && styles.typeButtonTextActive,
            ]}
          >
            지출
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            selectedType === "income" && styles.typeButtonActive,
          ]}
          onPress={() => setSelectedType("income")}
        >
          <Text
            style={[
              styles.typeButtonText,
              selectedType === "income" && styles.typeButtonTextActive,
            ]}
          >
            수익
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>
            총 {selectedType === "income" ? "수익" : "지출"}
          </Text>
          <Text
            style={[
              styles.totalAmount,
              selectedType === "income"
                ? styles.incomeText
                : styles.expenseText,
            ]}
          >
            {formatCurrency(totalAmount)}
          </Text>
        </View>

        {loading ? (
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            로딩 중...
          </Text>
        ) : categoryStats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>거래 내역이 없습니다</Text>
          </View>
        ) : (
          <View style={styles.statsContainer}>
            {categoryStats.map((stat, index) => (
              <View
                key={`${stat.category?.id ?? "unknown"}-${index}`}
                style={styles.statCard}
              >
                <View style={styles.statHeader}>
                  <View style={styles.categoryInfo}>
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: stat.category?.color ?? "#000" },
                      ]}
                    />
                    <Text style={styles.categoryName}>
                      {stat.category?.name ?? "알 수 없음"}
                    </Text>
                  </View>
                  <Text style={styles.statCount}>{stat.count}건</Text>
                </View>

                {stat.descriptions ? (
                  <Text style={styles.statDescription}>
                    {stat.descriptions}
                  </Text>
                ) : null}

                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.max(stat.percentage, 1).toFixed(1)}%`,
                        backgroundColor: stat.category?.color ?? "#000",
                      },
                    ]}
                  />
                </View>

                <View style={styles.statFooter}>
                  <Text style={styles.statAmount}>
                    {formatCurrency(stat.total)}
                  </Text>
                  <Text style={styles.statPercentage}>
                    {stat.percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#FFFFFF', paddingTop: 60, paddingHorizontal: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 },
  monthButton: { paddingHorizontal: 10 },
  monthButtonText: { fontSize: 20, fontWeight: 'bold', color: '#3B82F6' },
  headerSubtitle: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  typeSelector: { flexDirection: 'row', padding: 16, gap: 12 },
  typeButton: { flex: 1, paddingVertical: 12, backgroundColor: '#FFFFFF', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  typeButtonActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  typeButtonText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  typeButtonTextActive: { color: '#FFFFFF' },
  content: { flex: 1 },
  totalCard: { backgroundColor: '#FFFFFF', margin: 16, marginTop: 0, padding: 24, borderRadius: 16, alignItems: 'center' },
  totalLabel: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  totalAmount: { fontSize: 32, fontWeight: 'bold' },
  incomeText: { color: '#10B981' },
  expenseText: { color: '#EF4444' },
  statDescription: {fontSize: 14,color: "#4B5563",marginBottom: 8,},
  statsContainer: { padding: 16, paddingTop: 0, gap: 12 },
  statCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  categoryInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryDot: { width: 12, height: 12, borderRadius: 6 },
  categoryName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  statCount: { fontSize: 14, color: '#6B7280' },
  progressBar: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', borderRadius: 4 },
  statFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statAmount: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  statPercentage: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
