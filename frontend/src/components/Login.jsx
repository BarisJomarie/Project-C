import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import '../styles/login.css';
import '../styles/style.css';
import earist_logo from '../assets/earist_logo.png';
import arrow_left from '../assets/keyboard-arrow-left.svg';
import close from '../assets/close.svg';
import baris from '../assets/baris.png';
import bautista from '../assets/bautista.jpg';
import cabantog from '../assets/cabantog.jpg';
import fuentiblanca from '../assets/fuentiblanca.jpg';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../utils/toast';
import Loading from '../utils/Loading';


const Login = () => {
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = login, 2 = OTP verification
  const [showPassword, setShowPassword] = useState(false);
  const [researchersVisible, setResearchersVisible] = useState(false);
  const navigate = useNavigate();
  const researchersRef = useRef(null);
  const arrowRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        researchersVisible &&
        researchersRef.current &&
        !researchersRef.current.contains(event.target) &&
        arrowRef.current &&
        !arrowRef.current.contains(event.target)
      ) {
        setResearchersVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [researchersVisible]);


  // Step 1: Request OTP
  const handleLogin = async (e) => {
    e.preventDefault();

    // if (!isValidPassword(loginData.password)) {
    //   showToast(
    //     'warning',
    //     'Invalid Password',
    //     'Password must include uppercase, lowercase, numbers, and symbols.'
    //   );
    //   return;
    // }

    try {
      setLoading(true);

      const response = await axios.post(`${API_URL}/api/auth/signin`, loginData);
      setStep(2); // go to OTP step
    } catch (e) {
      console.error('Login Error: ', e);
      if (e.response) {
        const status = e.response.status;
        const message = e.response.data?.message || 'Something went wrong.';


        if (status === 403) {
          // Account locked
          showToast('error', 'Account Locked', message);
        } else if (status === 400 || status === 401) {
          // Wrong credentials
          showToast('warning', 'Sign In', message);
        } else {
          // Other errors
          showToast('error', 'Sign In', message);
        }
      } else {
        showToast('error', 'Sign In', 'No response from server.');
      }
    }finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const [resendTimer, setResendTimer] = useState(0);
  const [otpTimer, setOtpTimer] = useState(300); // 5 minutes countdown

  // OTP timer countdown
useEffect(() => {
  let countdown;
  if (step === 2 && otpTimer > 0) {
    countdown = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
  }
  return () => clearTimeout(countdown);
}, [otpTimer, step]);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);
 
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/auth/verify-otp`, {
        email: loginData.email,
        otp,
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userId', user.id);
      localStorage.setItem('role', user.role);
      localStorage.setItem('department_id', user.department_id);

      showToast('success', 'Sign In', 'Login verified successfully!');
      if (user.role === 'admin') {
        navigate('/user/homepage');
      } else if (user.role === 'rph' || user.role === 'faculty') {
        navigate(`/user/department/${user.department_id}`);
      }
      
    } catch (e) {
      const message = e.response?.data?.message || 'Invalid or expired verification code.';
      showToast('warning', 'Verification', message);
    }finally {
      setLoading(false);
    }
  };


  const handleResendOTP = async () => {
  if (resendTimer > 0) return;

  try {
    setLoading(true);

    await axios.post(`${API_URL}/api/auth/resend-otp`, { email: loginData.email });
    showToast('success', 'Verification', 'New code sent to your email.');
    setResendTimer(30); // 30-second cooldown
  } catch (err) {
    console.error(err);
    showToast('error', 'Verification', 'Failed to resend code. Try again later.');
  }finally {
    setLoading(false);
  }
};

  const toSignUp = () => navigate('/signup');
  const forgotPassword = () => navigate('/forgot-password');

  useEffect(() => {
    const timer = setTimeout(() => {
      const content = document.querySelector('.login-content');
      if (content) content.style.opacity = '1';
    }, 1000);


    return () => clearTimeout(timer);
  }, []);


  return (
    <>
      {loading && <Loading text='Signing IN...'/>}
      <div className='login-bg'>
        <div className='login-container'>
          <img src={earist_logo} alt='earist-logo' className='login-img' draggable='false' />
          {/* Use conditional form based on step */}
          <form className='login-form' onSubmit={step === 1 ? handleLogin : handleVerifyOtp}>
            <div className='login-content'>
              <h1>SDG Classification and Analytics</h1>


              {/* STEP 1: EMAIL + PASSWORD */}
              {step === 1 && (
                <>
                  <div className='login-input-box'>
                    <input
                      type='email'
                      id='email'
                      placeholder=' '
                      name='email'
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                    <label htmlFor='email'>Email</label>
                  </div>


                   <div className='login-input-box'>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id='password'
                      placeholder=' '
                      name='password'
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                    <label htmlFor='password'>Password</label>
                    <span
                      className='material-symbols-outlined p-input-icon'
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                    {/* <small>
                      Must be 12–14 characters, with uppercase, lowercase, number, and symbol.
                    </small> */}
                  </div>


                  <button type='submit'>Sign In</button>
                  <div className='hyperlink-box'>
                    {/*<p onClick={toSignUp}>Create an Account</p>*/}
                    <p onClick={() => navigate('/forgot-password')} className="forgot-link">Forgot Password?</p>
                  </div>
                </>
              )}


              {/* STEP 2: OTP VERIFICATION */}
              {step === 2 && (
                <>
                  <div className='in-block-notif'>
                    A 6-digit verification has been sent to {loginData.email}
                  </div>

                  {/* OTP Input */}
                  <div className='login-input-box'>
                    <input
                      type='text'
                      placeholder=' '
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      disabled={otpTimer === 0} // disable input when expired
                    />
                    <label>Enter 6-digit code</label>
                  </div>

                  {/* Countdown Timer */}
                  <div className="otp-timer">
                    {otpTimer > 0 ? (
                      <p>Time remaining: {Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, '0')}</p>
                    ) : (
                      <p className="expired">Code expired. Please resend a new one.</p>
                    )}
                  </div>

                  {/* Verify Button */}
                  <button type='submit' disabled={otpTimer === 0}>
                    Verify Code
                  </button>

                  {/* Optional resend */}
                  <div className="resend-box">
                    <p
                      onClick={handleResendOTP}
                      className={`resend-link ${resendTimer > 0 ? 'disabled' : ''}`}
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </form>  
        </div>

        <img src={arrow_left} alt="arrow-left" className="arrow-left-icon" draggable="false" onClick={() => setResearchersVisible(true)}  ref={arrowRef}/>

        <div className={`researchers-box ${researchersVisible ? 'visible' : ''}`} ref={researchersRef}>
          <div className='researchers-content'>
            <button onClick={() => setResearchersVisible(false)}>
              <img src={close} alt="close" draggable="false" />
            </button>
            <h2>Developed By</h2>
            <div className="researchers-fade-wrapper">
              <div className='researchers'>
                <div className='person'>
                  <div className='person-img'>
                    <img src={baris} alt='Baris' draggable='false' />
                  </div>
                  <div className='person-info'>
                    <h3>Baris, Jomarie L.</h3>
                    <span>Lead Developer</span>
                    <div className='person-additional-info'>
                      <p>Bachelor of Science in Information and Technology</p>
                      <p>College of Computing Studies</p>
                    </div>

                    <div className='person-links'>
                      <a href='https://www.facebook.com/jomarie.baris.92' target='_blank' rel='noopener noreferrer'>Facebook</a>
                      <a href='https://github.com/BarisJomarie' target='_blank' rel='noopener noreferrer'>Github</a>
                      <a href='https://mail.google.com/mail/?view=cm&fs=1&to=baris.j.bsinfotech@gmail.com' target='_blank' rel='noopener noreferrer'>Email</a>
                    </div>
                  </div>
                </div>

                <div className='person'>
                  <div className='person-img'>
                    <img src={bautista} alt='Bautista' draggable='false' />
                  </div>
                  <div className='person-info'>
                    <h3>Bautista, Janelle L.</h3>
                    <span>Tech Patron</span>
                    <div className='person-additional-info'>
                      <p>Bachelor of Science and Technology</p>
                      <p>College of Computing Studies</p>
                    </div>
                    <div className='person-links'>
                      <a href='https://www.facebook.com/Jaja.Bautista.317' target='_blank' rel='noopener noreferrer'>Facebook</a>
                      <a href='https://github.com/xxxjnllxxx' target='_blank' rel='noopener noreferrer'>Github</a>
                      <a href='https://mail.google.com/mail/?view=cm&fs=1&to=ajhay1730@gmail.com ' target='_blank' rel='noopener noreferrer'>Email</a>
                    </div>
                  </div>
                </div>

                <div className='person'>
                  <div className='person-img'>
                    <img src={cabantog} alt='Cabantog' draggable='false' />
                  </div>
                  <div className='person-info'>
                    <h3>Cabantog, Taliza</h3>
                    <span>Technical Writer</span>
                    <div className='person-additional-info'>
                      <p>Bachelor of Science and Technology</p>
                      <p>College of Computing Studies</p>
                    </div>
                    <div className='person-links'>
                      <a href='https://www.facebook.com/talizaaaa' target='_blank' rel='noopener noreferrer'>Facebook</a>
                      <a href='#' target='_blank' rel='noopener noreferrer'>Github</a>
                      <a href='https://mail.google.com/mail/?view=cm&fs=1&to=cabantog.t.bsinfotech@gmail.com' target='_blank' rel='noopener noreferrer'>Email</a>
                    </div>
                  </div>
                </div>

                <div className='person'>
                  <div className='person-img'>
                    <img src={fuentiblanca} alt='Fuentiblanca' draggable='false' />
                  </div>
                  <div className='person-info'>
                    <h3>Fuentiblanca, Igyluis V.</h3>
                    <span>Assistant Lead Developer</span>
                    <div className='person-additional-info'>
                      <p>Bachelor of Science and Technology</p>
                      <p>College of Computing Studies</p>
                    </div>
                    <div className='person-links'>
                      <a href='https://www.facebook.com/igyluis.fuentiblanca.98' target='_blank' rel='noopener noreferrer'>Facebook</a>
                      <a href='https://github.com/igy26' target='_blank' rel='noopener noreferrer'>Github</a>
                      <a href='https://mail.google.com/mail/?view=cm&fs=1&to=fuentiblanca.il.bsinfotech@gmail.com' target='_blank' rel='noopener noreferrer'>Email</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>  
            
          </div>
        </div>
        
        <div className='toast-box' id='toast-box'></div>
      </div>
    </>
  );
};


export default Login;
