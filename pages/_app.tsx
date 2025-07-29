import React from 'react';
import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/redux/store/store';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SocketProvider } from '@/context/SocketContext';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/theme/themeContext';
import '../screens/ChatScreen/ChatScreen.module.css';
import '../screens/Login/LoginScreen.module.css';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthProvider>
          <SocketProvider>
            <ThemeProvider>
              <ToastContainer position="top-center" autoClose={2500} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
              <Component {...pageProps} />
            </ThemeProvider>
          </SocketProvider>
        </AuthProvider>
      </PersistGate>
    </Provider>
  );
}

export default MyApp; 