import axios from 'axios';
import axiosRetry from 'axios-retry';
import { store } from '@/redux/store/store';
import { clearToken } from '@/redux/reducers/userReducer';
import { MESSAGES, API } from '@/constants';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';

if (typeof window !== 'undefined') {
  window.addEventListener('offline', () => {
    toast.error(MESSAGES.NETWORK.NO_INTERNET, { autoClose: false, toastId: API.TOAST_IDS.NO_INTERNET });
  });
  window.addEventListener('online', () => {
    toast.dismiss(API.TOAST_IDS.NO_INTERNET);
    toast.success(MESSAGES.NETWORK.BACK_ONLINE, { autoClose: 2500, toastId: API.TOAST_IDS.BACK_ONLINE });
  });
}

const getBaseUrl = () => {
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  return API.DEFAULTS.BASE_URL_FALLBACK;
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
  timeout: API.DEFAULTS.TIMEOUT,
  headers: {
    'Content-Type': API.CONTENT_TYPES.JSON,
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = store.getState().user.token;

    if (token) {
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

// checking network connection
apiClient.interceptors.request.use(
  async config => {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      toast.error(MESSAGES.NETWORK.NO_INTERNET, { autoClose: false, toastId: API.TOAST_IDS.NO_INTERNET });
      throw new APIError(
        MESSAGES.NETWORK.NO_INTERNET,
        API.ERRORS.NETWORK_ERROR,
        null,
        new Error(MESSAGES.NETWORK.NO_INTERNET),
      );
    }
    return config;
  },
  error => Promise.reject(error),
);

// handling errors and status codes globally
apiClient.interceptors.response.use(
  response => response,
  error => {
    let errorMessage: string = API.ERRORS.UNEXPECTED_ERROR;
    let errorStatus = error.response?.status || API.ERRORS.UNKNOWN_STATUS;
    let errorData = error.response?.data || null;

    if (error.response) {
      switch (error.response.status) {
        case 401:
          errorMessage = error.response.data?.message || 'Unauthorized access';
          errorStatus = 'UNAUTHORIZED';
          store.dispatch(clearToken());

          // Show toast notification
          // toast.error(errorMessage, {
          //   autoClose: 3000,
          //   toastId: 'session-expired',
          //   onClose: () => {
          //     // Redirect to login page after toast closes
          //     if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          //       window.location.href = '/login';
          //     }
          //   }
          // });
          break;
        case 404:
          const url = error.config?.url || '';
          const method = error.config?.method || '';
          const isUserRelatedEndpoint = url.includes('/user') ||
            url.includes('/auth') ||
            url.includes('/profile') ||
            url.includes('/me') ||
            url.includes('/users') ||
            (method === 'GET' && (url.includes('/profile') || url.includes('/account')));

          if (isUserRelatedEndpoint) {
            errorMessage = API.ERRORS.USER_NOT_FOUND;
            errorStatus = API.ERROR_STATUS.USER_NOT_FOUND;
            store.dispatch(clearToken());

            toast.error(errorMessage, {
              autoClose: 3000,
              toastId: 'user-not-found',
              onClose: () => {
                if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                  window.location.href = '/login';
                }
              }
            });
          } else {
            errorMessage = API.ERRORS.RESOURCE_NOT_FOUND;
          }
          break;
        case 403:
          errorMessage = API.ERRORS.FORBIDDEN_ACCESS;
          break;
        case 500:
          errorMessage = API.ERRORS.INTERNAL_SERVER_ERROR;
          break;
        default:
          errorMessage =
            error.response.data?.message || API.ERRORS.SERVER_ERROR;
      }
    } else if (error.request) {
      errorMessage = API.ERRORS.NO_RESPONSE;
      errorStatus = API.ERROR_STATUS.NO_RESPONSE;
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

    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

// Enhanced error handler with token refresh attempt
export const handleAuthError = async (error: any, source: string) => {
  if (error.status === 'UNAUTHORIZED' || error.status === 401 || error.status === 'USER_NOT_FOUND') {
    const refreshSuccess = await refreshToken();
    if (!refreshSuccess) {
      store.dispatch(clearToken());
      // toast.error('Session expired. Please login again.', {
      //   autoClose: 3000,
      //   toastId: 'session-expired',
      //   onClose: () => {
      //     if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      //       window.location.href = '/login';
      //     }
      //   }
      // });
    }
  }

  return handleErrors(error, source);
};

export { APIError };
export default apiClient;

