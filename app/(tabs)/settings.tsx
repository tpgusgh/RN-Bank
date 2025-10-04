import { Linking } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useAuth } from '@/app/contexts/AuthContext';
import { Category } from '@/types/database';
import { Plus, Trash2, LogOut } from 'lucide-react-native';
import styled from 'styled-components/native';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'];

const API_URL = 'https://api2.mieung.kr';

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
`;

const Section = styled(View)`
  background-color: #ffffff;
  margin: 16px;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const SectionHeader = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SectionTitle = styled(Text)`
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
`;

const AddButton = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const AddButtonText = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
`;

const CategoryGroupTitle = styled(Text)`
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-top: 12px;
  margin-bottom: 8px;
`;

const CategoryItem = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: 12px;
  border-bottom-width: 1px;
  border-bottom-color: #f3f4f6;
`;

const CategoryInfo = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

const CategoryDot = styled(View)`
  width: 12px;
  height: 12px;
  border-radius: 6px;
`;

const CategoryName = styled(Text)`
  font-size: 16px;
  color: #1e293b;
`;

const AccountInfo = styled(View)`
  padding-vertical: 12px;
`;

const AccountLabel = styled(Text)`
  font-size: 14px;
  color: #64748b;
  margin-bottom: 4px;
`;

const AccountValue = styled(Text)`
  font-size: 16px;
  color: #1e293b;
`;

const ContactButton = styled(TouchableOpacity)`
  border-radius: 8px;
  margin: 16px 0;
`;

const ContactButtonText = styled(Text)`
  color: #ffffff;
  font-weight: 600;
  font-size: 16px;
`;

const LogoutButton = styled(TouchableOpacity)`
  margin: 16px;
  margin-top: 0;
  border-radius: 12px;
`;

const LogoutText = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
`;

const ModalContainer = styled(View)`
  flex: 1;
  justify-content: flex-end;
  background-color: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled(View)`
  background-color: #ffffff;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 24px;
`;

const ModalTitle = styled(Text)`
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 20px;
`;

const ModalSection = styled(View)`
  margin-bottom: 20px;
`;

const ModalLabel = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
`;

const ModalInput = styled(TextInput)`
  background-color: #f3f4f6;
  border-radius: 12px;
  padding-horizontal: 16px;
  padding-vertical: 14px;
  font-size: 16px;
  border: 1px solid #e2e8f0;
`;

const TypeSelector = styled(View)`
  flex-direction: row;
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

const ColorSelector = styled(View)`
  flex-direction: row;
  gap: 12px;
  flex-wrap: wrap;
`;

const ColorOption = styled(TouchableOpacity)`
  width: 40px;
  height: 40px;
  border-radius: 20px;
`;

const ColorOptionActive = styled(ColorOption)`
  border: 3px solid #1e293b;
`;

const ModalButtonsContainer = styled(SafeAreaView)`
  padding-bottom: 16px;
  background-color: #ffffff;
`;

const ModalButtons = styled(View)`
  flex-direction: row;
  gap: 12px;
  margin-top: 8px;
`;

const ModalCancelButton = styled(TouchableOpacity)`
  flex: 1;
  border-radius: 12px;
`;

const ModalCancelText = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
`;

const ModalSaveButton = styled(TouchableOpacity)`
  flex: 1;
  border-radius: 12px;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
`;

const ModalSaveText = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
`;

