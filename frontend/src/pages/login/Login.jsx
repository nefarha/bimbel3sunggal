import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import styles from './Login.module.css';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import logogrand from '../../assets/logogrand.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        password,
        rememberMe,
      });

      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        const role = response.data.user?.role;
        switch (role) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'tutor':
            navigate('/tutor/dashboard');
            break;
          case 'siswa':
            navigate('/siswa/dashboard');
            break;
          case 'pemilik':
          navigate('/owner/dashboard');
          break;
          default:
            navigate('/');
        }
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.leftSection}>
        <div className={styles.loginCard}>
          <h1 className={styles.brandName}>Grand 3 Sunggal</h1>
          <h2 className={styles.loginTitle}>Login now</h2>
          <p className={styles.welcomeMessage}>Hi, Welcome back 👋</p>

          <form onSubmit={handleLogin} className={styles.loginForm}>
            <div className={styles.formGroup}>
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={styles.inputField}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <div className={styles.passwordInputContainer}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.inputField}
                />
                <span
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <AiOutlineEye /> : <AiOutlineEyeInvisible />}
                </span>
              </div>
            </div>

            <div className={styles.optionsContainer}>
              <div className={styles.rememberMe}>
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="rememberMe">Remember Me</label>
              </div>
              <a href="#" className={styles.forgotPassword}>
                Forgot Password?
              </a>
            </div>

            <button type="submit" className={styles.loginButton}>
              Login
            </button>

            {error && <p className={styles.errorMessage}>{error}</p>}
          </form>
        </div>

        <Link to="/" className={styles.backButton}>
          ← Kembali ke Beranda
        </Link>
      </div>

      <div className={styles.imageContainer}>
        <img src={logogrand} alt="Grand 3 Sunggal" className={styles.brandLogo} />
      </div>
    </div>
  );
};

export default Login;
