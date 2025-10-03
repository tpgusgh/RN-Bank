import { Linking } from "react-native";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import axios from 'axios';
import { useRouter } from "expo-router";
import { useAuth } from "@/app/contexts/AuthContext";
import { Category } from "@/types/database";
import { Plus, Trash2, LogOut } from "lucide-react-native";

const COLORS = [
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#6B7280",
];

export default function SettingsScreen() {
  const { token, user, signOut, email } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"income" | "expense">(
    "expense"
  );
  const [newCategoryColor, setNewCategoryColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  const API_URL = "https://api2.mieung.kr";

  useEffect(() => {
    
    if (token) loadCategories();
  }, [token]);

  const loadCategories = async () => {
    try {
      const startDate = new Date().toISOString().split("T")[0];
      const endDate = new Date().toISOString().split("T")[0];

      const [expenseRes, incomeRes] = await Promise.all([
        axios.get(
          `${API_URL}/categories?type=expense&startDate=${startDate}&endDate=${endDate}`,
           {headers: { Authorization: `Bearer ${token}` },}
          ),
        axios.get(
          `${API_URL}/categories?type=income&startDate=${startDate}&endDate=${endDate}`,
           {headers: { Authorization: `Bearer ${token}` },}),
      ]);





      setCategories([...expenseRes.data.categories, ...incomeRes.data.categories]);
    } catch (error) {
      console.error(error);
      Alert.alert("오류", "카테고리 불러오기에 실패했습니다.");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert("오류", "카테고리 이름을 입력해주세요");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/categories/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
        throw new Error(errMsg || "카테고리 추가 실패");
      }

      setNewCategoryName("");
      setNewCategoryType("expense");
      setNewCategoryColor(COLORS[0]);
      setShowAddModal(false);

      await loadCategories();
      Alert.alert("성공", "카테고리가 추가되었습니다.");
    } catch (error) {
      console.error(error);
      Alert.alert("오류", (error as Error).message || "카테고리 추가 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    Alert.alert(
      "카테고리 삭제",
      "이 카테고리를 삭제하시겠습니까? 관련 거래의 카테고리가 제거됩니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/categories/${categoryId}/`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!res.ok) throw new Error("삭제 실패");
              setCategories(categories.filter((c) => c.id !== categoryId));
              Alert.alert("성공", "카테고리가 삭제되었습니다.");
            } catch (error) {
              console.error(error);
              Alert.alert("오류", "카테고리 삭제 실패");
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("로그아웃", "로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };
const incomeCategories = categories.filter(c => c.type === "income");
const expenseCategories = categories.filter(c => c.type === "expense");


useEffect(() => {
  if (categories.length > 0) {
    const incomeCategories = categories.filter(c => c.type === "income");
    const expenseCategories = categories.filter(c => c.type === "expense");

  }
}, [categories]);

  const handleContact = () => {
    Linking.openURL("mailto:me@mieung.kr");
  };




  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>설정</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>카테고리 관리</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={20} color="#3B82F6" />
              <Text style={styles.addButtonText}>추가</Text>
            </TouchableOpacity>
          </View>

          {incomeCategories.length > 0 && (
            <>
              <Text style={styles.categoryGroupTitle}>수익</Text>
              {incomeCategories.map((category) => (
                <View key={category.id} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: category.color },
                      ]}
                    />
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteCategory(category.id)}
                  >
                    <Trash2 size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {expenseCategories.length > 0 && (
            <>
              <Text style={styles.categoryGroupTitle}>지출</Text>
              {expenseCategories.map((category) => (
                <View key={category.id} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: category.color },
                      ]}
                    />
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteCategory(category.id)}
                  >
                    <Trash2 size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정</Text>
          
          <View style={styles.accountInfo}>
            <Text style={styles.accountLabel}>이메일</Text>
            <Text style={styles.accountValue}>{email}</Text>
            <View style={styles.accountInfo}>
            <Text style={styles.accountLabel}>문의</Text>
            <TouchableOpacity style={styles.button} onPress={handleContact}>
            <Text style={styles.buttonText}>me@mieung.kr</Text>
            </TouchableOpacity>
  </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>카테고리 추가</Text>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>이름</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="카테고리 이름"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>유형</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    newCategoryType === 'income' && styles.typeButtonActive,
                  ]}
                  onPress={() => setNewCategoryType('income')}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      newCategoryType === 'income' && styles.typeButtonTextActive,
                    ]}
                  >
                    수익
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    newCategoryType === 'expense' && styles.typeButtonActive,
                  ]}
                  onPress={() => setNewCategoryType('expense')}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      newCategoryType === 'expense' &&
                        styles.typeButtonTextActive,
                    ]}
                  >
                    지출
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
                
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>색상</Text>
              <View style={styles.colorSelector}>
                {COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newCategoryColor === color && styles.colorOptionActive,
                    ]}
                    onPress={() => setNewCategoryColor(color)}
                  />
                ))}
              </View>
            </View>
          <SafeAreaView style={styles.modalButtonsContainer}>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSaveButton,
                  loading && styles.modalSaveButtonDisabled,
                ]}
                onPress={handleAddCategory}
                disabled={loading}
              >
                <Text style={styles.modalSaveText}>
                  {loading ? '추가 중...' : '추가'}
                </Text>
              </TouchableOpacity>
            </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </View>
  );
}


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
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontSize: 16,
    color: '#1F2937',
  },
  accountInfo: {
    paddingVertical: 12,
  },
  accountLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  accountValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  modalButtonsContainer: {
  paddingBottom: 16, // 안전 영역 + 여백 확보
  backgroundColor: "#fff",
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  colorSelector: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  colorOptionActive: {
    borderWidth: 3,
    borderColor: '#1F2937',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
    button: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    margin: 16,
  },
  buttonText: {
    color: "#0a1eff",
    fontWeight: "600",
    fontSize: 16,
  },
});
