import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import LoginScreen from '@/screens/Login/LoginScreen';

const LoginPage: React.FC = () => {
  const token = useSelector((state: any) => state.user.token);
  const router = useRouter();

  useEffect(() => {
    if (token) {
      router.replace('/chat');
    }
  }, [token, router]);

  if (token) return null;
  return <LoginScreen />;
};

export default LoginPage; 