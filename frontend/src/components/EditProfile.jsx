import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/editProfile.css';
import '../styles/toast.css'; 
import '../styles/form.css'
import { useNavigate } from 'react-router-dom';
import { showToast } from '../utils/toast'; 

const EditProfile = () => {
  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    middlename: '',
    extension: '',
    username: '',
    email: '',
    security_question: "",
    security_answer: "",
    profile_img: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch user data
  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setForm({
        firstname: res.data.firstname || '',
        lastname: res.data.lastname || '',
        middlename: res.data.middlename || '',
        extension: res.data.extension || '',
        username: res.data.username || '',
        email: res.data.email || '',
        security_question: res.data.security_question || '',
        security_answer: res.data.security_answer || '',
        profile_img: res.data.profile_img || ''
      });
    }).catch(err => {
      console.error(err);
      showToast('error', 'Fetch Failed', 'Failed to fetch user data.');
    });
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCancel = () => {
    navigate('/view-profile');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const formData = new FormData();
    for (const key in form) {
      formData.append(key, form[key]);
    }

    if (imageFile) {
      formData.append('profile_img', imageFile);
    }

    try {
      await axios.put(`${API_URL}/api/users/update`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showToast('success', 'Profile Updated', 'Successfully Updated.');

      // Notify other components
      window.dispatchEvent(new Event('profileUpdated'));

      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      console.error(err);
      showToast('error', 'Update Failed', err.response?.data?.message || 'Failed to update your profile.');
    }
  };

  return (
    <>
      <div>
        <h1 style={{textAlign: 'center'}}>Edit Profile</h1>
        <div style={{
          display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '-30px'
          }}>
          {(previewUrl || form.profile_img) && (
            <div
            style={{
              width: '120px',
              height: '120px',
              marginBottom: '20px',
              border: '2px solid #ddd',
              borderRadius: '50%',
            }}>
              <img
                src={previewUrl ? previewUrl : form.profile_img ? `${API_URL}/uploads/${form.profile_img}` : '/uploads/default_profile.jpg'}
                alt="Profile"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  
                }}
              />
            </div>
          )}
        </div>
        
        <div className='form-container default'>
          <form onSubmit={handleSubmit}>
            <div className="form-input center">
              <label className="custom-file-upload">
                <input type="file" onChange={handleImageChange} />
                Change Profile Image
              </label>
            </div>

            {['firstname', 'lastname', 'middlename', 'extension', 'username', 'email'].map(field => (
              <div key={field} className="form-input">
                <input
                  type="text"
                  name={field}
                  value={form[field] || ''}
                  onChange={handleChange}
                  required={['firstname', 'lastname', 'username', 'email'].includes(field)}
                />
                <label>{field.charAt(0).toUpperCase() + field.slice(1)}:</label>
              </div>
            ))}

            <div className="form-input">
              <select
                name="security_question"
                value={form.security_question}
                onChange={handleChange}
                required
              >
                <option value=''>Select A Security Question</option>
                  <option value="What is the name of your first pet?">What is the name of your first pet?</option>
                  <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                  <option value="What was the name of your elementary school?">What was the name of your elementary school?</option>
                  <option value="In what city were you born?">In what city were you born?</option>
                  <option value="What is your favorite book/movie?">What is your favorite book/movie?</option>
                  <option value="What was your childhood nickname?">What was your childhood nickname?</option>
                  <option value="What is the name of the street you grew up on?">What is the name of the street you grew up on?</option>
                  <option value="What was the make and model of your first car?">What was the make and model of your first car?</option>
                  <option value="What is the name of your best friend from childhood?">What is the name of your best friend from childhood?</option>
                  <option value="What was the name of your first employer?">What was the name of your first employer?</option>
              </select>
              <label>Security Question:</label>
            </div>

            <div className="form-input">
              <input
                type="text"
                name="security_answer"
                value={form.security_answer}
                onChange={handleChange}
                required
              />
              <label>Security Answer:</label>
            </div>
            
            <div className='form-button-container'>
              <button type="button" onClick={handleCancel}>Cancel</button>
              <button type="submit">Save Changes</button>
            </div>
          </form>
        </div>
      </div>

      <div className="toast-box" id="toast-box"></div>
    </>
  );
};

export default EditProfile;
