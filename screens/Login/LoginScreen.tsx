import React, { useState } from 'react';
//@ts-ignore
import styles from './LoginScreen.module.css';
import { FaUser, FaLock, FaPhone, FaRegSmile } from 'react-icons/fa';
import Image from 'next/image';
import { EMAIL_REGEX, PASSWORD_REGEX, PHONE_REGEX } from '@/constants/regex';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GOOGLE_AUTH, USER_LOGIN, USER_REGISTER } from '@/api/api';
import { useDispatch } from 'react-redux';
import { setUser } from '@/redux/reducers/userReducer';
import Loader from '@/components/Loader/Loader';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '@/context/AuthContext';

const LoginScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    loginNumber: '',
    loginPassword: '',
    signupName: '',
    signupNumber: '',
    signupPassword: '',
  });

  const { signIn, signUp, loading } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.loginNumber || !form.loginPassword) {
      toast.error('Please enter both mobile number and password');
      return;
    }
    if (!PHONE_REGEX.test(form.loginNumber)) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    if (!PASSWORD_REGEX.test(form.loginPassword)) {
      toast.error('Password must be at least 8 characters and include a number');
      return;
    }
    await signIn(form.loginNumber, form.loginPassword);
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.signupName || !form.signupNumber || !form.signupPassword) {
      toast.error('Please fill all fields');
      return;
    }
    if (form.signupName.length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    if (!PHONE_REGEX.test(form.signupNumber)) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    if (!PASSWORD_REGEX.test(form.signupPassword)) {
      toast.error('Password must be at least 8 characters and include a number');
      return;
    }
    await signUp(form.signupName, form.signupNumber, form.signupPassword);
    setForm((prev) => ({ ...prev, signupName: '', signupNumber: '', signupPassword: '' }));
    setIsLogin(true);
  };


  const handleGoogle = async () => {
    try {
      const response = await GOOGLE_AUTH();
      if (response && response.status === 200) {
        // handle google login
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Signup failed');
    }
  }
  const handleFacebook = () => toast.info('Facebook SSO coming soon!');
  const handleGithub = () => toast.info('GitHub SSO coming soon!');

  return (
    <div className={styles.loginBg}>
      <Loader visible={loading} message='loading...' />
      {/* <ToastContainer position="top-center" autoClose={2500} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover /> */}
      {/* Animated SVG Waves Background */}
      <svg className={styles.wavesBg} viewBox="0 0 1440 220" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill="#fff" fillOpacity="0.18" d="M0,160L60,154.7C120,149,240,139,360,154.7C480,171,600,213,720,218.7C840,224,960,192,1080,176C1200,160,1320,160,1380,160L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" />
        <path fill="#1976d2" fillOpacity="0.13" d="M0,200L60,186.7C120,173,240,147,360,154.7C480,163,600,205,720,213.3C840,221,960,195,1080,186.7C1200,179,1320,189,1380,194.7L1440,200L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" />
      </svg>
      {/* Animated Chat Bubbles Background */}
      <div className={styles.bubblesBg}>
        <div className={styles.bubble1}></div>
        <div className={styles.bubble2}></div>
        <div className={styles.bubble3}></div>
        <div className={styles.bubble4}></div>
        <div className={styles.bubble5}></div>
        <div className={styles.bubble6}></div>
        <div className={styles.bubble7}></div>
        <div className={styles.bubble8}></div>
      </div>
      <div className={styles.centerBox}>
        <div className={styles.logoSection}>
          <img src="https://www.chitchat.gg/images/logo-darkmode.png" alt="Chat App Logo" className={styles.logo} />
          <p className={styles.animatedSubtitle}>Connect. Chat. Share. <FaRegSmile style={{ color: 'var(--color-primary)', marginLeft: 4, verticalAlign: 'middle' }} /></p>
        </div>
        <div className={styles.mainTypewriterDescription}>
          Talk to strangers, Make friends!
        </div>
        <div className={styles.secondaryDescription}>
          Experience a random chat alternative to find friends, connect with people, and chat with strangers from all over the world!
        </div>
        <div className={styles.formToggleWrap}>
          <button
            className={`${styles.toggleButton} ${isLogin ? styles.active : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button
            className={`${styles.toggleButton} ${!isLogin ? styles.active : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>
        <form
          className={styles.form}
          onSubmit={isLogin ? onLogin : onSignup}
          autoComplete="off"
        >
          {!isLogin && (
            <div className={styles.inputGroup}>
              <FaUser className={styles.inputIcon} />
              <input
                type="text"
                placeholder="Full Name"
                name="signupName"
                value={form.signupName}
                onChange={handleInputChange}
                className={styles.input}
                autoComplete="off"
              />
            </div>
          )}
          <div className={styles.inputGroup}>
            <FaPhone className={styles.inputIcon} />
            <input
              type="tel"
              placeholder="Mobile Number"
              name={isLogin ? 'loginNumber' : 'signupNumber'}
              value={isLogin ? form.loginNumber : form.signupNumber}
              onChange={handleInputChange}
              className={styles.input}
              autoComplete="off"
            />
          </div>
          <div className={styles.inputGroup}>
            <FaLock className={styles.inputIcon} />
            <input
              type="password"
              placeholder="Password"
              name={isLogin ? 'loginPassword' : 'signupPassword'}
              value={isLogin ? form.loginPassword : form.signupPassword}
              onChange={handleInputChange}
              className={styles.input}
              autoComplete="off"
            />
          </div>
          <button type="submit" className={styles.submitBtn}>
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        {/* SSO Divider and Buttons */}
        <div className={styles.ssoOptions}>
          <div className={styles.ssoDivider}>or</div>
          <div className={styles.ssoRow}>
            <button className={`${styles.ssoButton} ${styles.ssoButtonGoogle}`} onClick={handleGoogle} type="button" title="Sign in with Google">
              <Image src="/google.png" alt="Google" className={styles.ssoIcon} draggable="false" width={32} height={32} />
            </button>
            <button className={`${styles.ssoButton} ${styles.ssoButtonGoogle}`} onClick={handleFacebook} type="button" title="Sign in with Facebook">
              <Image src="/facebook.png" alt="Facebook" className={styles.ssoIcon} draggable="false" width={32} height={32} />
            </button>
            <button className={`${styles.ssoButton} ${styles.ssoButtonGoogle}`} onClick={handleGithub} type="button" title="Sign in with GitHub">
              <Image src="/github.png" alt="GitHub" className={styles.ssoIcon} draggable="false" width={32} height={32} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen; 