// Only needed for Node.js/server-side usage, not for browser/Next.js
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { store } from '@/redux/store/store';
import { clearToken } from '@/redux/reducers/userReducer';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';

// Show/dismiss toasts for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('offline', () => {
    toast.error('No internet connection', { autoClose: false, toastId: 'no-internet' });
  });
  window.addEventListener('online', () => {
    toast.dismiss('no-internet');
    toast.success('Back online', { autoClose: 2500, toastId: 'back-online' });
  });
}

const getBaseUrl = () => {
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  return 'http://192.168.0.5:3001/';
};

export const BASE_URL = getBaseUrl();

class APIError extends Error {
  status: any;
  data: any;
  originalError: any;
  constructor(message: string, status: any, data: any, originalError: any) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
    this.originalError = originalError;
  }
}

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = store.getState().user.token;

    if (token) {
      // Check if token is expired before making the request
      try {
        const decoded: any = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp && decoded.exp < currentTime) {
          // Token is expired, clear it and redirect to login
          store.dispatch(clearToken());
          toast.error('Session expired. Please login again.', {
            autoClose: 3000,
            toastId: 'session-expired',
            onClose: () => {
              if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                window.location.href = '/login';
              }
            }
          });
          return Promise.reject(new APIError('Token expired', 'UNAUTHORIZED', null, null));
        }

        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        // Invalid token format, clear it
        store.dispatch(clearToken());
        toast.error('Invalid session. Please login again.', {
          autoClose: 3000,
          toastId: 'invalid-session',
          onClose: () => {
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
        });
        return Promise.reject(new APIError('Invalid token', 'UNAUTHORIZED', null, null));
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Request interceptor: check network connection (web version)
apiClient.interceptors.request.use(
  async config => {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      toast.error('No internet connection', { autoClose: false, toastId: 'no-internet' });
      throw new APIError(
        'No internet connection',
        'NETWORK_ERROR',
        null,
        new Error('No internet connection'),
      );
    }
    return config;
  },
  error => Promise.reject(error),
);

// Response interceptor: handle errors and status codes
apiClient.interceptors.response.use(
  response => response,
  error => {
    let errorMessage = 'An unexpected error occurred';
    let errorStatus = error.response?.status || 'UNKNOWN';
    let errorData = error.response?.data || null;

    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Handle unauthorized access - clear token and redirect to login
          errorMessage = 'Session expired. Please login again.';
          errorStatus = 'UNAUTHORIZED';

          // Clear the token from Redux store
          store.dispatch(clearToken());

          // Show toast notification
          toast.error(errorMessage, {
            autoClose: 3000,
            toastId: 'session-expired',
            onClose: () => {
              // Redirect to login page after toast closes
              if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                window.location.href = '/login';
              }
            }
          });
          break;
        case 404:
          // Check if this is a user-related endpoint (user profile, auth, etc.)
          const url = error.config?.url || '';
          const method = error.config?.method || '';
          const isUserRelatedEndpoint = url.includes('/user') || 
                                       url.includes('/auth') || 
                                       url.includes('/profile') ||
                                       url.includes('/me') ||
                                       url.includes('/users') ||
                                       (method === 'GET' && (url.includes('/profile') || url.includes('/account')));
          
          if (isUserRelatedEndpoint) {
            // User-related resource not found - likely user was deleted
            errorMessage = 'User account not found. Please login again.';
            errorStatus = 'USER_NOT_FOUND';
            
            // Clear the token from Redux store
            store.dispatch(clearToken());
            
            // Show toast notification
            toast.error(errorMessage, {
              autoClose: 3000,
              toastId: 'user-not-found',
              onClose: () => {
                // Redirect to login page after toast closes
                if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                  window.location.href = '/login';
                }
              }
            });
          } else {
            errorMessage = 'Resource not found';
          }
          break;
        case 403:
          errorMessage = 'Forbidden access';
          break;
        case 500:
          errorMessage = 'Internal server error';
          break;
        default:
          errorMessage =
            error.response.data?.message || 'Server error occurred';
      }
    } else if (error.request) {
      errorMessage = 'No response from server';
      errorStatus = 'NO_RESPONSE';
      // Optionally, clear token and redirect
      store.dispatch(clearToken());
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else {
      errorMessage = error.message;
      errorStatus = 'REQUEST_ERROR';
    }

    return Promise.reject(
      new APIError(errorMessage, errorStatus, errorData, error),
    );
  },
);

// Retry logic using axios-retry
axiosRetry(apiClient, {
  retries: 3,
  retryDelay: retryCount => retryCount * 1000,
  retryCondition: async error => {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      console.log('No network connection, skipping retry');
      return false;
    }
    const status = error.status || error.response?.status;
    const statusStr = String(status);
    const statusNum = Number(status);
    // Don't retry on 401 (unauthorized) or 404 (user not found) errors
    const url = error.config?.url || '';
    const method = error.config?.method || '';
    const isUserRelatedEndpoint = url.includes('/user') || 
                                 url.includes('/auth') || 
                                 url.includes('/profile') ||
                                 url.includes('/me') ||
                                 url.includes('/users') ||
                                 (method === 'GET' && (url.includes('/profile') || url.includes('/account')));
    
    const shouldRetry =
      !status ||
      (statusNum !== 401 && statusNum !== 404 && (statusNum === 500 || statusNum === 503 || statusStr === 'NETWORK_ERROR'));
    console.log(`Retry attempt for ${status} status: ${shouldRetry}`);
    return shouldRetry;
  },
  onRetry: (retryCount, error) => {
    console.log(`Retry attempt ${retryCount}/3:`, {
      status: error.status || error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
  },
});

export const handleErrors = (error: any, source: string) => {
  const errorDetails = {
    source,
    message: error.message,
    status: error.status,
    data: error.data,
    timestamp: new Date().toISOString(),
  };
  console.log('API Error:', errorDetails);
  return errorDetails;
};

// Token refresh utility (if your backend supports it)
export const refreshToken = async (): Promise<boolean> => {
  try {
    const currentToken = store.getState().user.token;
    if (!currentToken) return false;

    // This would call your refresh token endpoint
    // const response = await apiClient.post('auth/refresh', { token: currentToken });
    // if (response.data?.access_token) {
    //   store.dispatch(setUser({ 
    //     token: response.data.access_token, 
    //     name: store.getState().user.name || 'User',
    //     id: store.getState().user.id || ''
    //   }));
    //   return true;
    // }

    // For now, return false to trigger logout
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

// Enhanced error handler with token refresh attempt
export const handleAuthError = async (error: any, source: string) => {
  if (error.status === 'UNAUTHORIZED' || error.status === 401 || error.status === 'USER_NOT_FOUND') {
    // Try to refresh token first
    const refreshSuccess = await refreshToken();
    if (!refreshSuccess) {
      // If refresh fails, clear token and redirect to login
      store.dispatch(clearToken());
      toast.error('Session expired. Please login again.', {
        autoClose: 3000,
        toastId: 'session-expired',
        onClose: () => {
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      });
    }
  }

  return handleErrors(error, source);
};

export { APIError };
export default apiClient;

