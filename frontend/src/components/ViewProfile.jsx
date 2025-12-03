import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/viewProfile.css';
import { useNavigate } from 'react-router-dom';

const ViewProfile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setUser(res.data);
    }).catch(err => {
      console.error(err);
      alert('Failed to fetch profile.');
    });
  }, []);

  

  if (!user) return <p>Loading profile...</p>;

  return (
    <div className="view-profile-container">
        <h2>Your Profile</h2>
        <div className="profile-info">
            <img src={`/uploads/${user.profile_img}`} alt="Profile" />

            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role === "rph" ? "Research Project Head" : user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
            <p><strong>Firstname:</strong> {user.firstname}</p>
            <p><strong>Lastname:</strong> {user.lastname}</p>
            <p><strong>Middlename:</strong> {user.middlename || '-'}</p>
            <p><strong>Extension:</strong> {user.extension || '-'}</p>
            <p><strong>Security Question:</strong> {user.security_question || "No security question set"}</p>
            <p><strong>Security Answer:</strong> {user.security_answer || "No answer set"}</p>
        </div>
        <button type="submit" onClick={() => navigate('/edit-profile')}>
            Edit Profile
    </button>
    </div>
  );
};

export default ViewProfile;
