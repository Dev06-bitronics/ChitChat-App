export const API = {
  // HTTP Status messages
  STATUS: {
    SUCCESS: 'Success',
    ERROR: 'Error',
    UNAUTHORIZED: 'Unauthorized',
    FORBIDDEN: 'Forbidden',
    NOT_FOUND: 'Not Found',
    SERVER_ERROR: 'Internal Server Error',
    NETWORK_ERROR: 'Network Error',
    TIMEOUT: 'Request Timeout',
  },

  // Error messages
  ERRORS: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    UNKNOWN_STATUS: 'UNKNOWN',
    UNEXPECTED_ERROR: 'An unexpected error occurred',
    REQUEST_FAILED: 'Request failed',
    CONNECTION_FAILED: 'Connection failed',
    TIMEOUT_ERROR: 'Request timed out',
    USER_NOT_FOUND: 'User account not found. Please login again.',
    RESOURCE_NOT_FOUND: 'Resource not found',
    FORBIDDEN_ACCESS: 'Forbidden access',
    INTERNAL_SERVER_ERROR: 'Internal server error',
    NO_RESPONSE: 'No response from server',
    SERVER_ERROR: 'Server error occurred',
  },

  // Error status codes
  ERROR_STATUS: {
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    NO_RESPONSE: 'NO_RESPONSE',
  },

  // Content types
  CONTENT_TYPES: {
    JSON: 'application/json',
    FORM_DATA: 'multipart/form-data',
    URL_ENCODED: 'application/x-www-form-urlencoded',
  },

  // Default values
  DEFAULTS: {
    TIMEOUT: 25000,
    BASE_URL_FALLBACK: 'http://192.168.0.5:3001/',
  },

  // Toast IDs for preventing duplicates
  TOAST_IDS: {
    NO_INTERNET: 'no-internet',
    BACK_ONLINE: 'back-online',
  },
} as const;
