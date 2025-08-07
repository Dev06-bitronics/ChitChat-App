export const UI = {
  // Login/Signup page
  LOGIN: {
    SIGN_IN: 'Sign In',
    SIGN_UP: 'Sign Up',
    MOBILE_PLACEHOLDER: 'Mobile Number',
    PASSWORD_PLACEHOLDER: 'Password',
    NAME_PLACEHOLDER: 'Full Name',
    TAGLINE: 'Connect. Chat. Share.',
    MAIN_DESCRIPTION: 'Talk to strangers, Make friends!',
    SECONDARY_DESCRIPTION: 'Experience a random chat alternative to find friends, connect with people, and chat with strangers from all over the world!',
    LOGO_ALT: 'Chat App Logo',
  },

  // Common buttons and actions
  BUTTONS: {
    CANCEL: 'Cancel',
    DELETE: 'DELETE',
    CREATE: 'Create',
    ADD: 'Add',
    REMOVE: 'Remove',
    CLOSE: '×',
    SAVE: 'Save',
    EDIT: 'Edit',
    SUBMIT: 'Submit',
  },

  // Menu options
  MENU: {
    MENTIONS: 'Mentions',
    NEW_DIRECT_MESSAGE: 'New Direct Message',
    NEW_GROUP: 'New Group',
    DARK_MODE: 'Dark Mode',
    SIGN_OUT: 'Sign Out',
  },

  // Context menu options
  CONTEXT_MENU: {
    REPLY: 'Reply',
    THREAD_REPLY: 'Thread Reply',
    EDIT_MESSAGE: 'Edit Message',
    PIN_MESSAGE: 'Pin Message',
    UNPIN_MESSAGE: 'Unpin Message',
    DELETE_MESSAGE: 'Delete Message',
  },

  // Chat header options
  CHAT_HEADER: {
    GROUP_SETTINGS: 'Group Settings',
    MENU: 'Menu',
    LEAVE_GROUP: '🚪 Leave Group',
    ADD_USERS: '👤 Add Users',
    REMOVE_USERS: '👤 Remove Users',
    DELETE_GROUP: '🗑️ Delete Group',
  },

  // Message options
  MESSAGE: {
    MESSAGE_OPTIONS: 'Message options',
    EDITING_MESSAGE: 'Editing message',
    SAVE_EDIT: 'Save',
    CANCEL_EDIT: 'Cancel',
  },

  // Modal titles and content
  MODALS: {
    CREATE_NEW_GROUP: 'Create New Group',
    GROUP_NAME_PLACEHOLDER: 'Group Name (optional)',
    SELECT_USERS_INSTRUCTION: 'Select users to add to the group:',
    ADD_USERS_TO_GROUP: (groupName: string) => `Add Users to "${groupName}"`,
    REMOVE_USERS_FROM_GROUP: (groupName: string) => `Remove Users from "${groupName}"`,
    SELECT_USERS_TO_ADD: 'Select users to add to the group:',
    SELECT_USERS_TO_REMOVE: 'Select users to remove from the group:',
  },

  // Status indicators
  STATUS: {
    ONLINE: 'Online',
    OFFLINE: 'Offline',
    TYPING: 'typing...',
    LAST_SEEN: 'Last seen',
  },

  // Empty states and no data messages
  EMPTY_STATES: {
    NO_USERS_AVAILABLE_ADD: 'No users available to add to this group.',
    NO_USERS_AVAILABLE_REMOVE: 'No users available to remove from this group.',
    NO_USERS_AVAILABLE_GROUP: 'No users available to add to the group.',
    NO_DATA_FOUND_ALT: 'No data found',
  },

  // Generic labels
  LABELS: {
    USER: 'User',
    USERS: 'Users',
    GROUP: 'Group',
    MESSAGE: 'Message',
    MESSAGES: 'Messages',
    CONVERSATION: 'Conversation',
    CHAT: 'Chat',
  },

  // File and media
  MEDIA: {
    IMAGE_ALT: 'Image',
    FILE_ALT: 'File',
    AVATAR_ALT: 'Avatar',
  },
} as const;