export default function SettingsScreen() {
  const { token, user, signOut, email } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');
  const [newCategoryColor, setNewCategoryColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) loadCategories();
  }, [token]);

  const loadCategories = async () => {
    try {
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const [expenseRes, incomeRes] = await Promise.all([
        axios.get(`${API_URL}/categories?type=expense&startDate=${startDate}&endDate=${endDate}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/categories?type=income&startDate=${startDate}&endDate=${endDate}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setCategories([...expenseRes.data.categories, ...incomeRes.data.categories]);
    } catch (error) {
      console.error(error);
      Alert.alert('오류', '카테고리 불러오기에 실패했습니다.');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('오류', '카테고리 이름을 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/categories/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          type: newCategoryType,
          color: newCategoryColor,
        }),
      });

      if (!res.ok) {
        const errMsg = await res.text();
        throw new Error(errMsg || '카테고리 추가 실패');
      }

      setNewCategoryName('');
      setNewCategoryType('expense');
      setNewCategoryColor(COLORS[0]);
      setShowAddModal(false);

      await loadCategories();
      Alert.alert('성공', '카테고리가 추가되었습니다.');
    } catch (error) {
      console.error(error);
      Alert.alert('오류', (error as Error).message || '카테고리 추가 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    Alert.alert('카테고리 삭제', '이 카테고리를 삭제하시겠습니까? 관련 거래의 카테고리가 제거됩니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/categories/${categoryId}/`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('삭제 실패');
            setCategories(categories.filter((c) => c.id !== categoryId));
            Alert.alert('성공', '카테고리가 삭제되었습니다.');
          } catch (error) {
            console.error(error);
            Alert.alert('오류', '카테고리 삭제 실패');
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleContact = () => {
    Linking.openURL('mailto:me@mieung.kr');
  };

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <Container>
      <Header>
        <HeaderTitle>설정</HeaderTitle>
      </Header>

      <Content>
        <Section>
          <SectionHeader>
            <SectionTitle>카테고리 관리</SectionTitle>
            <AddButton onPress={() => setShowAddModal(true)}>
              <LinearGradient
                colors={['#2563eb', '#1e40af']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 12,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Plus size={20} color="#ffffff" />
                <AddButtonText>추가</AddButtonText>
              </LinearGradient>
            </AddButton>
          </SectionHeader>

          {incomeCategories.length > 0 && (
            <>
              <CategoryGroupTitle>수익</CategoryGroupTitle>
              {incomeCategories.map((category) => (
                <CategoryItem key={category.id}>
                  <CategoryInfo>
                    <CategoryDot style={{ backgroundColor: category.color }} />
                    <CategoryName>{category.name}</CategoryName>
                  </CategoryInfo>
                  <TouchableOpacity onPress={() => handleDeleteCategory(category.id)}>
                    <Trash2 size={20} color="#ef4444" />
                  </TouchableOpacity>
                </CategoryItem>
              ))}
            </>
          )}

          {expenseCategories.length > 0 && (
            <>
              <CategoryGroupTitle>지출</CategoryGroupTitle>
              {expenseCategories.map((category) => (
                <CategoryItem key={category.id}>
                  <CategoryInfo>
                    <CategoryDot style={{ backgroundColor: category.color }} />
                    <CategoryName>{category.name}</CategoryName>
                  </CategoryInfo>
                  <TouchableOpacity onPress={() => handleDeleteCategory(category.id)}>
                    <Trash2 size={20} color="#ef4444" />
                  </TouchableOpacity>
                </CategoryItem>
              ))}
            </>
          )}
        </Section>

        <Section>
          <SectionTitle>계정</SectionTitle>
          <AccountInfo>
            <AccountLabel>이메일</AccountLabel>
            <AccountValue>{email}</AccountValue>
          </AccountInfo>
          <AccountInfo>
            <AccountLabel>문의</AccountLabel>
            <ContactButton onPress={handleContact}>
              <LinearGradient
                colors={['#2563eb', '#1e40af']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 8,
                  padding: 12,
                  alignItems: 'center',
                }}
              >
                <ContactButtonText>me@mieung.kr</ContactButtonText>
              </LinearGradient>
            </ContactButton>
          </AccountInfo>
        </Section>

        <LogoutButton onPress={handleLogout}>
          <LinearGradient
            colors={['#ef4444', '#b91c1c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 12,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <LogOut size={20} color="#ffffff" />
            <LogoutText>로그아웃</LogoutText>
          </LinearGradient>
        </LogoutButton>
      </Content>

      <Modal visible={showAddModal} animationType="slide" transparent={true} onRequestClose={() => setShowAddModal(false)}>
        <ModalContainer>
          <ModalContent>
            <ModalTitle>카테고리 추가</ModalTitle>

            <ModalSection>
              <ModalLabel>이름</ModalLabel>
              <ModalInput
                placeholder="카테고리 이름"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
              />
            </ModalSection>

            <ModalSection>
              <ModalLabel>유형</ModalLabel>
              <TypeSelector>
                <TypeButton
                  as={newCategoryType === 'income' ? TypeButtonActive : TypeButton}
                  onPress={() => setNewCategoryType('income')}
                >
                  <LinearGradient
                    colors={newCategoryType === 'income' ? ['#10b981', '#059669'] : ['#e2e8f0', '#cbd5e1']}
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
                  as={newCategoryType === 'expense' ? TypeButtonActive : TypeButton}
                  onPress={() => setNewCategoryType('expense')}
                >
                  <LinearGradient
                    colors={newCategoryType === 'expense' ? ['#dc2626', '#b91c1c'] : ['#e2e8f0', '#cbd5e1']}
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
            </ModalSection>

            <ModalSection>
              <ModalLabel>색상</ModalLabel>
              <ColorSelector>
                {COLORS.map((color) => (
                  <ColorOption
                    key={color}
                    style={{ backgroundColor: color }}
                    as={newCategoryColor === color ? ColorOptionActive : ColorOption}
                    onPress={() => setNewCategoryColor(color)}
                  />
                ))}
              </ColorSelector>
            </ModalSection>

            <ModalButtonsContainer>
              <ModalButtons>
                <ModalCancelButton onPress={() => setShowAddModal(false)}>
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
                    <ModalCancelText>취소</ModalCancelText>
                  </LinearGradient>
                </ModalCancelButton>
                <ModalSaveButton onPress={handleAddCategory} disabled={loading}>
                  <LinearGradient
                    colors={loading ? ['#93c5fd', '#60a5fa'] : ['#2563eb', '#1e40af']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 12,
                      paddingVertical: 14,
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <ModalSaveText>{loading ? '추가 중...' : '추가'}</ModalSaveText>
                  </LinearGradient>
                </ModalSaveButton>
              </ModalButtons>
            </ModalButtonsContainer>
          </ModalContent>
        </ModalContainer>
      </Modal>
    </Container>
  );
}