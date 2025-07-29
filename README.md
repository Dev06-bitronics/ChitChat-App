# Chat App Frontend

A modern, real-time chat application frontend built with React, Next.js, and Socket.io. This project is structured for scalability and maintainability, following best practices and supporting MVVM architecture with robust authentication handling.

---

## Table of Contents
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Main Features](#main-features)
- [Authentication System](#authentication-system)
- [Setup & Installation](#setup--installation)
- [Environment Configuration](#environment-configuration)
- [Key Implementation Notes](#key-implementation-notes)
- [API Error Handling](#api-error-handling)
- [Tech Stack](#tech-stack)
- [Development Guidelines](#development-guidelines)

---

## Architecture

- **Current:** MVVM (Model-View-ViewModel) architecture.
  - **Model:** API/data logic (`api/`, `utils/`)
  - **ViewModel:** State and UI logic (custom hooks, context, redux)
  - **View:** Pure UI components (`components/`, `screens/`)

### Key Architectural Decisions:
- **Redux Persist** for state persistence across sessions
- **Centralized API handling** with axios interceptors
- **JWT-based authentication** with automatic token validation
- **Theme-based styling** with centralized color management
- **Modular component structure** for reusability

---

## Folder Structure

```
chat-app-frontend/
├── api/               # API utilities and constants
│   ├── api.ts         # API endpoint definitions
│   └── apiConst.ts    # Axios configuration and interceptors
├── components/        # Reusable UI components
│   ├── ChatCard/      # Individual chat card component
│   ├── FloatingMenuModal/ # Context menu modal
│   ├── ImageModal/    # Image display modal
│   ├── Loader/        # Loading spinner component
│   ├── MediaEmbed/    # Media embedding component
│   ├── MessageContextMenu/ # Message context menu
│   ├── NoDataFound/   # Empty state component
│   └── SettingsModal/ # Settings modal component
├── constants/         # App-wide constants
│   └── regex.ts       # Centralized regex patterns
├── context/           # React context providers
│   ├── AuthContext.tsx # Authentication context
│   └── SocketContext.tsx # Socket.io context
├── pages/             # Next.js pages
│   ├── _app.tsx       # App wrapper with providers
│   ├── index.tsx      # Home page
│   ├── login.tsx      # Login page
│   └── chat.tsx       # Chat page
├── redux/             # Redux store and reducers
│   ├── reducers/      # Redux reducers
│   └── store/         # Store configuration
├── screens/           # Top-level app screens/views
│   ├── ChatScreen/    # Main chat interface
│   └── Login/         # Login screen
├── styles/            # Global styles
│   └── globals.css    # Global CSS
├── theme/             # Theme configuration
│   ├── themeConfig.ts # Theme colors and settings
│   └── themeContext.tsx # Theme context provider
├── utils/             # Utility/helper functions
│   └── helperFunctions.tsx # Helper functions and token validation
├── public/            # Static assets
├── package.json       # Project dependencies
├── next.config.ts     # Next.js configuration
├── tsconfig.json      # TypeScript configuration
└── README.md          # Project documentation
```

---

## Main Features

### Core Functionality
- **Real-time chat** with Socket.io integration
- **User authentication** with JWT tokens and automatic session management
- **Online/offline status** and last seen indicators
- **Typing indicator** ("user is typing...")
- **Unread message badges** with count tracking
- **Message reactions** (Instagram-style reactions)
- **File and media sharing** support
- **Responsive UI** with modern design
- **Dark/Light theme** support

### Authentication Features
- **Secure JWT-based authentication**
- **Automatic token validation** and expiration handling
- **Session persistence** across browser sessions
- **Automatic logout** on token expiration
- **Graceful error handling** for authentication failures

### UI/UX Features
- **Modern, responsive design**
- **Smooth animations** and transitions
- **Context menus** for message actions
- **Image modal** for media viewing
- **Loading states** and error handling
- **Toast notifications** for user feedback

---

## Authentication System

### Overview
The application uses a robust JWT-based authentication system with automatic token management and validation.

### Key Components

#### 1. **API Interceptors** (`api/apiConst.ts`)
- **Request Interceptor**: Automatically attaches JWT tokens to requests
- **Response Interceptor**: Handles 401 errors and token expiration
- **Token Validation**: Checks token expiration before making requests
- **Automatic Logout**: Clears invalid tokens and redirects to login

#### 2. **Token Validation Utilities** (`utils/helperFunctions.tsx`)
```typescript
// Check if token is expired
isTokenExpired(token: string): boolean

// Get token expiration time
getTokenExpirationTime(token: string): Date | null

// Comprehensive token validation
validateToken(token: string): { isValid: boolean; isExpired: boolean; decoded?: any }

// Check authentication status
isAuthenticated(): boolean

// Safely get auth token
getAuthToken(): string | null
```

#### 3. **Authentication Context** (`context/AuthContext.tsx`)
- **Login/Signup**: Handle user authentication
- **Token Management**: Store and manage JWT tokens
- **Session Validation**: Check token validity
- **Logout**: Clear session and redirect

### Authentication Flow
1. **Login**: User provides credentials → Server returns JWT token
2. **Token Storage**: Token stored in Redux with persistence
3. **Request Authorization**: Token automatically attached to API requests
4. **Token Validation**: Interceptor checks token expiration before requests
5. **Session Expiry**: Automatic logout and redirect on token expiration

---

## Setup & Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Backend server running (for API endpoints)

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd chat-app-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   # Create .env file at project root
   cp .env.example .env
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Open [http://localhost:3000](http://localhost:3000) in your browser

---

## Environment Configuration

Create a `.env` file at the project root with the following variables:

```env
# API Configuration
NEXT_PUBLIC_BASE_URL=http://192.168.0.5:3001/

# Optional: Override default API URL
# NEXT_PUBLIC_BASE_URL=http://localhost:3001/
```

### Environment Variables
- **`NEXT_PUBLIC_BASE_URL`**: Backend API server URL (required)
- **`NEXT_PUBLIC_SOCKET_URL`**: Socket.io server URL (optional, defaults to BASE_URL)

---

## Key Implementation Notes

### Socket Events
- **Connection**: `connect`, `disconnect`
- **Authentication**: `authenticate`, `auth_success`, `auth_error`
- **Chat**: `message`, `typing`, `stop_typing`, `user_typing`
- **Status**: `user_online`, `user_offline`, `last_seen`

### State Management
- **Redux**: Global state management with persistence
- **Context**: Authentication and socket state
- **Local State**: Component-specific state

### Styling Guidelines
- **CSS Modules**: Component-scoped styling
- **Theme System**: Centralized color management via `themeConfig`
- **Responsive Design**: Mobile-first approach
- **Dark Theme**: Global dark theme support (#001A3D)

### Code Organization
- **MVVM Pattern**: Separation of concerns between View, ViewModel, and Model
- **Custom Hooks**: Reusable logic extraction
- **Type Safety**: Full TypeScript implementation
- **Error Boundaries**: Graceful error handling

---

## API Error Handling

### Automatic Error Management
The application includes comprehensive error handling for various scenarios:

#### 1. **Network Errors**
- Offline detection and user notification
- Automatic retry for transient failures
- Graceful degradation when offline

#### 2. **Authentication Errors**
- **401 Unauthorized**: Automatic logout and redirect to login
- **Token Expiration**: Proactive token validation
- **Invalid Tokens**: Automatic cleanup and session reset

#### 3. **Server Errors**
- **500 Internal Server Error**: Retry with exponential backoff
- **503 Service Unavailable**: Automatic retry logic
- **404 Not Found**: User-friendly error messages

#### 4. **User Feedback**
- **Toast Notifications**: Real-time error feedback
- **Loading States**: Visual feedback during operations
- **Error Boundaries**: Graceful component error handling

### Error Handling Utilities
```typescript
// Handle API errors with context
handleErrors(error: any, source: string): ErrorDetails

// Handle authentication-specific errors
handleAuthError(error: any, source: string): Promise<ErrorDetails>

// Token refresh utility
refreshToken(): Promise<boolean>
```

---

## Tech Stack

### Frontend Framework
- **React 18**: Modern React with hooks and concurrent features
- **Next.js 15**: Full-stack React framework
- **TypeScript**: Type-safe JavaScript development

### State Management
- **Redux Toolkit**: Modern Redux with simplified API
- **Redux Persist**: State persistence across sessions
- **React Context**: Component-level state management

### Real-time Communication
- **Socket.io Client**: Real-time bidirectional communication
- **Axios**: HTTP client with interceptors and retry logic

### Styling & UI
- **CSS Modules**: Component-scoped styling
- **React Icons**: Icon library
- **React Toastify**: Toast notifications
- **Date-fns**: Date manipulation utilities

### Development Tools
- **ESLint**: Code linting and formatting
- **TypeScript**: Static type checking
- **Next.js DevTools**: Development utilities

---

## Development Guidelines

### Code Style
- **TypeScript**: Use strict typing for all components and functions
- **Functional Components**: Prefer functional components with hooks
- **Custom Hooks**: Extract reusable logic into custom hooks
- **Error Boundaries**: Implement error boundaries for robust error handling

### Component Structure
```typescript
// Example component structure
interface ComponentProps {
  // Props interface
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Custom hooks
  const { data, loading, error } = useCustomHook();
  
  // Event handlers
  const handleClick = useCallback(() => {
    // Handler logic
  }, []);
  
  // Render
  return (
    <div className={styles.container}>
      {/* Component JSX */}
    </div>
  );
};

export default Component;
```

### File Naming Conventions
- **Components**: PascalCase (e.g., `ChatCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useChatSocket.ts`)
- **Utilities**: camelCase (e.g., `helperFunctions.tsx`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `regex.ts`)

### Best Practices
- **Centralized Constants**: Use `constants/regex.ts` for all regex patterns
- **Theme Colors**: Always use `themeConfig` for color values
- **Error Handling**: Implement comprehensive error handling
- **Performance**: Use React.memo, useMemo, and useCallback appropriately
- **Accessibility**: Follow WCAG guidelines for accessibility

---

## Contributing

### Development Workflow
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Review Guidelines
- **Type Safety**: Ensure all code is properly typed
- **Error Handling**: Include appropriate error handling
- **Testing**: Add tests for new features
- **Documentation**: Update documentation as needed
- **Performance**: Consider performance implications

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

For support and questions:
- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check this README and inline code comments

---

*Built with ❤️ using modern web technologies*
