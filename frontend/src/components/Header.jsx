import React, { useState, useEffect, useRef } from "react";
import '../styles/style.css';
import '../styles/header.css';
import earistLogo from '../assets/earist_logo.png';
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";

const Header = ({ departments, fetchDepartments })  => {
  const [darkMode, setDarkMode] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [depListOpen, setDepListOpen] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [userData, setUserData] = useState({});
  const profileMenuRef = useRef(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  const API_URL = import.meta.env.VITE_API_URL;

  // Function to fetch user data
  const fetchUserData = () => {
    if(!token) return;
    axios.get(`${API_URL}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).then(response => {
      setUserData(response.data);
    }).catch(err => {
      // console.error('Failed to fetch user data', err);
    }); 
  }

  useEffect(() => {
    fetchUserData();
    fetchDepartments();

    // Listen for profileUpdated event to refresh data
    const handleProfileUpdated = () => {
      fetchUserData();
    };

    window.addEventListener('profileUpdated', handleProfileUpdated);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdated);
    };
  }, []);

  const toggleProfileMenu = () => {
    if (!profileVisible) {
      setProfileVisible(true);
      setShowProfileMenu(true);
    } else {
      setShowProfileMenu(false);
      setTimeout(() => setProfileVisible(false), 300);
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        profileMenuRef.current && !profileMenuRef.current.contains(e.target)
      ) {
        setShowProfileMenu(false);
        setTimeout(() => setProfileVisible(false), 300);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev)
  }

  const handleLogout = async () => {
    try {
      await axios.put(
        `${API_URL}/api/auth/logout`,
        {},
        {headers: { Authorization: `Bearer ${token}` }}
      );
    } catch (err) {
      console.error('Failed to update logout status', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('role');
      localStorage.removeItem('darkMode');
      localStorage.removeItem('department_id');
      navigate('/signin');
    }
  };

  // Audit log if token expired when navigating
  const handleNavClick = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await axios.get(`${API_URL}/api/ping`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('role');
      localStorage.removeItem('darkMode');
      localStorage.removeItem('department_id');
      navigate('/signin');
    }
  };

  const toggleDropdown = () => setDepListOpen(!depListOpen);

  // Load preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
    document.body.classList.toggle("dark", saved);
  }, []);

  // Save to localStorage whenever toggled
  const toggleTheme = () => {
    setDarkMode(prev => {
      localStorage.setItem("darkMode", !prev);
      document.body.classList.toggle("dark", !prev);
      return !prev;
    });
  };

  const handleThemeChange = () => {
    // Show overlay instantly
    setOverlayVisible(true);

    // Toggle theme immediately
    setDarkMode(prev => {
      localStorage.setItem("darkMode", !prev);
      document.body.classList.toggle("dark", !prev);
      return !prev;
    });

    // After 1 second, fade out overlay
    setTimeout(() => {
      setOverlayVisible(false);
    }, 1000);
  };

  const downloadHistoryReport = async () => {
  try {
    const response = await fetch(`${API_URL}/api/download/download-history`);
    if (!response.ok) throw new Error('Failed to download file');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'history_report.jsonl';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert('Error downloading report');
  }
};


  return (
    <>
      <div className={`theme-overlay ${overlayVisible ? 'active' : ''}`}></div>
      <header>
        <div className="left">
          <span 
            className={`material-symbols-outlined header-icon ${isSidebarOpen ? "rotated" : ""}`} 
            onClick={toggleSidebar}
          >
            menu
          </span>
          <img src={earistLogo} alt="earist-logo" />
          <h1>SDG Classification and Analytics</h1>
        </div>
        <div className="right" ref={profileMenuRef}>
          <p onClick={toggleProfileMenu}>{userData.username || 'Error'}</p>
          <div className="profile">
            <img
              src={`${API_URL}/uploads/${userData.profile_img}`|| `${API_URL}/uploads/default_profile.jpg`}
              alt="Profile"
              onClick={toggleProfileMenu}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
                cursor: 'pointer'
              }}
            />
            {profileVisible && (
              <div className={`user-profile-button ${showProfileMenu ? 'fade-in' : 'fade-out'}`}>
                <button onClick={handleThemeChange}>
                  {darkMode ? 'Change to Light Mode' : 'Change to Dark Mode'}
                  <span className="material-symbols-outlined theme-toggle">
                    {darkMode ? 'dark_mode' : 'light_mode'}
                  </span>
                </button>
                <button onClick={() => navigate('/view-profile')}>
                  User Profile
                </button>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="layout">
        <div
          className="sidebar"
          style={{ width: isSidebarOpen ? undefined : '0px' }}
        >
          <div className="sidebar-content" style={{ opacity: isSidebarOpen ? 1 : 0 }}>
            {userData.role === 'admin' && (
              <>
                <NavLink to="/user/homepage"
                  className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
                  onClick={handleNavClick}  
                >
                  <span className="material-symbols-outlined">home</span>
                  <span>Home</span>
                </NavLink>
                <NavLink to="/user/users"
                  className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
                  onClick={handleNavClick}
                >
                  <span className="material-symbols-outlined">people</span>
                  <span>Users</span>
                </NavLink>
                <NavLink to="/user/department/add_department"
                  className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
                  onClick={handleNavClick}
                >
                  <span className="material-symbols-outlined">business</span>
                  <span>Department</span>
                </NavLink>
                <NavLink to="/user/course_add"
                  className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
                  onClick={handleNavClick}
                >
                  <span className="material-symbols-outlined">menu_book</span>
                  <span>Courses</span>
                </NavLink>
                <NavLink to="/user/audit"
                  className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
                  onClick={handleNavClick}
                >
                  <span className="material-symbols-outlined">history</span>
                  <span>Audit Logs</span>
                </NavLink>
              </>
            )}

            <hr className="sidebar-divider" />

            <div className="department-dropdown">
              <h4 onClick={toggleDropdown} style={{ cursor: "pointer" }}>
                <span style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                  <span className="material-symbols-outlined">folder</span>
                  <span>Departments</span>
                </span>
                <span className="material-symbols-outlined" style={{transform: depListOpen ? 'rotate(180deg)' : 'rotate(0deg)'}}>
                  expand_more
                </span>
              </h4>

              {depListOpen && (
                <div className="dropdown-menu">
                  {departments.map((dept) => (
                    <NavLink
                      key={dept.department_id}
                      to={`/user/department/${dept.department_id}`}
                      className={({ isActive }) =>
                        isActive ? "sidebar-link active" : "sidebar-link"
                      }
                    >
                      <span className="material-symbols-outlined">account_tree</span>
                      <span>{dept.department_abb}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            {/* {userData.role === 'admin' && (
              <>
                <hr className="sidebar-divider" />
                <button
                  style={{marginTop: '0'}}
                  className="sidebar-link"
                  onClick={downloadHistoryReport}
                >
                  <span className="material-symbols-outlined">download</span>
                  <span>Download History Report</span>
                </button>
              </>
            )} */}
            
          </div>
        </div>
        <main style={{ marginLeft: isSidebarOpen ? undefined : '10px' }}>
          <Outlet />
        </main>
      </div>
      
    </>
  )
}

export default Header;
