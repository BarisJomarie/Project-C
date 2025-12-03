// src/components/NewPassword.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { showToast } from "../utils/toast";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/style.css";
import "../styles/signup.css";
import earistLogo from "../assets/earist_logo.png";
import Loading from "../utils/Loading";


const NewPassword = () => {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { email } = useParams();

  const API_URL = import.meta.env.VITE_API_URL;


  useEffect(() => {
    // fade-in animation same as signup
    const timer = setTimeout(() => {
      const content = document.querySelector(".signup-content");
      if (content) content.style.opacity = "1";
    }, 1000);
    return () => clearTimeout(timer);
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();


    if (password !== rePassword) {
      showToast("warning", "Password Reset", "Passwords do not match!");
      return;
    }


    try {
      setLoading(true);

      await axios.post(`${API_URL}/api/auth/new-password`, {
        email,
        newPassword: password,
      });
      showToast("success", "Password Reset", "Password updated successfully!");
      navigate("/");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to reset password.";
      showToast("error", "Password Reset", message);
    }finally {
      setLoading(false);
    }
  };


  return (
    <>
    {loading && <Loading text="Changing your password..."/>}
      <div className="signup-bg">
        <div className="signup-container">
          <img src={earistLogo} alt="earist-logo" draggable="false" />
          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="signup-content">
              <h1>Set New Password</h1>


              <div className="signup-input-box">
                <input
                  type={showPassword ? "text" : "password"}
                  id="new-password"
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <label htmlFor="new-password">New Password</label>
                <span
                        className='material-symbols-outlined p-input-icon'
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? 'visibility' : 'visibility_lock'}
                      </span>
              </div>


              <div className="signup-input-box">
                <input
                  type={showPassword ? "text" : "password"}
                  id="repeat-password"
                  placeholder=" "
                  value={rePassword}
                  onChange={(e) => setRePassword(e.target.value)}
                  required
                />
                <label htmlFor="repeat-password">Repeat Password</label>
              </div>


              <button type="submit">Update Password</button>
            </div>
          </form>
        </div>
        <div className="toast-box" id="toast-box"></div>
      </div>
    </>
  );
};


export default NewPassword;
