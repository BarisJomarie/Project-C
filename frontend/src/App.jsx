import axios from 'axios'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './components/Login'
import SignUp from './components/SignUp'
import Homepage from './components/Homepage'
import ForgotPassword from './components/ForgotPassword'
import SecurityQuestion from './components/SecurityQuestion'
import NewPassword from './components/NewPassword'
import Header from './components/Header'
import Department from './components/Department'
import AddResearch from './components/AddResearch'
import AddCourse from './components/AddCourse'
import EditProfile from './components/EditProfile'
import ViewProfile from './components/ViewProfile'
import AddDepartment from './components/AddDepartment'
import Unauthorized from './components/Unauthorized'
import AIReport from './components/AIReport'
import Users from './components/Users'
import AuditLogs from './components/AuditLogs'
import UserPage from './components/UserPage'
import ResearchPaperPage from './components/ResearchPaperPage'
import AddPresentation from './components/AddPresentation'
import AddPublication from './components/AddPublication'




function App() {
  const [departments, setDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;

  // To always load department sa header
  const fetchDepartments = () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    setDeptLoading(true);

    if (token && role === 'admin') {
      return axios.get(`${API_URL}/api/users/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setDepartments(res.data))
      .catch(err => console.error("Admin fetch error:", err))
      .finally(() => setDeptLoading(false));
    } else if (token && (role === 'rph' || role === 'faculty')) {
      const id = localStorage.getItem('department_id');
      return axios.get(`${API_URL}/api/users/departments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setDepartments([res.data])) 
      .catch(err => console.error("Failed to fetch department:", err))
      .finally(() => setDeptLoading(false));
    } else {
      setDeptLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return (
    <>
    <Routes>
      <Route path='/' element={<Navigate to='/signin' replace />} />

      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route path='/signin' element={<Login />}/>
      <Route path='/signup' element={<SignUp />}/>

      <Route path='/forgot-password' element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<SecurityQuestion />} />
      <Route path='/new-password/:email' element={<NewPassword />} />


      <Route element={<Header departments={departments} fetchDepartments={fetchDepartments} deptLoading={deptLoading}/>}>
        <Route path='/user/homepage' element={<ProtectedRoute allowedRoles={['admin']}> <Homepage/> </ProtectedRoute>}/>
        <Route path='/user/department/:dep_id' element={<ProtectedRoute allowedRoles={['admin', 'rph', 'faculty']}> <Department/> </ProtectedRoute>}/>
        <Route path='/user/department/:dep_id/research_add' element={<ProtectedRoute allowedRoles={['admin', 'rph', 'faculty']}> <AddResearch/> </ProtectedRoute>}/>
        <Route path='/user/users/:user_id' element={<ProtectedRoute allowedRoles={['admin', 'rph', 'faculty']}> <UserPage/> </ProtectedRoute>}/>
        <Route path='/user/department/:dep_id/paper/:paper_id' element={<ProtectedRoute allowedRoles={['admin', 'rph', 'faculty']}> <ResearchPaperPage/> </ProtectedRoute>}/>
        <Route path='/edit-profile' element={<ProtectedRoute allowedRoles={['admin', 'rph', 'faculty']}><EditProfile /></ProtectedRoute>} />
        <Route path='/view-profile' element={<ProtectedRoute allowedRoles={['admin', 'rph', 'faculty']}><ViewProfile /></ProtectedRoute>} />

        <Route path='/user/department/:dep_id/ai_report' element={<ProtectedRoute allowedRoles={['admin', 'rph']}> <AIReport/> </ProtectedRoute>}/>
        <Route path='/user/department/:dep_id/research-presentation-add' element={<ProtectedRoute allowedRoles={['admin', 'rph']}><AddPresentation /></ProtectedRoute>} />
        <Route path='/user/department/:dep_id/research-publication-add' element={<ProtectedRoute allowedRoles={['admin', 'rph']}><AddPublication /></ProtectedRoute>} />

        <Route path='/user/course_add' element={<ProtectedRoute allowedRoles={['admin']}> <AddCourse/> </ProtectedRoute>}/>
        <Route path='/user/users' element={<ProtectedRoute allowedRoles={['admin']}> <Users/> </ProtectedRoute>}/>
        <Route path='/user/audit' element={<ProtectedRoute allowedRoles={['admin']}> <AuditLogs/> </ProtectedRoute>}/>
        <Route path='/user/department/add_department' element={<ProtectedRoute allowedRoles={['admin']}> <AddDepartment fetchDepartments={fetchDepartments} departmentList={departments}/> </ProtectedRoute>}/>
      </Route>
    </Routes>
    </>
  )
}

export default App
