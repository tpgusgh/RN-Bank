import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import axios from 'axios';
import { useAuth } from '@/app/contexts/AuthContext';
import { Category } from '@/types/database';
import { Calendar, ChevronDown } from 'lucide-react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";

export default function AddTransactionScreen() {
  const { user, token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

const showDatePicker = () => {
  setDatePickerVisibility(true);
};

const hideDatePicker = () => {
  setDatePickerVisibility(false);
};

const handleConfirm = (date: Date) => {
  setTransactionDate(date);
  hideDatePicker();
};


useFocusEffect(
  useCallback(() => {
    loadCategories();
  }, [token])
);


const loadCategories = async () => {

  try {
    const startDate = new Date().toISOString().split("T")[0];
    const endDate = new Date().toISOString().split("T")[0];

    const [expenseRes, incomeRes] = await Promise.all([
      axios.get(
        `https://api2.mieung.kr/categories?type=expense&startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
      axios.get(
        `https://api2.mieung.kr/categories?type=income&startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
    ]);



    setCategories([
      ...expenseRes.data.categories,
      ...incomeRes.data.categories,
    ]);
  } catch (error) {
    console.error('카테고리 불러오기 실패:', error);
    Alert.alert('오류', '카테고리 불러오기 실패');
  }
};

const handleSave = async () => {
  console.log("거래 저장 시도:");
  if (!selectedCategory) {
    Alert.alert('오류', '카테고리를 선택해주세요');
    return;
  }

  if (!amount || Number(amount) <= 0) {
    Alert.alert('오류', '올바른 금액을 입력해주세요');
    return;
  }

  setLoading(true);

  try {
    // timezone 보정 (서버는 UTC로 받음)
    const fixedDate = new Date(
      transactionDate.getTime() - transactionDate.getTimezoneOffset() * 60000
    );

    const year = fixedDate.getFullYear();
    const month = String(fixedDate.getMonth() + 1).padStart(2, "0");
    const day = String(fixedDate.getDate()).padStart(2, "0");

    const formattedDate = `${year}-${month}-${day}`;

    await axios.post(
      'https://api2.mieung.kr/transactions',
      {
        category_id: selectedCategory.id,
        amount: Number(amount.replace(/,/g, "")), // 콤마 제거
        description: description.trim(),
        transaction_date: formattedDate,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    setAmount('');
    setDescription('');
    setSelectedCategory(null);
    setTransactionDate(new Date());
    Alert.alert('성공', '거래가 저장되었습니다');
  } catch (error) {
    console.error('거래 저장 실패:', error);
    Alert.alert('오류', '거래 저장에 실패했습니다');
  } finally {
    setLoading(false);
  }
};


  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`;
  };

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');


  const handleAmountChange = (value: string) => {
  // 숫자와 점(.)만 허용
  const numericValue = value.replace(/[^0-9]/g, "");

  // 콤마 추가
  const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  setAmount(formattedValue);
};


return (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.headerTitle}>거래 추가</Text>
    </View>

    <ScrollView style={styles.content}>
      {/* 카테고리 선택 */}
      <View style={styles.section}>
        <Text style={styles.label}>카테고리</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowCategoryModal(true)}
        >
          <View style={styles.selectContent}>
            {selectedCategory ? (
              <>
                <View
                  style={[
                    styles.categoryDot,
                    { backgroundColor: selectedCategory.color || "#9CA3AF" },
                  ]}
                />
                <Text style={styles.selectText}>{selectedCategory.name}</Text>
              </>
            ) : (
              <Text style={styles.selectPlaceholder}>카테고리 선택</Text>
            )}
            <ChevronDown size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
      </View>

      {/* 금액 입력 */}
      <View style={styles.section}>
        <Text style={styles.label}>금액</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          value={amount}
          onChangeText={handleAmountChange}
          keyboardType="numeric"
        />
      </View>

      {/* 내용 입력 */}
      <View style={styles.section}>
        <Text style={styles.label}>내용</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="거래 내용을 입력하세요"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* 날짜 선택 */}
      <View style={styles.section}>
        <Text style={styles.label}>날짜</Text>
        <TouchableOpacity style={styles.dateDisplay} onPress={showDatePicker}>
          <Calendar size={20} color="#6B7280" />
          <Text style={styles.dateText}>{formatDate(transactionDate)}</Text>
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          date={transactionDate}
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
        />
      </View>

      {/* 저장 버튼 */}
      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? "저장 중..." : "저장"}
        </Text>
      </TouchableOpacity>
    </ScrollView>

    {/* 카테고리 선택 모달 */}
    <Modal
      visible={showCategoryModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>카테고리 선택</Text>
          <ScrollView style={styles.categoryList}>
            {/* 수익 카테고리 */}
            {incomeCategories.length > 0 && (
              <>
                <Text style={styles.categoryGroupTitle}>수익</Text>
                {incomeCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryItem}
                    onPress={() => {
                      setSelectedCategory(category);
                      setShowCategoryModal(false);
                    }}
                  >
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: category.color || "#9CA3AF" },
                      ]}
                    />
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* 지출 카테고리 */}
            {expenseCategories.length > 0 && (
              <>
                <Text style={styles.categoryGroupTitle}>지출</Text>
                {expenseCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryItem}
                    onPress={() => {
                      setSelectedCategory(category);
                      setShowCategoryModal(false);
                    }}
                  >
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: category.color || "#9CA3AF" },
                      ]}
                    />
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>

          {/* 닫기 버튼 */}
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowCategoryModal(false)}
          >
            <Text style={styles.modalCloseText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </View>
);
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  selectButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectText: {
    fontSize: 16,
    color: '#1F2937',
  },
  selectPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  categoryDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },

  dateDisplay: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#1F2937',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  categoryList: {
    marginBottom: 20,
  },
  categoryGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
  },
  
  categoryName: {
    fontSize: 16,
    color: '#1F2937',
  },
  modalCloseButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});
