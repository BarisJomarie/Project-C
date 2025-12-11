import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { showToast } from "../utils/toast";
import { ShimmerTable, ShimmerButton } from "react-shimmer-effects";
import axios from "axios";
import Loading from "../utils/Loading";
import ConfirmModal from "../utils/ConfirmModal";
import '../styles/style.css';
import '../styles/table.css';
import '../styles/form.css';



const Users = () => {
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [userData, setUserData] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [addUserForm, setAddUserForm] = useState(false);
  const [formData, setFormData] = useState({
    userCode: '',
    username: '',
    lastname: '',
    firstname: '',
    middlename: '',
    extension: '',
    email: '',
    password: '',
    role: '',
    security_question: '',
    security_answer: '',
    autoPassword: false,
    //if role = rph or faculty otherwise null
    department: '',
    course: '',
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedUser, setEditedUser] = useState({});
  const [editCourses, setEditCourses] = useState([]);
  const [modalConfig, setModalConfig] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const year = new Date().getFullYear();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const API_URL = import.meta.env.VITE_API_URL;



  const showModal = (title, message, onConfirm) => {
    setModalConfig({
      show: true,
      title,
      message,
      onConfirm,
    });
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, show: false }));
  };



  // GET USER
  const getUserData = () => {
    axios.get(`${API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(response => {
      if (response.data) {
        // console.log(`User fetched`);
      } else {
        console.log(`No user found`);
      }
      setUserData(response.data);
    })
    .catch(err => {
      console.error(`Failed to fetch user`, err);
    });
  };


  // GET ALL USERS
  const getUsers = () => {
    return axios.get(`${API_URL}/api/users/allUsers`, {
      headers: { Authorization: `Bearer ${token}`},
    }).then(response => {
      if (Array.isArray(response.data) && response.data.length > 0) {
        // console.log(`Users fetched`);
        // console.log(response.data);
      } else {
        console.log(`No users found`);
      }
      setUsers(response.data);
    }).catch(err => {
      console.error(`Failed to fetch users`, err);
    });
  };

  // GET DEPARTMENTS
  const getDepartment = async () => {
    return axios.get(`${API_URL}/api/users/departments`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(response => {
      if (Array.isArray(response.data) && response.data.length > 0) {
        // console.log('Department Fetched');
        console.log(response.data);
      } else {
        console.log('No department found');
      }
      setDepartments(response.data);
    }).catch(err => {
      console.error('Failed to fetch users', err);
    });
  };

  // GET COURSE WHEN DEPARTMENT IS SET IN EDITING AND ADDING USER
  const getDepartmentCourses = async (department_id, isEditing = false) => {
    if (!department_id) return isEditing ? setEditCourses([]) : setCourses([]);

    try {
      const response = await axios.get(`${API_URL}/api/users/department-courses`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { department_id },
      });

      if (Array.isArray(response.data)) {
        if (isEditing) setEditCourses(response.data);
        else setCourses(response.data);
      } else {
        if (isEditing) setEditCourses([]);
        else setCourses([]);
      }

      console.log(response.data);
    } catch (err) {
      console.error("Failed to fetch courses", err);
    }
  };


  useEffect(() => {
    setTableLoading(true);
    Promise.all([getUserData(), getUsers(), getDepartment()]).finally(() => {
      setTableLoading(false);
    });
  }, []);

  const isValidPassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_]).{12,}$/;
    return regex.test(password);
  };

  const resetFields = () => {
    setFormData({
      userCode: '',
      username: '',
      lastname: '',
      firstname: '',
      middlename: '',
      extension: '',
      email: '',
      password: '',
      role: '',
      security_question: '',
      security_answer: '',
      autoPassword: false,
      department: '',
      course: '',
    });
  };

  //ADD USER
  const handleAddUser = async(e) => {
    e.preventDefault();

     // Check password validity
    if (!isValidPassword(formData.password)) {
      showToast('warning', 'Invalid Password', 'Password must contain uppercase, lowercase, number, and special character.');
      return;
    }

    // Existing department/course check
    if (['faculty', 'rph'].includes(formData.role)) {
      if (!formData.department || !formData.course) {
        showToast('warning', 'Add User', 'Please select a department and course for faculty or RPH.');
        return;
      }
    }

    showModal(
      "Confirm Add User",
      "Are you sure you want to add this user?",
      async () => {
        closeModal();
        try {
          setLoading(true);
          // existing logic
          await axios.post(`${API_URL}/api/auth/signup`, {
            ...formData,
            department: formData.department === '' ? null : formData.department,
            course: formData.course === '' ? null : formData.course,
          }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showToast("success", "User Added", "User Added Successfully");
          getUsers();
          resetFields();
        } catch (err) {
          console.error('Failed to add user.', err);
          if (err.response && err.response.status === 400) {
            showToast('warning', 'Add User', 'Email or Username already exists.');
          } else {
            showToast('error', 'Add User', 'Failed to add user.');
          }
        } finally {
          setLoading(false);
        }
      }
    );
  }

  //UPDATE USER
  const handleSave = () => {
    showModal(
      "Confirm Edit",
      <>Changing user role to <strong>{editedUser.role === 'rph' 
        ? 'Research Project Head' 
        : editedUser.role.charAt(0).toUpperCase() + editedUser.role.slice(1)}</strong>?</>,
      async () => {
        closeModal();
        try {
          // Check if non-admin role requires department and course
          if (editedUser.role !== 'admin' && (!editedUser.department || !editedUser.course)) {
            showToast('warning', 'Edit User', 'Please select a department and course for faculty or RPH.');
            return;
          }

          await axios.put(`${API_URL}/api/users/update-role`, {
            id: editedUser.id,
            role: editedUser.role,
            department: editedUser.role === 'admin' ? null : editedUser.department,
            course: editedUser.role === 'admin' ? null : editedUser.course,
          }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showToast("success", "Role Updated", "User role updated successfully.");
          setEditingIndex(null);
          getUsers();
        } catch (err) {
          showToast("error", "Update Failed", "Could not update role.");
        }
      }
    );
  };



  // DELETE USER
  const handleDelete = (id, user_code) => {
    showModal(
      "Confirm Delete",
      <>Are you sure you want to delete
        <br/><br/>
        User Code: <strong>{user_code}</strong>?</>,
      async () => {
        closeModal();
        try {
          await axios.delete(`${API_URL}/api/users/user-delete/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { user_code: userData.user_code, code: user_code, role: userData.role },
          });
          showToast("success", "User Deleted", "User deleted successfully.");
          getUsers();
        } catch (err) {
          console.error(err);
          showToast("error", "Delete Failed", "Could not delete user.");
        }
      }
    );
  };




  // AUTO PASSWORD (ALWAYS 16 OR MORE)
  const generateAutoPassword = (lastname) => {
    const year = new Date().getFullYear();
    const upperLast = lastname.replace(/\s+/g, "").toUpperCase();

    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*';

    const chars = [
      lower[Math.floor(Math.random() * lower.length)],
      upper[Math.floor(Math.random() * upper.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      special[Math.floor(Math.random() * special.length)]
    ];

    const allChars = lower + upper + numbers + special;
    const remainingLength = Math.max(12 - (upperLast.length + chars.length), 0);
    for (let i = 0; i < remainingLength; i++) {
      chars.push(allChars[Math.floor(Math.random() * allChars.length)]);
    }

    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return `${year}${upperLast}${chars.join('')}`;
  };


  const handleRoleChange = async (e) => {
    const role = e.target.value;
    setFormData(prev => ({ ...prev, role }));
  };

  // CALL getDepartmentCourse IF DEPARTMENT IS CHOSEN
  const handleDepartmentChange = async (e, isEditing = false) => {
    const department_id = e.target.value;

    if (isEditing) {
      setEditedUser(prev => ({ ...prev, department: department_id, course: "" }));
    } else {
      setFormData(prev => ({ ...prev, department: department_id, course: "" }));
    }

    // fetch courses according to mode
    await getDepartmentCourses(department_id, isEditing);
  };

  return (
    <>
      {loading && <Loading text="Adding user..." />}
      <div className="department-buttons-container">
        {addUserForm ? (
          <button onClick={() => {
            setAddUserForm(false);
            resetFields();
          }} type="button">Close Form</button>
        ) : (
          tableLoading ? <ShimmerButton size="lg" />
          : <>
            <button 
              onClick={() => setAddUserForm(true)} 
              type="button"
              disabled={editingIndex !== null}>Add A User</button>
          </>
        )}
      </div>
        <>
          <div className={`form-container ${addUserForm ? 'slide-down' : 'slide-up'}`}>
            <form onSubmit={handleAddUser} className="form">
              <div className="grouped-inputs">
                <div className="form-input">
                  <input name="user-code" type="text" placeholder="User Code" value={formData.userCode} onChange={(e) => setFormData(prev => ({
                    ...prev, userCode: e.target.value
                  }))} required/>
                  <label htmlFor="user-code">User Code</label>
                </div>
                <div className="form-input">
                  <input name="username" type="text" placeholder="Username" value={formData.username} onChange={(e) => setFormData(prev => ({
                    ...prev, username: e.target.value
                  }))} required/>
                  <label htmlFor="username">Username</label>
                </div>
              </div>
              <div className="grouped-inputs">
                <div className="form-input">
                  <input name="lastname" type="text" placeholder="Lastname" value={formData.lastname} onChange={(e) => {
                    const lastname = e.target.value;
                    setFormData((prev) => ({
                      ...prev, lastname, password: prev.autoPassword ? generateAutoPassword(lastname) : prev.password
                    }));
                  }} required/>
                  <label htmlFor="lastname">Lastname</label>
                </div>
                <div className="form-input">
                  <input name="firstname" type="text" placeholder="Firstname" value={formData.firstname} onChange={(e) => setFormData(prev => ({
                    ...prev, firstname: e.target.value
                  }))} required/>
                  <label htmlFor="firstname">Firstname</label>
                </div>
                <div className="form-input">
                  <input name="middlename" type="text" placeholder="Middlename" value={formData.middlename} onChange={(e) => setFormData(prev => ({
                    ...prev, middlename: e.target.value
                  }))} />
                  <label htmlFor="middlename">Middlename</label>
                </div>
                <div className="form-input extension-input">
                  <input name="extension" type="text" placeholder="Extension" value={formData.extension} onChange={(e) => setFormData(prev => ({
                    ...prev, extension: e.target.value
                  }))} />
                  <label htmlFor="extension">Extension</label>
                </div>
              </div>
              <div className="form-input">
                <input name="email" type="email" placeholder="Email" required value={formData.email} onChange={(e) => setFormData(prev => ({
                    ...prev, email: e.target.value
                  }))} />
                <label htmlFor="email">Email</label>
              </div>
              <div className="form-input">
                  <div className="add-inputs">
                    <label>Auto-password</label>
                    <input name="auto-password" type="checkbox" id="auto-passsword" checked={formData.autoPassword} onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData((prev) => ({
                        ...prev, autoPassword: checked, password: checked ? generateAutoPassword(prev.lastname) : ''
                      }));
                    }}
                    />
                    <div className="info">
                      <span className="material-symbols-outlined info-icon">info</span>
                      <span className="tooltip">Use lastname as the password. (All caps). Re-check if lastname is chanegd</span>
                    </div>
                  </div>
                <input name="password" type="text" placeholder="Password" value={formData.password} disabled={formData.autoPassword} onChange={(e) => setFormData((prev) => ({
                  ...prev, password: e.target.value
                }))} required/>
                <label htmlFor="password">Password</label>
              </div>
              <div className="form-input">
                <select name="role" value={formData.role} onChange={handleRoleChange} required>
                  <option value={''}>Select A Role</option>
                  <option value={'admin'}>Admin</option>
                  <option value={'rph'}>Research Project Head</option>
                  <option value={'faculty'}>Faculty</option>
                </select>
                <label htmlFor="role">Role</label>
              </div>
                  
              {/* RESEARCH PROJECT HEAD OR FACULTY */}
              <div className={`extra-fields ${['faculty', 'rph'].includes(formData.role) ? 'slide-down' : 'slide-up'}`}>
                <div className="department form-input">
                  <select name="department" value={formData.department || ''} onChange={(e) => handleDepartmentChange(e, false)}>
                    <option value=''>--Select a Department--</option>
                    {departments.length > 0 && (
                      departments.map((dep) => (
                        <option key={dep.department_id} value={dep.department_id}>{dep.department_name}</option>
                      ))
                    )}
                  </select>
                  <label htmlFor="department">Department</label>
                </div>

                <div className="course form-input">
                  <select name="course" value={formData.course || ''} onChange={(e) => setFormData(prev => ({ 
                    ...prev, course: e.target.value 
                  }))} >
                    <option value="">--Select Course--</option>
                    {courses.length > 0 &&  (
                      courses.map((c) => (
                        <option key={c.course_id} value={c.course_id}>{c.course_name}</option>
                      ))
                    )}
                  </select>
                  <label htmlFor="course">Course</label>
                </div>
              </div>

              <div className="form-input">
                <select name="sec-q" value={formData.security_question} onChange={(e) => setFormData(prev => ({
                  ...prev, security_question: e.target.value
                }))} required>
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
                <label htmlFor="sec-q">Security Question</label>
              </div>
              <div className="form-input">
                <div className="form-input">
                  <input name="sec-ans" type="text" placeholder="Answer" required value={formData.security_answer} onChange={(e) => setFormData(prev => ({
                    ...prev, security_answer: e.target.value
                  }))} />
                  <label htmlFor="sec-ans">Answer</label>
                </div>
              </div>
              <div className="form-button-container">
                <button type="button" onClick={resetFields}>Clear</button>
                <button type="submit" style={{margin: 0}}>Add User</button>
              </div>
            </form>
          </div>
        </>
        
        <div className="line"></div>

      
      {tableLoading ? <ShimmerTable row={5} col={9} />
        : <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User Code</th>
                  <th>Username</th>
                  <th>Fullname</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Active</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((u, index) => (
                    <tr key={u.id}>
                      <td>{u.user_code}</td>
                      <td>{u.username}</td>
                      <td>{u.lastname}, {u.firstname} {u.middlename}. {u.extension ? `. ${u.extension.toUpperCase()}` : ""}</td>
                      <td>{u.email}</td>

                      {/* Editable role */}
                      <td style={{
                            display: 'flex', 
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                        {editingIndex === index ? (
                          <>
                            {/* ROLE DROPDOWN */}
                            <select
                              value={editedUser.role || u.role}
                              onChange={(e) => {
                                const newRole = e.target.value;
                                setEditedUser({ ...editedUser, role: newRole });
                                // Reset course when role changes
                                if (newRole === "admin") {
                                  setEditedUser(prev => ({ ...prev, department: "", course: "" }));
                                }
                              }}
                            >
                              <option value="admin">Admin</option>
                              <option value="rph">Research Project Head</option>
                              <option value="faculty">Faculty</option>
                            </select>

                            {/* If not admin show department, course select */}
                            {(editedUser.role || u.role) !== "admin" && (
                              <select
                                value={editedUser.department || ""}
                                onChange={(e) => {
                                  setEditedUser({ ...editedUser, department: e.target.value });
                                  handleDepartmentChange(e, true);
                                }}
                              >
                                <option value="">Select Department</option>
                                {departments.map((d) => (
                                  <option key={d.department_id} value={d.department_id}>
                                    {d.department_abb}
                                  </option>
                                ))}
                              </select>
                            )}

                            {/* COURSE dropdown */}
                            {(editedUser.role || u.role) !== "admin" && (
                              <select
                                value={editedUser.course || ""}
                                onChange={(e) => setEditedUser(prev => ({ ...prev, course: e.target.value }))}
                              >
                                <option value="">Select Course</option>
                                {editCourses.map((c) => (
                                  <option key={c.course_id} value={c.course_id}>
                                    {c.course_abb}
                                  </option>
                                ))}
                              </select>
                            )}
                          </>
                        ) : (
                          // Not editing → just display the role
                          u.role === 'rph' ? 'Research Project Head' : u.role.charAt(0).toUpperCase() + u.role.slice(1)
                        )}
                      </td>
                      <td className={`active-${u.isActive}`}>{u.isActive === 1 ? 'Online' : 'Offline'}</td>

                      {/* Actions */}
                      <td>
                        {editingIndex === index ? (
                          <>
                            <button onClick={() => handleSave()}>
                              <span className="material-symbols-outlined save-icon">save</span>
                              <span className="tooltip">Save Edit</span>
                            </button>
                            <button onClick={() => setEditingIndex(null)}>
                              <span className="material-symbols-outlined cancel-icon">cancel</span>
                              <span className="tooltip">Cancel Edit</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={async () => {
                              setEditingIndex(index);
                              setEditedUser({ id: u.id, role: u.role, department: u.department, course: u.course });
                              if (u.department) {
                                await getDepartmentCourses(u.department, true);
                              }
                            }}>
                              {addUserForm!== true && (
                                <>
                                  <span className="material-symbols-outlined edit-icon">edit</span>
                                  <span className="tooltip">Edit Role</span>
                                </>
                              )}
                            </button>
                            <button onClick={() => navigate(`/user/users/${u.id}`)}>
                              <span className="material-symbols-outlined view-icon">visibility</span>
                              <span className="tooltip">View Adviser</span>
                            </button>
                            <button onClick={() => handleDelete(u.id, u.user_code)}>
                              <span className="material-symbols-outlined delete-icon">delete</span>
                              <span className="tooltip">Delete User</span>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9}>No users...</td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>
        </>}
      



      <ConfirmModal
        show={modalConfig.show}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={closeModal}
      />



      <div className="toast-box" id="toast-box"></div>
    </>
  )
}

export default Users;