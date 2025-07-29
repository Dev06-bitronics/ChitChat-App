import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import ChatScreen from '@/screens/ChatScreen/ChatScreen';

const ChatPage: React.FC = () => {
  const token = useSelector((state: any) => state.user.token);
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.replace('/login');
    }
  }, [token, router]);

  if (!token) return null;
  return <ChatScreen />;
};

export default ChatPage; 