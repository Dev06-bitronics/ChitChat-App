export const VALIDATION = {
  // Login form validation
  LOGIN: {
    REQUIRED_FIELDS: 'Please enter both mobile number and password',
    INVALID_PHONE: 'Enter a valid 10-digit mobile number',
    INVALID_PASSWORD: 'Password must be at least 8 characters and include a number',
  },

  // Signup form validation
  SIGNUP: {
    REQUIRED_FIELDS: 'Please fill all fields',
    NAME_TOO_SHORT: 'Name must be at least 2 characters',
    INVALID_PHONE: 'Enter a valid 10-digit mobile number',
    INVALID_PASSWORD: 'Password must be at least 8 characters and include a number',
  },

  // General validation messages
  GENERAL: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_FORMAT: 'Invalid format',
    TOO_SHORT: 'Too short',
    TOO_LONG: 'Too long',
    INVALID_EMAIL: 'Please enter a valid email address',
    PASSWORDS_DONT_MATCH: 'Passwords do not match',
  },

  // Group validation
  GROUP: {
    NAME_REQUIRED: 'Group name is required',
    SELECT_USERS: 'Please select at least one user',
    MAX_USERS_EXCEEDED: 'Maximum number of users exceeded',
  },

  // Message validation
  MESSAGE: {
    EMPTY_MESSAGE: 'Message cannot be empty',
    MESSAGE_TOO_LONG: 'Message is too long',
    INVALID_FILE_TYPE: 'Invalid file type',
    FILE_TOO_LARGE: 'File is too large',
  },
} as const;
