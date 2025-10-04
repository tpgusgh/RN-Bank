import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import styled from 'styled-components/native';
import { useAuth } from '@/app/contexts/AuthContext';
import { Category } from '@/types/database';
import { Calendar, ChevronDown } from 'lucide-react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

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
`;

const Content = styled(ScrollView)`
  flex: 1;
  padding: 24px;
`;

const Section = styled(View)`
  margin-bottom: 24px;
`;

const Label = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
`;

const Input = styled(TextInput)`
  background-color: #ffffff;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const TextArea = styled(Input)`
  height: 100px;
  text-align-vertical: top;
`;

const SelectButton = styled(TouchableOpacity)`
  background-color: #ffffff;
  border-radius: 12px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const SelectContent = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const SelectText = styled(Text)`
  font-size: 16px;
  color: #1e293b;
`;

const SelectPlaceholder = styled(Text)`
  font-size: 16px;
  color: #9ca3af;
`;

const CategoryDot = styled(View)`
  width: 14px;
  height: 14px;
  border-radius: 7px;
`;

const DateDisplay = styled(TouchableOpacity)`
  background-color: #ffffff;
  border-radius: 12px;
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const DateText = styled(Text)`
  font-size: 16px;
  color: #1e293b;
`;

const SaveButton = styled(TouchableOpacity)`
  border-radius: 12px;
  margin-top: 8px;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
`;

const SaveButtonText = styled(Text)`
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
`;

const ModalContainer = styled(View)`
  flex: 1;
  justify-content: flex-end;
  background-color: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled(SafeAreaView)`
  background-color: #ffffff;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 24px;
  max-height: 80%;
`;

const ModalTitle = styled(Text)`
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 20px;
`;

const CategoryList = styled(ScrollView)`
  margin-bottom: 20px;
`;

const CategoryGroupTitle = styled(Text)`
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-top: 12px;
  margin-bottom: 8px;
`;

const CategoryItem = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  padding: 12px 4px;
  gap: 12px;
`;

const CategoryName = styled(Text)`
  font-size: 16px;
  color: #1e293b;
`;

const ModalCloseButton = styled(TouchableOpacity)`
  border-radius: 12px;
`;

const ModalCloseText = styled(Text)`
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
`;

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
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

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

      setCategories([...expenseRes.data.categories, ...incomeRes.data.categories]);
    } catch (error) {
      console.error('카테고리 불러오기 실패:', error);
      Alert.alert('오류', '카테고리 불러오기 실패');
    }
  };

  const handleSave = async () => {
    if (!selectedCategory) {
      Alert.alert('오류', '카테고리를 선택해주세요');
      return;
    }

    if (!amount || Number(amount.replace(/,/g, '')) <= 0) {
      Alert.alert('오류', '올바른 금액을 입력해주세요');
      return;
    }

    setLoading(true);

    try {
      const fixedDate = new Date(
        transactionDate.getTime() - transactionDate.getTimezoneOffset() * 60000
      );

      const year = fixedDate.getFullYear();
      const month = String(fixedDate.getMonth() + 1).padStart(2, '0');
      const day = String(fixedDate.getDate()).padStart(2, '0');

      const formattedDate = `${year}-${month}-${day}`;

      await axios.post(
        'https://api2.mieung.kr/transactions',
        {
          category_id: selectedCategory.id,
          amount: Number(amount.replace(/,/g, '')),
          description: description.trim(),
          transaction_date: formattedDate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setAmount('');
      setDescription('');
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
    const numericValue = value.replace(/[^0-9]/g, '');
    const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setAmount(formattedValue);
  };

  return (
    <Container>
      <Header>
        <HeaderTitle>거래 추가</HeaderTitle>
      </Header>

      <Content>
        <Section>
          <Label>카테고리</Label>
          <SelectButton onPress={() => setShowCategoryModal(true)}>
            <SelectContent>
              {selectedCategory ? (
                <>
                  <CategoryDot style={{ backgroundColor: selectedCategory.color || '#9ca3af' }} />
                  <SelectText>{selectedCategory.name}</SelectText>
                </>
              ) : (
                <SelectPlaceholder>카테고리 선택</SelectPlaceholder>
              )}
              <ChevronDown size={20} color="#9ca3af" />
            </SelectContent>
          </SelectButton>
        </Section>

        <Section>
          <Label>금액</Label>
          <Input
            placeholder="0"
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="numeric"
          />
        </Section>

        <Section>
          <Label>내용</Label>
          <TextArea
            placeholder="거래 내용을 입력하세요"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </Section>

        <Section>
          <Label>날짜</Label>
          <DateDisplay onPress={showDatePicker}>
            <Calendar size={20} color="#64748b" />
            <DateText>{formatDate(transactionDate)}</DateText>
          </DateDisplay>

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            date={transactionDate}
            onConfirm={handleConfirm}
            onCancel={hideDatePicker}
          />
        </Section>

        <SaveButton onPress={handleSave} disabled={loading}>
          <LinearGradient
            colors={loading ? ['#93c5fd', '#60a5fa'] : ['#2563eb', '#1e40af']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              width: '100%',
            }}
          >
            <SaveButtonText>{loading ? '저장 중...' : '저장'}</SaveButtonText>
          </LinearGradient>
        </SaveButton>
      </Content>

      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <ModalContainer>
          <ModalContent>
            <ModalTitle>카테고리 선택</ModalTitle>
            <CategoryList>
              {incomeCategories.length > 0 && (
                <>
                  <CategoryGroupTitle>수익</CategoryGroupTitle>
                  {incomeCategories.map((category) => (
                    <CategoryItem
                      key={category.id}
                      onPress={() => {
                        setSelectedCategory(category);
                        setShowCategoryModal(false);
                      }}
                    >
                      <CategoryDot style={{ backgroundColor: category.color || '#9ca3af' }} />
                      <CategoryName>{category.name}</CategoryName>
                    </CategoryItem>
                  ))}
                </>
              )}

              {expenseCategories.length > 0 && (
                <>
                  <CategoryGroupTitle>지출</CategoryGroupTitle>
                  {expenseCategories.map((category) => (
                    <CategoryItem
                      key={category.id}
                      onPress={() => {
                        setSelectedCategory(category);
                        setShowCategoryModal(false);
                      }}
                    >
                      <CategoryDot style={{ backgroundColor: category.color || '#9ca3af' }} />
                      <CategoryName>{category.name}</CategoryName>
                    </CategoryItem>
                  ))}
                </>
              )}
            </CategoryList>

            <ModalCloseButton onPress={() => setShowCategoryModal(false)}>
              <LinearGradient
                colors={['#6b7280', '#4b5563']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <ModalCloseText>닫기</ModalCloseText>
              </LinearGradient>
            </ModalCloseButton>
          </ModalContent>
        </ModalContainer>
      </Modal>
    </Container>
  );
}