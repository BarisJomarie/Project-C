// src/components/SecurityQuestion.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/style.css";
import "../styles/login.css";
import "../styles/signup.css";
import earistLogo from "../assets/earist_logo.png";
import { showToast } from "../utils/toast";
import Loading from "../utils/Loading";

const SecurityQuestion = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;


  useEffect(() => {
    const verifyTokenAndFetchQuestion = async () => {
      try {
        const verifyRes = await axios.get(
          `${API_URL}/api/auth/reset-password/${token}`
        );
        const email = verifyRes.data.email;


        const qRes = await axios.post(
          `${API_URL}/api/auth/get-security-question`,
          { email }
        );

        setQuestion(qRes.data.security_question);
        localStorage.setItem("resetEmail", email);
        setLoading(false);
      } catch (err) {
        console.error("Token error:", err.response?.data || err);
        showToast("error", "Security Question", "Invalid or expired reset link.");
        navigate("/forgot-password");
      }
    };


    verifyTokenAndFetchQuestion();
  }, [token, navigate]);


  // same fade-in effect as signup
  useEffect(() => {
    const timer = setTimeout(() => {
      const content = document.querySelector(".signup-content");
      if (content) content.style.opacity = "1";
    }, 1000);
    return () => clearTimeout(timer);
  }, []);


  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const email = localStorage.getItem("resetEmail");
      const res = await axios.post(
        `${API_URL}/api/auth/verify-security`,
        { email, security_answer: answer }
      );


      if (res.data.success) {
        showToast("success", "Security Question", "Security answer verified!");
        navigate(`/new-password/${email}`);
      } else {
        showToast("error", "Security Question", "Incorrect answer. Try again.");
      }
    } catch (err) {
      console.error(err.response?.data || err);
      showToast("error", "Security Question", "Verification failed.");
    }finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loading text="Verifying answer.."/>}
      <div className="signup-bg">
        <div className="signup-container">
          <img src={earistLogo} alt="earist-logo" draggable="false" />
          <form className="signup-form" onSubmit={handleVerify}>
            <div className="signup-content">
              <h1>Security Verification</h1>


              <div className="in-block-notif"><span style={{fontWeight: 600, marginRight: '10px'}}>Question:</span>  {question}</div>


              <div className="signup-input-box">
                <input
                  type="text"
                  id="security-answer"
                  placeholder=" "
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  required
                />
                <label htmlFor="security-answer">Your Answer</label>
              </div>


              <button type="submit">Verify</button>
            </div>
          </form>


          <div className="toast-box" id="toast-box"></div>
        </div>
      </div>
    </>
    
  );
};


export default SecurityQuestion;
