import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';

const IndexPage = () => {
  const token = useSelector((state: any) => state.user.token);
  const router = useRouter();

  useEffect(() => {
    if (token) {
      router.replace('/chat');
    } else {
      router.replace('/login');
    }
  }, [token, router]);

  return null;
};

export default IndexPage; 