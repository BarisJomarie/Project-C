// src/components/ForgotPassword.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/style.css";
import "../styles/login.css";
import earist_logo from "../assets/earist_logo.png";
import { showToast } from "../utils/toast";
import { useNavigate } from "react-router-dom";
import Loading from "../utils/Loading";

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      showToast("success", "Password Reset", "A reset link has been sent to your email.");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to send reset link.";
      showToast("error", "Password Reset", message);
    }finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const timer = setTimeout(() => {
      const content = document.querySelector(".login-content");
      if (content) content.style.opacity = "1";
    }, 1000);
    return () => clearTimeout(timer);
  }, []);


  return (
    <>
      {loading && <Loading text={`Sending a link to ${email}...`}/>}
      <div className="login-bg">
        <div className="login-container">
          <img src={earist_logo} alt="logo" className="login-img" draggable="false" />
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-content">
              <h1>Forgot Password</h1>
              <div className="in-block-notif">Enter your registered email to receive a reset link.</div>

              <div className="login-input-box">
                <input
                  type="email"
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <label>Email</label>
              </div>


              <button type="submit">Send Reset Link</button>
              <div className="hyperlink-box">
                  <p onClick={() => navigate("/")}>Back to Login</p>
              </div>
            </div>
          </form>
        </div>
        <div className="toast-box" id="toast-box"></div>
      </div>
    </>
    
  );
};


export default ForgotPassword;


