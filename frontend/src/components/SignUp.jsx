import React, { useEffect, useState } from "react";
import axios from "axios";
import '../styles/style.css';
import '../styles/signup.css';
import earistLogo from '../assets/earist_logo.png';
import { useNavigate } from "react-router-dom";
import { showToast } from "../utils/toast";


const SignUp = () => {
  const [signUpData, setSignUpData] = useState({
    userCode: '',
    username: '',
    lastname: '',
    firstname: '',
    middlename: '',
    extension: '',
    role: 'student',
    email: '',
    password: '',
    security_question: '',
    security_answer: ''
  })
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword1, setShowPassword1] = useState(false);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;


  

  const toLogin = () => navigate('/');

  const isValidPassword = (password) => {
      const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,14}$/;
      return regex.test(password);
    };

  const handleRegister = async (e) => {
    e.preventDefault();
    

    if (signUpData.password !== document.getElementById('re-password').value) {
      showToast("warning", "Sign Up", "Password does not match!");
      return;
    }

    if (!isValidPassword(signUpData.password)) {
      showToast(
        "warning",
        "Password Requirements",
        "Password must be 12–14 characters long and include uppercase, lowercase, numbers, and symbols."
      );
      return;
    }



    try {
      const response = await axios.post(`${API_URL}/api/auth/signup`, signUpData);
      console.log('Signup response:', response.data);
      navigate('/signin');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        showToast("warning", "Sign Up", "Email or Username already exists.");
      } else {
        showToast("error", "Sign Up", "Something went wrong. Please try again.");
      }
    }
  }


  useEffect(() => {
      const timer = setTimeout(() => {
        document.querySelector('.signup-content').style.opacity = '1';
      }, 1000);
 
      return () => clearTimeout(timer);
    }, []);


  return (
    <>
    <div className="signup-bg">
      <div className="signup-container">
        <img src={earistLogo} alt="earist-logo" draggable='false'/>
        <form className="signup-form" onSubmit={handleRegister}>
          <div className="signup-content">
            <h1>SDG Classification and Analytics</h1>
            <div className="user-box">
              <div className="signup-input-box">
                <input
                  type="text"
                  id="user-code"
                  placeholder=" "
                  name="user-code"
                  value={signUpData.userCode}
                  onChange={(e) => setSignUpData({...signUpData, userCode: e.target.value})}
                  required
                />
                <label htmlFor="user-code">User Code</label>
              </div>
              <div className="signup-input-box">
                <input
                  type="text"
                  id="username"
                  placeholder=" "
                  name="username"
                  value={signUpData.username}
                  onChange={(e) => setSignUpData({...signUpData, username: e.target.value})}
                  required
                />
                <label htmlFor="username">Username</label>
              </div>
            </div>
            <div className="fullname-box">
              <div className="signup-input-box">
                <input
                  type="text"
                  id="lastname"
                  placeholder=" "
                  name="lastname"
                  value={signUpData.lastname}
                  onChange={(e) => setSignUpData({...signUpData, lastname: e.target.value})}
                  required
                />
                <label htmlFor="lastname">Lastname</label>
              </div>
              <div className="signup-input-box">
                <input
                  type="text"
                  id="firstname"
                  placeholder=" "
                  name="firstname"
                  value={signUpData.firstname}
                  onChange={(e) => setSignUpData({...signUpData, firstname: e.target.value})}
                  required
                />
                <label className="firstname">Firstname</label>
              </div>
              <div className="signup-input-box">
                <input
                  type="text"
                  id="middlename"
                  placeholder=" "
                  name="middlename"
                  value={signUpData.middlename}
                  onChange={(e) => setSignUpData({...signUpData, middlename: e.target.value})}
                />
                <label className="middlename">Middlename</label>
              </div>
              <div className="signup-input-box">
                <input
                  type="text"
                  id="extension"
                  placeholder=" "
                  name="extension"
                  value={signUpData.extension}
                  onChange={(e) => setSignUpData({...signUpData, extension: e.target.value})}
                />
                <label className="extension">Extension (optional)</label>
              </div>
            </div>
            {/* Security Question */}
            <div className="fullname-box">
              <div className="signup-input-box">
                <select
                  name="security_question"
                  required
                  className="security-question"
                  value={signUpData.security_question}
                  onChange={(e) =>
                    setSignUpData({ ...signUpData, security_question: e.target.value })
                  }
                >
                  <option value="">Select a security question</option>
                  <option>What is the name of your first pet?</option>
                  <option>What is your mother's maiden name?</option>
                  <option>What was the name of your elementary school?</option>
                  <option>In what city were you born?</option>
                  <option>What is your favorite book/movie?</option>
                  <option>What was your childhood nickname?</option>
                  <option>What is the name of the street you grew up on?</option>
                  <option>What was the make and model of your first car?</option>
                  <option>What is the name of your best friend from childhood?</option>
                  <option>What was the name of your first employer?</option>
                </select>
              </div>
              <div className="signup-input-box">
                <input
                  type="text"
                  placeholder=""
                  name="Your Answer"
                  value={signUpData.security_answer}
                  onChange={(e) => setSignUpData({...signUpData, security_answer: e.target.value})}
                  required
                />
                <label className="Your Answer">Your Answer</label>
              </div>
            </div>
            <div className="signup-input-box">
              <input
                type="email"
                id="email"
                placeholder=" "
                name="email"
                value={signUpData.email}
                onChange={(e) => setSignUpData({...signUpData, email: e.target.value})}
                required
              />
              <label className="email">Email</label>
            </div>
             <div className="signup-input-box">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder=" "
                name="password"
                value={signUpData.password}
                onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                required
              />
              <label className="password">Password</label>
              <span
                className="material-symbols-outlined p-input-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'visibility' : 'visibility_off'}
              </span>
              {/* 💡 Password hint */}
              <small>
                Must be 12–14 characters, with uppercase, lowercase, number, and symbol.
              </small>
            </div>

            <div className="signup-input-box">
              <input
                type={showPassword1 ? 'text' : 'password'}
                id="re-password"
                placeholder=" "
                name="re-password"
                required
              />
              <label className="re-password">Repeat Password</label>
              <span
                className="material-symbols-outlined p-input-icon"
                onClick={() => setShowPassword1(!showPassword1)}
              >
                {showPassword1 ? 'visibility' : 'visibility_off'}
              </span>
            </div>


            <button type="submit">Sign Up</button>
            <p onClick={toLogin}>Already have an Account?</p>
          </div>
        </form>
      </div>
      <div className="toast-box" id="toast-box"></div>
    </div>
    </>
  )
}


export default SignUp;
