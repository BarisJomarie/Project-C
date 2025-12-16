import React, { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { showToast } from "../utils/toast";
import { ShimmerButton, ShimmerTable } from "react-shimmer-effects";
import ConfirmModal from "../utils/ConfirmModal";
import axios from "axios";
import '../styles/style.css';
import '../styles/header.css';
import '../styles/department.css';
import '../styles/form.css';



const AddDepartment = ({ fetchDepartments, departmentList }) => {
    const [pageLoading, setPageLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState({
        title: '',
        message: '',
        onConfirm: null,
    });
    const [department, setDepartment] = useState([]);
    const [userData, setUserData] = useState({});
    const [departmentName, setDepartmentName] = useState('');
    const [departmentAbb, setDepartmentAbb] = useState('');
    const [addDepartment, setAddDepartment] = useState(false);
    const token = localStorage.getItem('token');
    const [editingIndex, setEditingIndex] = useState(null);
    const [editedDepartment, setEditedDepartment] = useState({
    department_id: "",
    department_name: "",
    department_abb: "",
    });
    const navigate = useNavigate();

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
    const fetchUserData = () => {
        if(!token) return;
        axios.get(`${API_URL}/api/users/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then(response => {
            setUserData(response.data);
        }).catch(err => {
            console.error('Failed to fetch user data', err);
        }); 
    }


    
    useEffect(() => {
        Promise.all([fetchUserData(), fetchDepartments()]).finally(() => {
            setPageLoading(false);
        });
    }, []);



    //HANDLE ADD DEPARTMENT
    const handleAddDepartment = (e) => {
        e.preventDefault();

        if (!departmentName || !departmentAbb) {
            showToast("warning", "Warning", "Please fill in all fields");
            return;
        }

        showModal(
            "Confirm Add Department",
            `Add new department "${departmentName}" (${departmentAbb})?`,
            async () => {
                closeModal();
                try {
                    const payload = {
                        department_name: departmentName,
                        department_abb: departmentAbb,
                        user_code: userData.user_code,
                        role: userData.role,
                    };

                    const res = await axios.post(
                        `${API_URL}/api/users/departments/add`,
                        payload,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    if (res.status === 201) {
                        showToast("success", "Success", "Department added successfully");
                        setDepartmentName("");
                        setDepartmentAbb("");
                        fetchDepartments();
                    }
                } catch (error) {
                    console.error("Error adding department:", error);
                    showToast("error", "Error", "Error adding department");
                }
            }
        );
    };


    //HANDLE UPDATE DEPARTMENT
    const handleSave = (deptId) => {
        showModal(
            "Confirm Update",
            "Are you sure you want to save changes to this department?",
            async () => {
                closeModal();
                try {
                    const res = await axios.put(
                        `${API_URL}/api/users/departments/${deptId}`,
                        editedDepartment,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    if (res.status === 200) {
                        showToast("success", "Update", "Department updated successfully.");
                        setEditingIndex(null);
                        fetchDepartments();
                    }
                } catch (error) {
                    console.error("Error updating department:", error);
                    showToast("error", "Error", "Error updating department");
                }
            }
        );
    };




    //HANDLE DELETE DEPARTMENT
    const handleDelete = (deptId, deptName) => {
        showModal(
            "Confirm Delete",
            `Are you sure you want to delete the department "${deptName}"?`,
            async () => {
                closeModal();
                try {
                    const res = await axios.delete(
                    `${API_URL}/api/users/departments/delete/${deptId}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                        data: {
                        user_code: userData.user_code,
                        role: userData.role,
                        department_name: deptName,
                        },
                    }
                    );

                    if (res.status === 200) {
                        showToast("success", "Delete", "Department deleted successfully.");
                        fetchDepartments();
                    }
                } catch (error) {
                    console.error("Error deleting department:", error);
                    showToast("error", "Error", "Error deleting department");
                }
            }
        );
    };



    return (
      <>
      <div>
        <div className="department-cas-container">
            <div className="department-cas-header">
                <div className="department-buttons-container">
                    {addDepartment ? (
                        <button onClick={() => setAddDepartment(false)} type="button">Close Form</button>
                    ) : (
                        pageLoading ? <ShimmerButton size="lg" />
                        :   <button onClick={() => setAddDepartment(true)} type="button">Add Department</button>
                    )}
                </div> 
            </div>
                <>
                    <div className={`form-container ${addDepartment ? 'slide-down' : 'slide-up'}`}>
                        <form onSubmit={handleAddDepartment}>
                            <div className="form-input">
                                <input name="dept-name" type="text" value={departmentName} onChange={(e) => setDepartmentName(e.target.value)}/>
                                <label htmlFor="dept-name">Department Name</label>
                            </div>
                            <div className="form-input">
                                <input name="dept-abb" type="text" value={departmentAbb} onChange={(e) => setDepartmentAbb(e.target.value)} />
                                <label htmlFor="dept-abb">Department Abbreviation</label>
                            </div>
                            <div className="form-button-container">
                                <button type="submit">Submit</button>
                            </div>
                        </form>
                    </div>
                </>

            <div className="line"></div>

            {pageLoading ? <ShimmerTable row={5} col={4} />
            : <>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Department ID</th>
                                <th>Department Name</th>
                                <th>Department Abbreviation</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                        {departmentList.length > 0 ? (
                            departmentList.map((dept, index) => (
                                <tr key={dept.department_id}>
                                <td>{dept.department_id}</td>
                                <td>
                                    {editingIndex === index ? (
                                    <input
                                        value={editedDepartment.department_name || ""}
                                        onChange={(e) =>
                                        setEditedDepartment({
                                            ...editedDepartment,
                                            department_name: e.target.value,
                                        })
                                        }
                                    />
                                    ) : (
                                    dept.department_name
                                    )}
                                </td>
                                <td>
                                    {editingIndex === index ? (
                                    <input
                                        value={editedDepartment.department_abb || ""}
                                        onChange={(e) =>
                                        setEditedDepartment({
                                            ...editedDepartment,
                                            department_abb: e.target.value,
                                        })
                                        }
                                    />
                                    ) : (
                                    dept.department_abb
                                    )}
                                </td>
                                <td>
                                    {editingIndex === index ? (
                                    <>
                                        <button onClick={() => handleSave(dept.department_id)}>
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
                                        <button onClick={() => navigate(`/user/department/${dept.department_id}`)}>
                                            <span className="material-symbols-outlined view-icon">visibility</span>
                                            <span className="tooltip">View Department</span>
                                        </button>
                                        {!addDepartment && (
                                            <>
                                                <button onClick={() => {
                                                    setEditingIndex(index);
                                                    setEditedDepartment(dept);
                                                    }}>
                                                    <span className="material-symbols-outlined edit-icon">edit</span>
                                                    <span className="tooltip">Edit Department</span>
                                                </button>
                                            </>
                                        )}
                                        <button onClick={() => handleDelete(dept.department_id, dept.department_name)}>
                                            <span className="material-symbols-outlined delete-icon">delete</span>
                                        <span className="tooltip">Delete Department</span>
                                        </button>
                                    </>
                                    )}
                                </td>
                                </tr>
                            ))
                            ) : (
                            <tr>
                                <td colSpan="4">No departments available.</td>
                            </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </>}
            
        </div>
      </div>
        
        <ConfirmModal
            show={modalConfig.show}
            title={modalConfig.title}
            message={modalConfig.message}
            onConfirm={modalConfig.onConfirm}
            onCancel={closeModal}
        />

        <div className="toast-box" id="toast-box"></div>
      </>
    );

}


export default AddDepartment;

