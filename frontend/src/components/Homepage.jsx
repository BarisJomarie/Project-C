import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { showToast } from '../utils/toast';
import '../styles/homepage.css';
import '../styles/style.css';
import '../styles/table.css'
import '../styles/list.css'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ShimmerTitle, ShimmerThumbnail, ShimmerTable } from "react-shimmer-effects";


const Homepage = () => {
  const [userDataLoading, setUserDataLoading] = useState(true);
  const [infoLoading, setInfoLoading] = useState(true);
  const [cupLoading, setCupLoading] = useState(true);
  const [departmentLoading, setDepartmentLoading] = useState(true);
  const [userData, setUserData] = useState([]);
  const [users, setUsers] = useState([]);
  const [audit, setAudit] = useState([]);
  const [greetings, setGreetings] = useState('');
  const [totalPapers, setTotalPapers] = useState([]);
  const [highestLowestSDG, setHighestLowestSDG] = useState([]);
  const [currentUploadedPapers, setCurrentUploadedPapers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
	
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const height = 500;
  const width = 500;

  const API_URL = import.meta.env.VITE_API_URL;

  // Get User Data
  const getUserData = () => {
    if (token) {
      setUserDataLoading(true);
      axios.get(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        setUserData(response.data);

        const username = response.data.username;
        const role = response.data.role;
        let greetingsMessage = '';

        switch (role) {
          case 'admin':
            greetingsMessage = `Welcome back, Admin ${username}!`;
            break;
          case 'faculty':
            greetingsMessage = `Hello, Professor ${username}!`;
            break;
          case 'student':
            greetingsMessage = `Hey, Student ${username}!`;
            break;
          default:
            greetingsMessage = `Welcome ${username}!`;
        }

        setGreetings(greetingsMessage);
      })
      .catch(err => {
        console.error('Failed to fetch user data', err);
        showToast('error', 'Error', 'Failed to fetch user data.');
      })
      .finally(() => setUserDataLoading(false));
    } else {
      showToast('error', 'Error', 'No token found. Please log in again.');
    }
  };


  // Get Departments
  const getDepartment = () => {
    return axios.get(`${API_URL}/api/users/departments`, {
      headers: { Authorization: `Bearer ${token}`},
    }).then(response => {
      if (Array.isArray(response.data) && response.data.length > 0) {
        // console.log(`Department fetched`);
      } else {
        console.log(`No department found`);
      }
      setDepartments(response.data);
    }).catch(err => {
      console.error(`Failed to fetch departments`, err);
    });
  };

  // Get Users
  const getUsers = () => {
    return axios.get(`${API_URL}/api/users/allUsers`, {
      headers: { Authorization: `Bearer ${token}`},
    }).then(response => {
      if (Array.isArray(response.data) && response.data.length > 0) {
        // console.log(`Users fetched`);
      } else {
        console.log(`No users found`);
      }
      setUsers(response.data);
    }).catch(err => {
      console.error(`Failed to fetch users`, err);
    });
  };

  // Get Audit Logs max 100
  const getAuditLogs = () => {
    return axios.get(`${API_URL}/api/users/audit-logs`, {
      headers: { Authorization: `Bearer ${token}`},
    }).then(response => {
      if (Array.isArray(response.data) && response.data.length > 0) {
      // console.log(`Audit Logs fetched`);
      } else {
        console.log(`No Audit Logs found`);
      }
      setAudit(response.data);
    }).catch(err => {
      console.error(`Failed to fetch Audit Logs`, err);
    });
  };

  // Get Total Papers per SDG in a Department
  const getTotalPapers = (dep_id) => {
    if (!dep_id) return; 

    axios.get(`${API_URL}/api/users/department/total-sdg-papers`, {
      headers: { Authorization: `Bearer ${token}`},
      params: { department_id: dep_id }
    }).then(response => {
      if (Array.isArray(response.data) && response.data.length > 0) {
        // console.log(`Department Papers fetched`);
      } else {
        console.log(`No Department Papers papers found`);
      }
      setTotalPapers(response.data);
    }).catch(err => {
      console.error(`Failed to fetch papers`, err);
    });
  };

  // Get Highest and Lowest SDG per Course in a Department
  const getHighestLowestSDG = (dep_id) => {
    if (!dep_id) return;

    axios.get(`${API_URL}/api/users/department/highest-lowest-sdg`, {
      headers: { Authorization: `Bearer ${token}`},
      params: { department_id: dep_id }
    }).then(response => {
      if (Array.isArray(response.data) && response.data.length > 0) {
        // console.log(`Highest and Lowest SDG fetched`);
      } else {
        console.log(`No Highest and Lowest SDG found`);
      }
      setHighestLowestSDG(response.data);
    }).catch(err => {
      console.error(`Failed to fetch Highest and Lowest SDG`, err);
    });
  };

  // Get Current Uploaded Research Papers 3 days only
  const getCurrentUploadedResearchPapers = () => {
    if (!userData?.id) return; // safeguard

    return axios.get(`${API_URL}/api/users/current-uploaded/research-papers`, {
      headers: { Authorization: `Bearer ${token}`},
      params: { uId: userData.id }
    }).then(response => {
      if (Array.isArray(response.data) && response.data.length > 0) {
        // console.log(`Current Uploaded Research Papers fetched`);
      } else {
        console.log(`No Current Uploaded Research Papers found`);
      }
      setCurrentUploadedPapers(response.data);
      // console.log(response.data);
    }).catch(err => {
      console.error(`Failed to fetch Current Uploaded Research Papers`, err);
    });
  };

  // For users pie chart 
  const activeUsers = users.filter(user => user.isActive === 1).length;
  const inactiveUsers = users.length - activeUsers;
  const totalAdmins = users.filter(user => user.role === 'admin').length;
  const totalRPH = users.filter(user => user.role === 'rph').length;
  const totalFaculties = users.filter(user => user.role === 'faculty').length;

  const pieData = [
    { name: 'Active Users', value: activeUsers },
    { name: 'Inactive Users', value: inactiveUsers }
  ]

  // Initial data fetch
  useEffect(() => {
    getUserData();
  }, []);

  // Fetch ddiff things based on role
  useEffect(() => {
    if (!role) return;

    setInfoLoading(true);
    setDepartmentLoading(true);

    if (role === 'admin') {
      getDepartment();
      Promise.all([getUsers(), getAuditLogs()]).finally(() => {
        setInfoLoading(false);
      });
      Promise.all([getTotalPapers(), getHighestLowestSDG()]).finally(() => {
        setDepartmentLoading(false);
      });
    }

    if (role === 'faculty' || role === 'rph') {
      getDepartment();
      Promise.all([getTotalPapers(), getHighestLowestSDG()]).finally(() => {
        setDepartmentLoading(false);
      });
    }
  }, [role]);

  // Fetch current uploaded papers when userData is set
  useEffect(() => {
    if ((role === 'admin' || role === 'faculty' || role === 'rph') && userData?.id) {
      setCupLoading(true);
      getCurrentUploadedResearchPapers().finally(() => {
        setCupLoading(false);
      });
    }
  }, [role, userData]);


  // Set department on cards
  useEffect(() => {
    if (departments.length > 0 ) {
      const firstDepId = departments[0].department_id;
      setSelectedDepartment(firstDepId);
      getTotalPapers(firstDepId);
      getHighestLowestSDG(firstDepId);
    }
  }, [departments])

  // Helper to get SDG Color based on label
  function getSdgColor(label) {
    const match = label.match(/SDG\s*(\d+)/);
    if (match) {
      const index = parseInt(match[1], 10) - 1;
      return sdgColors[index] || '#3B060A'; // Default color if out of range
    }
    return '#3B060A'; // Default color if no match
  }

  // Colors for SDGs
  const sdgColors = [
    "#e5233d", "#dda73a", "#4ca146", "#c7212f",
    "#ef402d", "#27bfe6", "#fbc412", "#fbc412",
    "#f26a2e", "#e01483", "#f89d2a", "#bf8d2c",
    "#407f46", "#1f97d4", "#59ba47", "#136a9f",
    "#14496b"
  ];

  // Group highestLowestSDG by course_abb for BarChart
  const groupedData = highestLowestSDG.reduce((acc, item) => {
    const existing = acc.find(d => d.course_abb === item.course_abb);
    if (existing) {
      existing[item.type] = item.total;
      existing[`${item.type}_label`] = item.sdg_labels;
    } else {
      acc.push({
        course_abb: item.course_abb,
        [item.type]: item.total,
        [`${item.type}_label`]: item.sdg_labels
      });
    }
    return acc;
  }, []);

  return (
    <>
      
      <div className="homepage-container">
        <div className="greetings">
          {userDataLoading ? <>
            <ShimmerTitle line={1} gap={10} variant="primary" />
            <ShimmerTitle line={1} gap={10} variant="secondary" />
          </> : <>
            <h1>{greetings.split(userData.username)[0]} <span className="username">{userData.username}</span> </h1>
            <p>Email: {userData.email}</p>
          </>}
          
        </div>

        {/* admin panel */}
        {role === 'admin' && (
          <>
            <div className="line"></div>
            <div className="summary-cards">
              {infoLoading ? <ShimmerThumbnail height={height} width={width}/>
              : <>
                <div className="card-table" >
                  <div>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={50}
                          innerRadius={40}
                          label
                        >
                          {pieData.map((entry, index) => (
                            <Cell
                              key={index}
                              fill={entry.name === 'Active Users' ? '#C83F12' : '#3B060A'}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Role</th>
                          <th>Total</th>
                          <th>Active</th>
                          <th>Inactive</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Admin</td>
                          <td>{totalAdmins}</td>
                          <td>{users.filter(user => (user.role === 'admin' && user.isActive === 1)).length}</td>
                          <td>{users.filter(user => (user.role === 'admin' && user.isActive === 0)).length}</td>
                        </tr>
                        <tr>
                          <td>RPH</td>
                          <td>{totalRPH}</td>
                          <td>{users.filter(user => (user.role === 'rph' && user.isActive === 1)).length}</td>
                          <td>{users.filter(user => (user.role === 'rph' && user.isActive === 0)).length}</td>
                        </tr>
                        <tr>
                          <td>Student</td>
                          <td>{totalFaculties}</td>
                          <td>{users.filter(user => (user.role === 'faculty' && user.isActive === 1)).length}</td>
                          <td>{users.filter(user => (user.role === 'faculty' && user.isActive === 0)).length}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>}
              
              {infoLoading ? <ShimmerThumbnail height={height} width={width}/>
              : <>
                <div className="card-table">
                  <h4>Audit Logs (25 max)</h4>
                  <div className="list-container">
                    <ul className="custom-list">
                      {audit.length > 0 ? (
                        audit.map((a) => (
                          <li key={a.id} className="list-item">
                            <div className="list-left">
                              <strong className={`actor-${a.actor_type}`}>{a.user_code}</strong>
                              <span className="action-text">— {a.action}</span>
                            </div>
                            <div className="list-right">
                              <small>{new Date(a.timestamp).toLocaleString()}</small>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="no-items">No Audits currently...</li>
                      )}
                    </ul>
                  </div>
                </div>
              </>}
              
            </div>
          </>
        )}
        <div className="summary-container">
          <label htmlFor="select-department">Select Department: </label>
          <select 
            className='select-department' 
            value={selectedDepartment || ""}
            onChange={(e) => {
              const depId = e.target.value;
              setSelectedDepartment(depId);
              if (depId) {
                getTotalPapers(depId);
                getHighestLowestSDG(depId);
              }
            }}
            >
            {departments.map((dept) => (
              <option key={dept.department_id} value={dept.department_id}> {dept.department_abb} </option>
            ))}
          </select>
          <div className="summary-cards">

            {departmentLoading ? <ShimmerThumbnail height={height} width={width}/>
            : <>
              <div className={`card ${totalPapers.length > 0 ? 'expanded' : ''}`}>
                <h4>Amount of SDG Research created in a department</h4>
                {totalPapers.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={totalPapers}
                        layout="vertical"   // <-- Makes it horizontal
                        margin={{ top: 20, right: 30, left: 50, bottom: 20 }}
                      >
                      <CartesianGrid strokeDasharray="3 3" />


                      {/* Left side labels */}
                      <YAxis
                        dataKey="sdg_labels"
                        type="category"
                        width={50}
                        tick={{ fontSize: 8 }}
                      />


                      {/* Bottom axis values */}
                      <XAxis
                        type="number"
                      />


                      <Tooltip />


                      <Bar dataKey="total">
                        {totalPapers.map((entry, index) => (
                          <Cell
                            key={`bar-${index}`}
                            fill={getSdgColor(entry.sdg_labels)}
                          />
                        ))}
                      </Bar>
                    </BarChart>

                    </ResponsiveContainer>
                  </>
                ) : (
                  <>
                    <p>No Current Papers in this department</p>
                  </>
                )}  
              </div>
            </>}
            
            {departmentLoading ? <ShimmerThumbnail height={height} width={width}/>
            : <>
              <div className={`card ${totalPapers.length > 0 ? 'expanded' : ''}`}>
                <h4>Highest and Lowest SDG Created in each course.</h4>
                {highestLowestSDG.length > 0 ? (
                  <>
                    <ResponsiveContainer width='100%' height={400}>
                      <BarChart data={groupedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="course_abb" />
                        <YAxis 
                          allowDecimals={false}
                          tickCount={highestLowestSDG.length + 1}
                        />
                        <Tooltip 
                          formatter={(value, name, props) => {
                            if (name === "Highest SDG") {
                              return [`${value}`, groupedData.find(d => d.course_abb === props.payload.course_abb)?.highest_label];
                            }
                            if (name === "Lowest SDG") {
                              return [`${value}`, groupedData.find(d => d.course_abb === props.payload.course_abb)?.lowest_label];
                            }
                            return value;
                          }}
                        />
                        <Bar dataKey="highest" fill="#8A0000" name="Highest SDG" />
                        <Bar dataKey="lowest" fill="#3B060A" name="Lowest SDG" />
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <>
                    <p>No highest/lowest SDG data available for this department</p>
                  </>
                )}
              </div>
            </>}
          </div>
        </div>
        <div className="summary-container">
          <div className="summary-cards">
            {cupLoading ? <ShimmerThumbnail height={100} width={width} />
            : <>
                <div className="card-table">
                  <h4>Recently Added Papers</h4>
                  <div className="list-container">
                    <ul className="custom-list">
                      {currentUploadedPapers.length > 0 ? (
                        currentUploadedPapers.map((paper) => (
                          <li key={paper.research_id} className="list-item">
                            <div className="list-left">
                              <strong className={`actor-`}>{paper.research_id}</strong>
                              <span className="action-text">{paper.research_title}</span>
                            </div>
                            <div className="list-right">
                              <small>{new Date(paper.created_at).toLocaleString()}</small>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="no-items">No recently added papers</li>
                      )}
                    </ul>
                  </div>
                </div>
              </>} 
           
          </div>
        </div>
      </div>

			<div className="toast-box" id="toast-box"></div>
    </>
  )
}

export default Homepage;