import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface AuthContextType {
  user: string | null; // email 저장
  token: string | null;
  loading: boolean;
  email: string | null;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = "https://api2.mieung.kr"; // FastAPI 서버 주소 (에뮬레이터면 10.0.2.2)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  
  const [user, setUser] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

useEffect(() => {
  const loadUserData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      const storedUser = await AsyncStorage.getItem("user");
      const storedEmail = await AsyncStorage.getItem("email");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setEmail(storedEmail);
        console.log("토큰 로드됨", storedToken);
      }
    } catch (e) {
      console.error("토큰 로드 실패:", e);
    } finally {
      setLoading(false); // 필수: 로딩 끝났음을 표시
    }
  };

  loadUserData();
}, []);


  const signUp = async (email: string, password: string) => {
    try {
      const res = await axios.post(`${API_URL}/auth/signup`, { email, password });
      return { error: null };
    } catch (err: any) {
      return { error: err.response?.data?.detail || "Signup failed" };
    }
  };
const signIn = async (email: string, password: string) => {
  console.log("로그인 시도:", email, password);
  try {
    console.log("axios 요청 전");
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    console.log("서버 응답:", res.data);

    const token = res.data.access_token;
    console.log("토큰 추출:", token);

    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", email);

    setToken(token);
    setEmail(email);

    console.log("로그인 성공");
    return { error: null };
  } catch (err: any) {
    console.error("로그인 에러:", err);
    return { error: err.response?.data?.detail || err.message || "Login failed" };
  }
};




  const signOut = async () => {
    
    try {
      await AsyncStorage.removeItem('token'); // 토큰 삭제
      setUser(null); // 사용자 상태 초기화
    } catch (e) {
      console.error("로그아웃 실패:", e);
    }
  };


  return (
    <AuthContext.Provider value={{ user, token, loading, email ,signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
