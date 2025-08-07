import React, { createContext, useState, useContext, useCallback } from 'react';
import { USER_LOGIN, USER_REGISTER } from '@/api/api';
import { useDispatch } from 'react-redux';
import { setUser, clearToken } from '@/redux/reducers/userReducer';
import { MESSAGES } from '@/constants';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';


interface AuthContextProps {
  loading: boolean;
  logout: () => void;
  signIn: (mobileNumber: string, password: string) => Promise<any>;
  signUp: (name: string, mobileNumber: string, password: string) => Promise<any>;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  // const isTokenValid = useCallback(() => {
  //   try {
  //     const token = store.getState().user.token;
  //     if (!token) return false;

  //     const validation = validateToken(token);
  //     if (!validation.isValid || validation.isExpired) {
  //       // Clear invalid token
  //       dispatch(clearToken());
  //       return false;
  //     }

  //     return true;
  //   } catch (error) {
  //     console.error('Token validation error:', error);
  //     dispatch(clearToken());
  //     return false;
  //   }
  // }, [dispatch]);

  const signIn = async (mobileNumber: string, password: string) => {
    setLoading(true);
    try {
      const response = await USER_LOGIN({ mobileNumber, password });
      if (response && response.status === 200) {
        console.log(response.data.data, "response.data.data------------------->");
        const token = response.data?.data?.access_token;
        const name = response.data?.data?.name || response.data?.data?.user?.name || 'User';
        let userId = response.data?.data?.user?._id;
        if (!userId && token) {
          try {
            const decoded: any = jwtDecode(token);
            console.log(decoded, "decoded------------------->");
            userId = decoded.id || decoded.user_id || decoded.sub || decoded._id;
          } catch (e) {
            console.error(MESSAGES.AUTH.JWT_DECODE_ERROR, e);
          }
        }
        if (token && userId) {
          dispatch(setUser({ token, name, id: userId }));
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        toast.success(response.data?.message || MESSAGES.AUTH.LOGIN_SUCCESS);
        return response;
      } else {
        toast.error(response.data?.message || MESSAGES.AUTH.LOGIN_FAILED);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || MESSAGES.AUTH.LOGIN_FAILED);
      console.log(error, "error------------------->");
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (name: string, mobileNumber: string, password: string) => {
    setLoading(true);
    try {
      const response = await USER_REGISTER({ name, mobileNumber, password });
      if (response && response.status === 201) {
        const token = response.data?.data?.token;
        const userName = response.data?.data?.name || response.data?.data?.user?.name || name;
        let userId = response.data?.data?.user?._id;
        if (!userId && token) {
          try {
            const decoded: any = jwtDecode(token);
            userId = decoded.id || decoded.user_id || decoded.sub || decoded._id;
          } catch (e) {
            console.error(MESSAGES.AUTH.JWT_DECODE_ERROR, e);
          }
        }
        if (token && userId) {
          dispatch(setUser({ token, name: userName, id: userId }));
        }
        toast.success(response.data?.message || MESSAGES.AUTH.SIGNUP_SUCCESS);
        return response;
      } else {
        toast.error(response.data?.message || MESSAGES.AUTH.SIGNUP_FAILED);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || MESSAGES.AUTH.SIGNUP_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      toast.success(MESSAGES.AUTH.LOGOUT_SUCCESS);
      dispatch(clearToken());
      // const response = await USER_LOGOUT();
      // if (response && response.status === 201) {
      //   toast.success('You have been logged out successfully.');
      // } else {
      //   toast.error(response?.data?.message || 'Logout failed');
      // }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || MESSAGES.AUTH.LOGOUT_FAILED);
    }
  }, [dispatch]);

  return (
    <AuthContext.Provider value={{ signIn, signUp, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(MESSAGES.AUTH.AUTH_CONTEXT_ERROR);
  }
  return context;
};