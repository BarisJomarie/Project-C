import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import axios from "axios";
import Loading from "../utils/Loading";
import '../styles/style.css'
import '../styles/userPage.css'
import '../styles/table.css'
import '../styles/list.css'
import '../styles/homepage.css'

const UserPage = () => {
  const { user_id } = useParams();

  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [user, setUser] = useState(null);
  const [papers, setPapers] = useState([]);
  const [audit, setAudit] = useState([]);
  const [advisoryPaper, setAdvisoryPaper] = useState([]);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  const API_URL = import.meta.env.VITE_API_URL;

  const sdgOptions = [
    "SDG 1: No Poverty", "SDG 2: Zero Hunger", "SDG 3: Good Health and Well-being",
    "SDG 4: Quality Education", "SDG 5: Gender Equality", "SDG 6: Clean Water and Sanitation",
    "SDG 7: Affordable and Clean Energy", "SDG 8: Decent Work and Economic Growth",
    "SDG 9: Industry, Innovation and Infrastructure", "SDG 10: Reduced Inequalities",
    "SDG 11: Sustainable Cities and Communities", "SDG 12: Responsible Consumption and Production",
    "SDG 13: Climate Action", "SDG 14: Life Below Water", "SDG 15: Life on Land",
    "SDG 16: Peace, Justice and Strong Institutions", "SDG 17: Partnerships for the Goals"
  ];

  const sdgColors = [
    "#e5233d", "#dda73a", "#4ca146", "#c7212f",
    "#ef402d", "#27bfe6", "#fbc412", "#f26a2e",
    "#e01483", "#f89d2a", "#bf8d2c", "#407f46",
    "#1f97d4", "#59ba47", "#136a9f", "#14496b",
    "#8c1c62"
  ];


  // Get User Page Data
  const getUser = () => {
    setLoading(true);
    axios.get(`${API_URL}/api/users/user-info`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { id: user_id }
    }).then(response => {
      if (Array.isArray(response.data) && response.data.length > 0) {
        setUser(response.data[0]);
        // console.log('User fetched:', response.data[0]);
      } else {
        console.log('No user found');
        setUser(null);
      }
    }).catch(err => {
      console.error('Failed to fetch user', err);
      setUser(null);
    }).finally(() => {
      setLoading(false);
    });
  };

  // Get viewer data
  const getUserData = () => {
    setLoading(true);
    axios.get(`${API_URL}/api/users/user-info`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { id: userId }
    }).then(response => {
      if (Array.isArray(response.data) && response.data.length > 0) {
        setUserData(response.data[0]);
        // console.log('User fetched2:', response.data[0]);
      } else {
        console.log('No user found');
        setUserData(null);
      }
    }).catch(err => {
      console.error('Failed to fetch user', err);
      setUserData(null);
    }).finally(() => {
      setLoading(false);
    });
  };

  const getUserPaper = () => {
    if (!user?.id) return; // guard in case user is not loaded yet

    axios.get(`${API_URL}/api/users/user-papers/${user.id}`, {
      headers: { Authorization: `Bearer ${token}`}
    }).then(res => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        // console.log(`Papers fetched`);
      } else {
        console.log(`No papers found`);
      }
      setPapers(res.data);
    }).catch(err => {console.error('Error fetching papers:', err);
      setPapers([]);
    });
  }

  const getUserAuditLogs = () => {
    if (!user?.user_code) return;

    axios.get(`${API_URL}/api/users/user-audit/${user.user_code}`, {
      headers: { Authorization: `Bearer ${token}`}
    }).then(res => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        // console.log(`Audits fetched`);
      } else {
        console.log(`No audit found`);
      }
      setAudit(res.data);      
    }).catch(err => {console.error('Error fetching audit:', err);
      setAudit([]);
    });
  }

  // Fetch user and viewer data on mount
  useEffect(() => {
    getUser();
    getUserData();
  }, []);

  // Fetch dependent data when user and userData are loaded
  useEffect(() => {
    if (!user || !userData) return;
    getUserPaper();
    
    if (userData.role === 'admin') {
      getUserAuditLogs();
    }
  }, [user, userData]);

  const sdgData = sdgOptions.map((sdg, index) => {
    const sdgNumber = sdg.split(':')[0]; // "SDG 1"
    const count = advisoryPaper.filter(paper => paper.sdg_labels?.includes(sdgNumber)).length;
    return {
      sdg,
      count,
      color: sdgColors[index]
    };
  });



  return (
    <>
      {loading && <Loading text="Getting user information..."/> }
      <div className="hyperlink" onClick={() => navigate(-1)}><p>Go Back</p></div>
      <div className="user-page-container">
        <div className="user-contents">
          <div className="header-info">
            <div className="h-left">
                <label>Created At: </label>
                <p>{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {year:'numeric', month:'long', day:'numeric'}) : 'N/A'}</p>
              </div>
              <div className="h-right">
                <label>Updated At: </label>
                <p>{user?.updated_at ? new Date(user.updated_at).toLocaleDateString('en-US', {year:'numeric', month:'long', day:'numeric'}) : 'N/A'}</p>
              </div>
          </div>
          <div className="summary-container">
            <div className="summary-cards">
              <div className="card-table">
                <h4>Uploaded Research Paper</h4>
                <div className="list-container">
                  <ul className="custom-list">
                    {papers.length > 0 ? (
                      papers.map((p) => (
                       <li key={p.research_id} className="list-item">
                        <div className="list-left">
                          <strong className="actor-title">{p.research_title}</strong>
                          <span className="action-text">
                            {Array.isArray(p.sdg_labels)
                              ? p.sdg_labels.join(', ')
                              : (() => {
                                  try {
                                    // Try parsing only if it's valid JSON
                                    const parsed = JSON.parse(p.sdg_labels);
                                    if (Array.isArray(parsed)) {
                                      return parsed.join(', ');
                                    } else if (typeof parsed === 'string') {
                                      return parsed; // single string case
                                    } else {
                                      return p.sdg_labels;
                                    }
                                  } catch {
                                    // If parsing fails, it's a plain string like "SDG 2: Zero Hunger"
                                    return p.sdg_labels;
                                  }
                                })()}
                          </span>
                          <small>Adviser: {p.adviser}</small>
                          <small>Researchers:&nbsp;
                            {Array.isArray(p.researchers)
                              ? p.researchers.join(', ')
                              : (() => {
                                  try {
                                    // Try parsing only if it's valid JSON
                                    const parsed = JSON.parse(p.researchers);
                                    if (Array.isArray(parsed)) {
                                      return parsed.join(', ');
                                    } else if (typeof parsed === 'string') {
                                      return parsed; // single string case
                                    } else {
                                      return p.researchers;
                                    }
                                  } catch {
                                    // If parsing fails, it's a plain string like "SDG 2: Zero Hunger"
                                    return p.researchers;
                                  }
                                })()}
                          </small>
                        </div>
                        <div className="list-right">
                          <small>{new Date(p.created_at).toLocaleString()}</small>
                        </div>
                      </li>
                      ))
                    ) : (
                      <><li className="no-items">No recently added papers</li></>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {userData?.role === 'admin' && (
            <div className="summary-container">
              <div className="summary-cards">
                <div className="card-table">
                  <h4>User Activities</h4>
                  <div className="list-container">
                    <ul className="custom-list">
                      {audit.length > 0 ? (
                        audit.map((a) => (
                          <li key={a.id} className="list-item">
                            <div className="list-left">
                              <strong className={`actor-`}>{a.id}</strong>
                              <span className="action-text">{a.action}</span>
                            </div>
                            <div className="list-right">
                              <small>{new Date(a.timestamp).toLocaleString()}</small>
                            </div>
                          </li>
                        ))
                      ) : (
                        <><li className="no-items">No activities...</li></>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sidebar-right">
          <div className="profile-container">
            <div className={`profile-image-container ${user?.isActive !== 0 ? 'active' : ''}`}>
              <img src={`/uploads/${user?.profile_img || 'default_profile.jpg'}`} alt="Profile" onError={(e) => { e.currentTarget.src = '/uploads/default_profile.jpg'; }} />
            </div>
            <div className="profile-image-label">
              <label>{user?.username}</label>
              <p>{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}</p>
              <div className="status">
                <label>Status:</label>
                <p className={`${user?.isActive !== 0 ? 'active' : ''}`}>{user?.isActive === 0 ? 'Offline' : 'Online'}</p>
              </div>
            </div>
            <div className="profile-info">
              <div className="profile-info-p">
                <label>Fullname: </label>
                <p>{user?.lastname}, {user?.firstname} {user?.middlename ? `${user.middlename}.` : ''} {user?.extension ? user.extension.toUpperCase() : '' }</p>
              </div>
              <div className="profile-info-p">
                <label>Email: </label>
                <p>{user?.email}</p>
              </div>
              <div className="profile-info-p">
                <label>Department: </label>
                <p>{user?.department_abb ? user.department_abb : 'None'}</p>
              </div>
              <div className="profile-info-p">
                <label>Course: </label>
                <p>{user?.course_abb ? user.course_abb : "None"}</p>
              </div>
              {userData && user && userData.id === user.id && (
                <div className="profile-info-p" onClick={() => navigate('/view-profile')}>
                  <div className="hyperlink">Edit Profile</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default UserPage;
