export const MESSAGES = {
  // Authentication messages
  AUTH: {
    LOGIN_SUCCESS: 'Login successful!',
    LOGIN_FAILED: 'Login failed',
    SIGNUP_SUCCESS: 'Signup successful!',
    SIGNUP_FAILED: 'Signup failed',
    LOGOUT_SUCCESS: 'Logged out successfully',
    LOGOUT_FAILED: 'Logout failed',
    TOKEN_VALIDATION_ERROR: 'Token validation error',
    JWT_DECODE_ERROR: 'Failed to decode JWT',
    AUTH_CONTEXT_ERROR: 'useAuth must be used within an AuthProvider',
  },

  // Network and connection messages
  NETWORK: {
    NO_INTERNET: 'No internet connection',
    BACK_ONLINE: 'Back online',
    CONNECTION_ERROR: 'An unexpected error occurred',
    SOCKET_NOT_AVAILABLE: 'Socket connection not available',
  },

  // Chat and messaging
  CHAT: {
    CHAT_HISTORY_FAILED: 'Failed to fetch chat history',
    GROUP_CREATED_SUCCESS: 'Group created successfully',
    GROUP_CREATION_FAILED: 'Failed to create group',
    GROUP_DELETED_SUCCESS: 'Group deleted successfully',
    MUST_JOIN_GROUP: 'You must join the group to send messages',
    USERS_ADDED_TO_GROUP: (addedBy: string, userNames: string) =>
      `${addedBy} added ${userNames} to the group`,
    USERS_REMOVED_FROM_GROUP: (removedBy: string, userNames: string) =>
      `${removedBy} removed ${userNames} from the group`,
    FAILED_TO_FETCH_USERS: 'Failed to fetch users',
    MESSAGE_PINNED: 'New message pinned',
    MESSAGE_UNPINNED: 'Message unpinned',
    THREAD_REPLY_ACTIVATED: 'Thread reply mode activated',
    GROUP_JOINED_SUCCESS: 'Successfully joined the group',
    GROUP_JOIN_FAILED: 'Failed to join group',
    GROUP_LEAVE_FAILED: 'Failed to leave group',
    GROUP_LEFT_SUCCESS: 'You left the group successfully',
    ADDED_TO_GROUP: 'You have been added to a group. Click "Join Group" to participate.',
    NO_CHATS_YET: 'No chats here yet...',
    DELETE_MESSAGE_TITLE: 'Delete Message',
    DELETE_MESSAGE_CONFIRM: 'Are you sure you want to permanently delete this message?',
    THIS_MESSAGE: 'this message',
    UNKNOWN_USER: 'Unknown user',
    MEMBERS: 'members',
    CREATED_BY: 'Created by:',
    JOIN_GROUP: 'Join Group',
    EDITED: '(edited)',
    SENT_IMAGE: 'sent image',
    AUDIO_NOT_SUPPORTED: 'Your browser does not support the audio element.',
    VIDEO_NOT_SUPPORTED: 'Your browser does not support the video tag.',
    MESSAGE_EDITED_SUCCESS: 'Message edited successfully',
    MESSAGE_EDIT_FAILED: 'Failed to edit message',
    MESSAGE_PINNED_SUCCESS: 'Message pinned successfully',
    MESSAGE_UNPINNED_SUCCESS: 'Message unpinned successfully',
  },

  // Loading messages
  LOADING: {
    DEFAULT: 'loading...',
    USERS: 'Loading users...',
    AVAILABLE_USERS: 'Loading available users...',
  },

  // SSO messages
  SSO: {
    FACEBOOK_COMING_SOON: 'Facebook SSO coming soon!',
    GITHUB_COMING_SOON: 'GitHub SSO coming soon!',
  },

  // General success/error messages
  GENERAL: {
    SUCCESS: 'Success',
    ERROR: 'Error',
    FAILED: 'Failed',
    UNKNOWN_ERROR: 'An unexpected error occurred',
  },
} as const;
