import { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/app/contexts/AuthContext';
import styled from 'styled-components/native';
import { LinearGradient } from 'expo-linear-gradient';

// 스타일드 컴포넌트 정의
const Container = styled(KeyboardAvoidingView).attrs({
  behavior: Platform.OS === 'ios' ? 'padding' : 'height',
})`
  flex: 1;
  background-color: #f8fafc;
`;

const Content = styled(View)`
  flex: 1;
  justify-content: center;
  padding-horizontal: 24px;
`;

const Title = styled(Text)`
  font-size: 34px;
  font-weight: 700;
  color: #1e293b;
  text-align: center;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
`;

const Subtitle = styled(Text)`
  font-size: 16px;
  color: #64748b;
  text-align: center;
  margin-bottom: 32px;
  font-weight: 400;
`;

const ErrorText = styled(Text)`
  color: #dc2626;
  font-size: 14px;
  text-align: center;
  margin-bottom: 16px;
  font-weight: 500;
`;

const Input = styled(TextInput)`
  background-color: #ffffff;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 16px;
  margin-bottom: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const LoginButton = styled(TouchableOpacity)`
  border-radius: 12px;
  padding-vertical: 16px;
  align-items: center;
  margin-top: 8px;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
`;

const ButtonText = styled(Text)`
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
`;

const LinkButton = styled(TouchableOpacity)`
  margin-top: 20px;
  align-items: center;
`;

const LinkText = styled(Text)`
  color: #2563eb;
  font-size: 14px;
  font-weight: 500;
  text-decoration: underline;
`;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');

    const result = await signIn(email, password);

    setLoading(false);

    if (result.error) {
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    } else {
      router.push('/(tabs)');
    }
  };

  return (
    <Container>
      <Content>
        <Title>오늘의 가계부</Title>
        <Subtitle>로그인하여 시작하세요</Subtitle>

        {error ? <ErrorText>{error}</ErrorText> : null}

        <Input
          placeholder="이메일"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />

        <Input
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <LoginButton onPress={handleLogin} disabled={loading}>
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
            <ButtonText>{loading ? '로그인 중...' : '로그인'}</ButtonText>
          </LinearGradient>
        </LoginButton>

        <LinkButton onPress={() => router.push('/(auth)/signup')} disabled={loading}>
          <LinkText>계정이 없으신가요? 회원가입</LinkText>
        </LinkButton>
      </Content>
    </Container>
  );
}