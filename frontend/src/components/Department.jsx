import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { showToast } from "../utils/toast";
import { ShimmerButton, ShimmerTable, ShimmerTitle } from "react-shimmer-effects";
import ConfirmModal from "../utils/ConfirmModal";
import axios from "axios";
import * as XLSX from 'xlsx';
import '../styles/department.css';
import '../styles/style.css';
import '../styles/table.css';



const Department = () => {
  const [pageLoading, setPageLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [modalConfig, setModalConfig] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirmn',
  });
  const [userData, setUserData] = useState(null);
  const [department, setDepartment] = useState([]);
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [departmentStudentPapers, setDepartmentStudentPapers] = useState([]);
  const [departmentFacultyPapers, setDepartmentFacultyPapers] = useState([]);
  const [departmentCourse, setDepartmentCourse] = useState([]);
  const [activeTable, setActiveTable] = useState('users');
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const userRef = useRef(null);
  const studentPaperRef = useRef(null);
  const facultyPaperRef = useRef(null);
  const courseRef = useRef(null);
  const {dep_id} = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const researchPresentationRef = useRef(null);
  const researchPublicationRef = useRef(null);
  const [departmentResearchPresentation, setDepartmentResearchPresentation] = useState([]);
  const [departmentResearchPublications, setDepartmentResearchPublications] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // ADD FORM PUBLICATION STATES
  const [showAddPublicationForm, setShowAddPublicationForm] = useState(false);

  const [published_title, setPubTitle] = useState("");
  const [pub_author, setPubAuthor] = useState("");
  const [pub_co_authors, setPubCoAuthors] = useState([""]);
  const [journal_title, setPubJournal] = useState("");
  const [conference_or_proceedings, setPubConference] = useState("");
  const [publisher, setPubPublisher] = useState("");
  const [pubDatePresented, setPubDatePresented] = useState("");
  const [pubEndDatePresented, setPubEndDatePresented] = useState("");
  const [doi, setPubDOI] = useState("");
  const [issn_isbn, setPubISSN] = useState("");
  const [volume_issue, setPubVolumeIssue] = useState("");
  const [index_type, setPubIndex] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  const now = new Date();

  const showModal = (title, message, onConfirm, confirmText) => {
    setModalConfig({
      show: true,
      title,
      message,
      onConfirm,
      confirmText,
    });
  };

  const closeModal = () => {
    setModalConfig(prev => ({...prev, show:false}));
  };

  const sdgColors = [
    "#e5233d", "#dda73a", "#4ca146", "#c7212f",
    "#ef402d", "#27bfe6", "#fbc412", "#fbc412",
    "#f26a2e", "#e01483", "#f89d2a", "#bf8d2c",
    "#407f46", "#1f97d4", "#59ba47", "#136a9f",
    "#14496b"
  ];

  // CO-AUTHOR HANDLERS PUBLICATION
  const addPubCoAuthor = () => setPubCoAuthors([... pub_co_authors, ""]);
  const removePubCoAuthor = (index) => {
    const updated = pub_co_authors.filter((_, i) => i !== index);
    setPubCoAuthors(updated);
  };

const updatePubCoAuthor = (value, index) => {
  const updated = [...pub_co_authors];
  updated[index] = value;
  setPubCoAuthors(updated);
};


  // GET USER DATA
  const getUserData = () => {
    return axios.get(`${API_URL}/api/users/user-info`, {
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
    });
  };

  // GET DEPARTMENT INFO
  const fetchDepartment = () => {
    return axios.get(`${API_URL}/api/users/department/info`, {
      params: { department_id: dep_id },
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        // console.log(`Department fetched`);
        // console.log(res.data);
      } else {
        console.log(`Department not found`);
      }
      setDepartment(res.data);
    }).catch(err => {
      console.error('Error fetching department', err);
    });
  }

  // GET DEPARTMENT USERS
  const fetchDepartmentUsers = () => {
    setTableLoading(true);
    return axios.get(`${API_URL}/api/users/user-department`, {
      params: { department_id: dep_id },
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        // console.log(`Department (${dep_id}): Users fetched`);
      } else {
        console.log(`Department (${dep_id}): No users fetched`);
      }
      setDepartmentUsers(res.data);
    }).catch(err => {console.error('Error fetching user:', err);
      setDepartmentUsers([]);
    }).finally(() => {
      setTableLoading(false);
    });
  };

  // GET DEPARTMENT STUDENT PAPERS
  const fetchStudentPapers = () => {
    setTableLoading(true);
    axios.get(`${API_URL}/api/users/department-papers`, {
      params: { department_id: dep_id, type: 'student' },
      headers: { Authorization: `Bearer ${token}`}
    }).then(res => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        // console.log(`Department (${dep_id}): Papers fetched`);
        // console.log(res.data);
      } else {
        console.log(`Department (${dep_id}): No papers found`);
      }
      setDepartmentStudentPapers(res.data);
    }).catch(err => {console.error('Error fetching faculty papers:', err);
      setDepartmentStudentPapers([]);
    }).finally(() => {
      setTableLoading(false);
    });
  }

  // GET DEPARTMENT FACULTY PAPERS
  const fetchFacultyPapers = () => {
    setTableLoading(true);
    axios.get(`${API_URL}/api/users/department-papers-faculty`, {
      params: { department_id: dep_id, type: 'faculty' },
      headers: { Authorization: `Bearer ${token}`}
    }).then(res => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        // console.log(`Department (${dep_id}): Papers fetched`);
      } else {
        console.log(`Department (${dep_id}): No papers found`);
      }
      setDepartmentFacultyPapers(res.data);
    }).catch(err => {console.error('Error fetching faculty papers:', err);
      setDepartmentFacultyPapers([]);
    }).finally(() => {
      setTableLoading(false);
    });
  }

  // GET PRESENTATION PAPERS
  const fetchResearchPresentation = async () => {
    setTableLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/users/presentation/department`, {
        params: { department_id: dep_id },
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = res.data.map(item => ({
        ...item,
        co_authors: Array.isArray(item.co_authors) ? item.co_authors : [],
        sdg_alignment: Array.isArray(item.sdg_alignment)
          ? item.sdg_alignment
          : (() => {
              try {
                return JSON.parse(item.sdg_alignment || "[]");
              } catch {
                return [];
              }
            })()
      }));

      setDepartmentResearchPresentation(data);
    } catch (err) {
      console.error("Error fetching research presentations:", err);
      setDepartmentResearchPresentation([]);
    } finally {
      setTableLoading(false);
    };
  };

  // GET DEPARTMENT RESEARCH PUBLICATIONS
  const fetchResearchPublications = () => {
    setTableLoading(true);
    axios.get(`${API_URL}/api/users/publication/department`, {
      params: { department_id: dep_id },
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setDepartmentResearchPublications(res.data);
    })
    .catch(err => {
      console.error("Error fetching research publications:", err);
      setDepartmentResearchPublications([]);
    })
    .finally(() => {
      setTableLoading(false);
    });
  };
  
  // ADD RESEARCH PUBLICATIONS
  const handleAddPublication = async (e) => {
    e.preventDefault();

    const data = {
      published_title,
      pub_author,
      pub_co_authors,
      journal_title,
      conference_or_proceedings,
      publisher,
      pub_date_presented: pubDatePresented,
      pub_end_date_presented: pubEndDatePresented,
      doi,
      issn_isbn,
      volume_issue,
      index_type,
      department_id: dep_id
    };

    try {
      await axios.post(`${API_URL}/api/users/publication/add`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showToast("success", "Success!", "Research publication added.");

      setShowAddPublicationForm(false);

      // Clear inputs
      setPubTitle("");
      setPubAuthor("");
      setPubCoAuthors([""]);
      setPubJournal("");
      setPubConference("");
      setPubPublisher("");
      setPubDatePresented("");   // <-- clear state
      setPubEndDatePresented(""); // <-- clear state
      setPubDOI("");
      setPubISSN("");
      setPubVolumeIssue("");
      setPubIndex("");

      fetchResearchPublications();
    } catch (error) {
      showToast("error", "Failed", "Something went wrong.");
    }
  };

  // GET DEPARTMENT COURSES
  const fetchDepartmentCourses = () => {
    setTableLoading(true);
    axios.get(`${API_URL}/api/users/department-courses`, {
      params: { department_id: dep_id },
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        // console.log(`Department (${dep_id}): Courses fetched`);
      } else {
        console.log(`Department (${dep_id}):No courses fetched`);
      }
      setDepartmentCourse(res.data);
    }).catch(err => {console.error('Error fetching courses:', err);
      setDepartmentCourse([]);
    }).finally(() => {
      setTableLoading(false);
    });
  };

  useEffect(() => {
    if (!dep_id) return;

    setPageLoading(true);
    setActiveTable('users');

    Promise.all([
      getUserData(),
      fetchDepartment(),
      fetchDepartmentUsers()
    ])
    .finally(() => {
      setPageLoading(false);
    });
  }, [dep_id]);


  useEffect(() => {
    const updateIndicator = () => {
      const activeRef = activeTable === 'users' ? userRef : activeTable === 'student-paper' ? studentPaperRef : activeTable === 'faculty-paper' ? facultyPaperRef : activeTable === 'research-presentation' ? researchPresentationRef : activeTable === 'research-publications' ? researchPublicationRef: courseRef;

      if (activeRef && activeRef.current) {
        const { offsetLeft, offsetWidth } = activeRef.current;
        setIndicatorStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`
        });
      }
    };

    // run once when dependencies change (including when page finishes loading)
    updateIndicator();

    // update on window resize to keep indicator aligned
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTable, pageLoading]);

  // DELETE PAPER
  const handleDeletePaper = (id) => {
    const paper = departmentFacultyPapers.find((p) => p.research_id === id)
      || departmentStudentPapers.find((p) => p.research_id === id);

    if (!paper) return showToast('error', 'Not Found', 'Paper not found.');

    showModal(
      'Deleting Paper',
      <>Are you sure you want to delete this {
        paper.research_type === 'student' 
          ? <><i>Student Thesis paper</i></>
          : <><i>Faculty Research Paper</i></>
        }:  
        <br/><br/>
        Title: <strong>"{paper.research_title}"</strong>?</>,
      async () => {
        try {
          await axios.delete(`${API_URL}/api/users/research-delete/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          showToast('success', 'Paper Deleted', 'Paper deleted successfully.');
          fetchStudentPapers();
          fetchFacultyPapers();
        } catch (err) {
          console.error('Delete failed:', err);
          showToast('error', 'Delete Failed', 'Could not delete paper.');
        } finally {
          closeModal();
        }
      },
      'Delete Paper'
    );
  }
  // DELETE PRESENTATION PAPERS
  const handleDeletePresentation = (id) => {
    const presentation = departmentResearchPresentation.find(p => p.id === id);
    if (!presentation) return showToast('error', 'Not Found', 'Presentation not found.');

    showModal(
      'Deleting Presentation',
      <>
        Are you sure you want to delete this presentation? <br/><br/>
        Title: <strong>{presentation.research_title}</strong>
      </>,
      async () => {
        try {
          await axios.delete(`${API_URL}/api/users/presentation/delete/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          showToast('success', 'Deleted', 'Presentation deleted successfully.');
          fetchResearchPresentation(); // refresh list
        } catch (err) {
          console.error('Delete failed:', err);
          showToast('error', 'Delete Failed', 'Could not delete presentation.');
        } finally {
          closeModal();
        }
      },
      'Delete Presentation'
    );
  };

  // DELETE RESEARCH PUBLICATION
  const handleDeletePublication = (id) => {
    const publication = departmentResearchPublications.find(p => p.id === id);
    if (!publication) return showToast('error', 'Not Found', 'Publication not found.');

    showModal(
      'Deleting Publication',
      <>
        Are you sure you want to delete this publication? <br/><br/>
        Title: <strong>{publication.research_title}</strong>
      </>,
      async () => {
        try {
          await axios.delete(`${API_URL}/api/users/publication/delete/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          showToast('success', 'Deleted', 'Publication deleted successfully.');
          fetchResearchPublications();
        } catch (err) {
          console.error('Delete failed:', err);
          showToast('error', 'Delete Failed', 'Could not delete publication.');
        } finally {
          closeModal();
        }
      },
      'Delete Publication'
    );
  };

  // DELETE COURSE
  const handleDeleteCourse = (id) => {
    const course = departmentCourse.find((c) => c.course_id === id);
    
    if (!course) return showToast('error', 'Not Found', 'Course not found.');

    showModal(
      'Deleting Course',
      <>
        Are you sure you want to delete this course?
        <br/><br/>
        Course: <strong>{course.course_name}</strong>
      </>,
      async () => {
        try {
          await axios.delete(`${API_URL}/api/users/course/delete/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
            showToast('success', 'Course Deleted', 'Course deleted successfully.');
            fetchDepartmentCourses();
        } catch(err) {
              console.error('Delete failed:', err);
              showToast('error', 'Delete Failed', 'Could not delete course.');
        } finally {
          closeModal();
        };
      },
      'Delete Course'
    );
  }
  
  // GET SDG COLOR
  function getSdgColor(numbers) {
    if (!numbers || numbers.length === 0) return '#0f172a';
    // ✅ if it's an array, take the first SDG number
    const num = Array.isArray(numbers) ? numbers[0] : numbers;
    // ✅ convert to integer (handles strings like "15")
    const index = parseInt(num, 10) - 1;

    return sdgColors[index] || '#0f172a';
  }


  // PRINT PRESENTATION
  const handleExportPresentationToExcel = () => {
    try {
      const exportData = departmentResearchPresentation.map((item, index) => ({
        'Department': item.department_abb || department[0]?.department_abb || '',
        'Author': item.author || '',
        'Co-author': Array.isArray(item.co_authors) ? item.co_authors.filter(co => co && co.trim()).join(', ') : (item.co_authors || ''),
        'Title of Research Paper': item.research_title || '',
        'SDG Alignment': Array.isArray(item.sdg_alignment) ? item.sdg_alignment.join(', ') : (item.sdg_alignment || ''),
        'Conference Title': item.conference_title || '',
        'Organizer': item.organizer || '',
        'Venue': item.venue || '',
        'Date Presented': formatDateRange(item.date_presented, item.end_date_presented) || '',
        'Type of Conference': item.conference_category || '',
        'Special Order No.': item.special_order_no || '',
        'Status': item.status_engage || '',
        'Funding Source': item.funding_source_engage || ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths for better alignment
      ws['!cols'] = [
        { wch: 12 },  // Department
        { wch: 25 },  // Author
        { wch: 25 },  // Co-author
        { wch: 50 },  // Title of Research Paper
        { wch: 35 },  // SDG Alignment
        { wch: 40 },  // Conference Title
        { wch: 35 },  // Organizer
        { wch: 30 },  // Venue
        { wch: 20 },  // Date Presented
        { wch: 25 },  // Type of Conference
        { wch: 20 },  // Special Order No.
        { wch: 12 },  // Status
        { wch: 18 }   // Funding Source
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Research Presentation');
      
      XLSX.writeFile(wb, `Research_Presentation_${department[0]?.department_abb || 'Export'}_${new Date().getFullYear()}.xlsx`);
      
      showToast('success', 'Export Successful', 'Research Presentation data exported to Excel');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showToast('error', 'Export Failed', 'Failed to export data to Excel');
    }
  };

  const handleExportPublicationToExcel = () => {
    try {
      const exportData = departmentResearchPublications.map((item, index) => ({
        '#': index + 1,
        'Published Title': item.published_title || '',
        'Author': item.pub_author || '',
        'Co-author': Array.isArray(item.pub_co_authors) ? item.pub_co_authors.filter(co => co && co.trim()).join(', ') : (item.pub_co_authors || ''),
        'Title of Journal / Publication': item.journal_title || '',
        'Conference / Proceedings': item.conference_or_proceedings || '',
        'Publisher': item.publisher || '',
        'Date of Publication': item.pub_date_presented ? formatDateRange(item.pub_date_presented, item.pub_end_date_presented) : '',
        'DOI': item.doi || '',
        'ISSN / ISBN': item.issn_isbn || '',
        'Volume & Issue No.': item.volume_issue || '',
        'Index': item.index_type || ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths for better alignment
      ws['!cols'] = [
        { wch: 5 },   // #
        { wch: 50 },  // Published Title
        { wch: 25 },  // Author
        { wch: 25 },  // Co-author
        { wch: 40 },  // Title of Journal
        { wch: 35 },  // Conference
        { wch: 30 },  // Publisher
        { wch: 20 },  // Date
        { wch: 40 },  // DOI
        { wch: 25 },  // ISSN/ISBN
        { wch: 20 },  // Volume
        { wch: 30 }   // Index
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Research Publication');
      
      XLSX.writeFile(wb, `Research_Publication_${department[0]?.department_abb || 'Export'}_${new Date().getFullYear()}.xlsx`);
      
      showToast('success', 'Export Successful', 'Research Publication data exported to Excel');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showToast('error', 'Export Failed', 'Failed to export data to Excel');
    }
  };

  // PRINT PRESENTATION
  const confirmPrint = () => {
    showModal(
      'Printing Presentation',
      `This presentation will be printed. Do you want to continue?`,
      async () => {
        try {
          const printContents = document.getElementById('printable-table')?.innerHTML;
          if (!printContents) return;

          const printWindow = window.open('', '_blank', 'width=1200,height=800');

          printWindow.document.write(`
            <html>
            <head>
            <title>Research Presentation</title>
            <style>
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              body { 
                font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; 
                font-size: 0.85em; 
                background: #fff; 
                color: #000; 
                margin: 0;
                padding: 20px;
              }
              table { 
                width: 100%; 
                border-collapse: collapse !important;
                page-break-inside: auto;
                border-left: none;
              }
              tbody tr {
                border-left: 2px solid #1e293b;
              }

              th, td { 
                border: none !important;
                padding: 8px 6px; 
                text-align: left; 
                vertical-align: top;
                page-break-inside: avoid;
                page-break-after: auto;
              }
              thead th {
                border: none !important;
              }
              tbody td {
                border: none !important;
              }
              tfoot td {
                border: none !important;
              }
              thead tr:first-child th {
                border: none !important;
                font-size: 1em;
                font-weight: bold;
                padding: 15px 10px;
                background: transparent;
                text-transform: uppercase;
              }
              thead tr:nth-child(2) th {
                background-color: #1e293b !important;
                color: white !important;
                font-weight: 600;
                padding: 10px 6px;
                border: none !important;
                text-transform: none;
                text-align: left;
                font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              tbody td {
                font-size: 0.85em;
                line-height: 1.4;
                font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
              }
              tbody tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              tr.self-funded {
                background-color: #FFFF00 !important;
              }
              .print-footer {
                border-top: 1px solid #000;
                font-weight: 600;
                text-transform: uppercase;
                white-space: nowrap !important;
                vertical-align: middle;
              }

              @media print {
                
                @page {
                  size: A4 landscape;
                  margin: 10mm;
                   @bottom-right {
                    content: "Page " counter(page);
                    font-size: 1em;
                    font-weight: 600;
                    font-family: 'Arial';
                  }
                }
                  
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }

                html {
                  counter-reset: page;
                }

                body {
                  margin: 0;
                  padding: 0;
                  background: white;
                }

                .print-footer-left,
                .print-footer-center {
                  display: block;
                  position: fixed;
                  bottom: 0mm;
                  font-size: 1em;
                  font-weight: 600;
                  text-transform: uppercase;
                }

                .print-footer-left { left: 10mm; text-align: left; }
                .print-footer-center { left: 50%; transform: translateX(-30%); text-align: center; }
                
                .print-header {
                  display: table-header-group;
                }
                .print-footer {
                  display: table-cell !important;
                  padding: 30px 10px 10px 10px !important;
                  font-weight: 600 !important;
                  font-size: 11px !important;
                  text-transform: uppercase !important;
                  white-space: nowrap !important;
                  vertical-align: middle !important;
                  visibility: visible !important;
                }
                
                
                tbody tr {
                  border-left: 2px solid #1e293b;
                  page-break-inside: auto !important;
                }
                tfoot {
                  display: table-footer-group !important;
                  visibility: visible !important;
                }
                tfoot tr {
                  display: table-row !important;
                  page-break-inside: auto !important;
                  visibility: visible !important;
                }
                tfoot td {
                  display: table-cell !important;
                  white-space: nowrap !important;
                  padding: 10px !important;
                  font-size: 1em !important;
                  visibility: visible !important;
                }
               
                table {
                  border-collapse: collapse;
                  width: 100%;
                  border: 1px solid #000 !important;
                  page-break-inside: auto;
                }
                thead {
                  display: table-header-group;
                }
                tfoot {
                  display: table-footer-group;
                }
                thead tr:first-child th {
                  border: none !important;
                  font-size: 1em;
                  font-weight: bold;
                  padding: 15px 10px;
                  background: transparent !important;
                  text-transform: uppercase;
                }
                thead tr:nth-child(2) th {
                  background-color: #1e293b !important;
                  color: white !important;
                  font-weight: 600 !important;
                  border: none !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                  padding: 10px 6px !important;
                  text-transform: none !important;
                  text-align: left !important;
                  font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif !important;
                }
                table {
                  border-collapse: collapse !important;
                  border: none !important;
                }
                table th, table td {
                  border: none !important;
                }
                thead th {
                  border: none !important;
                }
                tbody td {
                  border: none !important;
                }
                tfoot td {
                  border: none !important;
                }
                tbody tr {
                  page-break-after: auto;
                }
                tr.self-funded {
                  background-color: #FFFF00 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                table th, table td {
                  border: none !important;
                  font-size: 0.85em;
                  padding: 8px 6px;
                  text-align: left;
                  vertical-align: top;
                  page-break-inside: avoid;
                  font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif !important;
                }
                table td:first-child {
                  text-align: center;
                }
                table tr {
                  border: none;
                }
                thead tr:first-child, tfoot tr {
                  border: none;
                }
                thead tr.esp-tr th {
                  background-color: #1E4A40 !important;
                  color: white !important;
                  text-transform: none !important;
                  text-align: left !important;
                  font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                table th:last-child,
                table tbody td:last-child,
                .delete-btn,
                .department-buttons-container,
                button[onclick="confirmPrint()"],
                .add-form-container,
                .action-column {
                  display: none !important;
                }
                tfoot,
                tfoot tr,
                tfoot td {
                  visibility: visible !important;
                }
              }
            </style>
            </head>
            <body>
              <div id="page-marker"></div>
              <div id="page-number"></div>
              ${printContents}
            </body>
            </html>
            `);


          printWindow.document.close();

          printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
          };

          // No audit log for printing

        } catch (err) {
          console.error("Error printing presentation:", err);
          showToast("error", "Print Error", "Something went wrong while printing."); 
        } finally {
          closeModal();
        }
      },
      'Print presentation'
    );
  };

  // PRINT PUBLICATIONS
  const confirmPrint2 = () => {
    showModal(
      'Printing Presentation',
      `This presentation will be printed. Do you want to continue?`,
      async () => {
        try {
          const printContents = document.getElementById('printable-table')?.innerHTML;
          if (!printContents) return;

          const printWindow = window.open('', '_blank', 'width=1200,height=800');

          printWindow.document.write(`
            <html>
            <head>
            <title>Research Publication</title>
            <style>
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              body { 
                font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; 
                font-size: 0.85em; 
                background: #fff; 
                color: #000; 
                margin: 0;
                padding: 20px;
              }
              table { 
                width: 100%; 
                border-collapse: collapse !important;
                page-break-inside: auto;
                border: none;
              }

              th, td { 
                border: 1px solid black !important;
                padding: 8px 6px; 
                text-align: left; 
                vertical-align: top;
                page-break-inside: avoid;
                page-break-after: auto;
              }
              thead th {
                border: 1px solid grey !important;
              }
              tbody td {
                border: 1px solid grey !important;
              }
              tfoot td {
                border: 1px solid grey !important;
              }
              thead tr:first-child th {
                border: none !important;
                font-size: 1em;
                font-weight: bold;
                padding: 15px 10px;
                background: transparent;
                text-transform: uppercase;
              }
              thead tr:nth-child(2) th {
                background-color: #000f3f !important;
                color: white !important;
                font-weight: 600;
                padding: 10px 6px;
                border: none !important;
                text-transform: none;
                text-align: center;
                font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              tbody td {
                font-size: 0.85em;
                line-height: 1.4;
                font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
              }
              tbody tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              tr.self-funded {
                background-color: #FFFF00 !important;
              }
              .print-footer {
                border-top: 1px solid #000;
                font-weight: 600;
                text-transform: uppercase;
                white-space: nowrap !important;
                vertical-align: middle;
              }

              @media print {
                
                @page {
                  size: A4 landscape;
                  margin: 10mm;
                   @bottom-right {
                    content: "Page " counter(page);
                    font-size: 1em;
                    font-weight: 600;
                    font-family: 'Arial';
                  }
                }
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                body {
                  margin: 0;
                  padding: 0;
                  background: white;
                }

                .print-footer-left,
                .print-footer-center {
                  display: block;
                  position: fixed;
                  bottom: 0mm;
                  font-size: 1em;
                  font-weight: 600;
                  text-transform: uppercase;
                }

                .print-footer-left { left: 10mm; text-align: left; }
                .print-footer-center { left: 50%; transform: translateX(-30%); text-align: center; }
                
                .print-header {
                  display: table-header-group;
                }
                .print-footer {
                  display: table-cell !important;
                  padding: 30px 10px 10px 10px !important;
                  font-weight: 600 !important;
                  font-size: 11px !important;
                  text-transform: uppercase !important;
                  white-space: nowrap !important;
                  vertical-align: middle !important;
                  visibility: visible !important;
                  border: none !important;
                }
                .print-page-number::after {
                  counter-increment: page;
                  content: " " counter(page);
                }
                tfoot {
                  display: table-footer-group !important;
                  visibility: visible !important;
                  border: none;
                }
                tfoot tr {
                  display: table-row !important;
                  page-break-inside: avoid !important;
                  page-break-after: avoid !important;
                  visibility: visible !important;
                  border: none;
                }
                tfoot td {
                  display: table-cell !important;
                  white-space: nowrap !important;
                  padding: 10px !important;
                  font-size: 11px !important;
                  visibility: visible !important;
                  border: none;
                }
                
                table {
                  border-collapse: collapse;
                  width: 100%;
                  border: 1px solid #D3D3D3 !important;
                  page-break-inside: auto;
                }
                thead {
                  display: table-header-group;
                }
                tfoot {
                  display: table-footer-group;
                }
                thead tr:first-child th {
                  border: none !important;
                  font-size: 1em;
                  font-weight: bold;
                  padding: 15px 10px;
                  background: transparent !important;
                  text-transform: uppercase;
                }
                thead tr:nth-child(2) th {
                  background-color: #000f3f !important;
                  color: white !important;
                  border: 1px solid #D3D3D3 !important;
                  font-weight: 600 !important;
                  border: none !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                  padding: 10px 6px !important;
                  text-transform: none !important;
                  text-align: left !important;
                  font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif !important;
                }
                table {
                  border-collapse: collapse !important;
                  border: none !important;
                }
                table th, table td {
                  border: 1px solid #D3D3D3 !important;
                }
                thead th {
                  border: 1px solid #D3D3D3 !important;
                }
                tbody td {
                  border: 1px solid #D3D3D3 !important;
                }
                tfoot td {
                  border: none !important;
                }
                tbody tr {
                  page-break-inside: avoid;
                  page-break-after: auto;
                }
                table th, table td {
                  border: 1px solid #D3D3D3 !important;
                  font-size: 0.85em;
                  padding: 8px 6px;
                  text-align: left;
                  vertical-align: top;
                  page-break-inside: avoid;
                  font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif !important;
                }
                table td:first-child {
                  text-align: center;
                }
                table tr {
                  border: none;
                }
                thead tr:first-child, tfoot tr {
                  border: none;
                }
                thead tr.esp-tr th {
                  background-color: #000f3f !important;
                  color: white !important;
                  text-transform: none !important;
                  text-align: center !important;
                  font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                table th:last-child,
                table tbody td:last-child,
                .delete-btn,
                .department-buttons-container,
                button[onclick="confirmPrint()"],
                .add-form-container,
                .action-column {
                  display: none !important;
                }
                tfoot,
                tfoot tr,
                tfoot td {
                  visibility: visible !important;
                  border: none;
                }

                .print-footer {
                  border: none;
                }
              }
            </style>
            </head>
            <body>${printContents}</body>
            </html>
            `);


          printWindow.document.close();

          printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
          };

          // No audit log for printing

        } catch (err) {
          console.error("Error printing presentation:", err);
          showToast("error", "Print Error", "Something went wrong while printing."); 
        } finally {
          closeModal();
        }
      },
      'Print presentation'
    );
  };

function formatDateRange(startDate, endDate) {
  if (!startDate) return '';

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : start;

  const monthDay = { month: 'long', day: 'numeric' };

  // If same day
  if (start.getTime() === end.getTime()) {
    return start.toLocaleDateString('en-US', { ...monthDay, year: 'numeric' });
  }

  // Same month + year → "May 16–18, 2025"
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
  }

  // Different months/years
  return `${start.toLocaleDateString('en-US', monthDay)} - ${end.toLocaleDateString('en-US', monthDay)}, ${end.getFullYear()}`;
}

  const toAddPaper = () => navigate(`/user/department/${dep_id}/research_add`);
  const toAiAnalysis = () => navigate(`/user/department/${dep_id}/ai_report`);


  return (
    <>
      <div className="department-container">
        {pageLoading ? <ShimmerTitle line={1} gap={10} variant="primary"/> : <h1>{department[0]?.department_name}</h1>}
        <div className='line'></div>
        <div className="department-buttons-container">

          {pageLoading ? <>
            <ShimmerButton size="lg"/>
            <ShimmerButton size="lg"/>
            <ShimmerButton size="lg"/>
          </> : <>
            {activeTable === 'users' && (
              <button onClick={() => navigate('/user/users')} type="button">
                Add A User
              </button>
            )}

            {activeTable === 'student-paper' || activeTable === 'faculty-paper' ? (
              <>
                <button onClick={() => toAddPaper()} type="button">
                  Add Paper
                </button>
                {userData?.role !== 'faculty' && <button onClick={() => toAiAnalysis()} type="button">AI Analysis</button>}
              </>
            ) : null}
            
            {activeTable === 'research-presentation' && userData?.role !== 'faculty' ? (<>
              <button
                type="button"
                onClick={() => navigate(`/user/department/${dep_id}/research-presentation-add`)}
              >
                {showAddForm ? "Close Form" : "Add Research Presentation"}
              </button>
              <button type="button" onClick={confirmPrint}>Print Table</button>
              <button type="button" onClick={handleExportPresentationToExcel}>Save as Excel</button>
            </>) : null}

            {activeTable === 'research-publications' && userData?.role !== 'faculty' ? (<>
              <button
                type="button"
                // onClick={() => navigate(`/user/department/${dep_id}/research-publication-add`)}
                onClick={() => setShowAddPublicationForm(!showAddPublicationForm)}
              >
                {showAddPublicationForm ? "Close Form" : "Add Research Publication"}
              </button>

              <button type="button" onClick={confirmPrint2}> Print Table </button>
              <button type="button" onClick={handleExportPublicationToExcel}>Save as Excel</button>
            </>) : null}

            {activeTable === 'course' && userData?.role === 'admin' && (
              <button onClick={() => navigate('/user/course_add')} type="button">
                Add A Course
              </button>
            )}
          </>}  
        </div>  

        <div className="table-selector">
          {pageLoading ? <ShimmerTitle line={1} gap={10} variant="primary"/> : <>
            <div className="tab-group">
              {/* <p>Select: </p> */}
              <div className="tab-labels">
                <h3
                  ref={userRef}
                  className={activeTable === 'users' ? 'active-tab' : ''}
                  onClick={() => {
                    fetchDepartmentUsers();
                    setActiveTable('users');
                  }}
                >
                  Users
                </h3>
                <h3
                  ref={studentPaperRef}
                  className={activeTable === 'student-paper' ? 'active-tab' : ''}
                  onClick={() => {
                    fetchStudentPapers();
                    setActiveTable('student-paper');
                  }}
                >
                  Student&nbsp;Thesis
                </h3>
                <h3
                  ref={facultyPaperRef}
                  className={activeTable === 'faculty-paper' ? 'active-tab' : ''}
                  onClick={() => {
                    fetchFacultyPapers();
                    setActiveTable('faculty-paper');
                  }}
                >
                  Faculty&nbsp;Research
                </h3>

                {userData?.role !== 'faculty' && (
                  <>
                    <h3
                    ref={researchPresentationRef}
                    className={activeTable === 'research-presentation' ? 'active-tab' : ''}
                    onClick={() => {
                      fetchResearchPresentation();
                      setActiveTable('research-presentation');
                    }}
                  >
                    Research&nbsp;Presentation
                  </h3>
                  <h3
                    ref={researchPublicationRef}
                    className={activeTable === 'research-publications' ? 'active-tab' : ''}
                    onClick={() => {
                      fetchResearchPublications();
                      setActiveTable('research-publications');
                    }}
                  >
                    Research&nbsp;Publications
                  </h3>
                  </>
                )}

                <h3
                  ref={courseRef}
                  className={activeTable === 'course' ? 'active-tab' : ''}
                  onClick={() => {
                    fetchDepartmentCourses();
                    setActiveTable('course');
                  }}
                >
                  Course
                </h3>
                <div
                  className="tab-indicator"
                  style={indicatorStyle}
                />
              </div>
            </div>
          </>}
        </div>

        {activeTable === 'users' && (
          tableLoading ? <ShimmerTable row={5} col={3} /> : <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Fullname</th>
                    <th>Course</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentUsers.length > 0 ? (
                    departmentUsers.map((depU) => {
                      return (
                        <tr key={depU.id}>
                          <td>
                            {depU.lastname},&nbsp;
                            {depU.firstname}&nbsp;
                            {depU.middlename ? depU.middlename + "." : ""}&nbsp;
                            {depU.extension ? depU.extension.toUpperCase() : ""}
                          </td>

                          <td>
                            {depU.course_abb ? depU.course_abb : "N/A"}
                          </td>

                          <td>
                            <button onClick={() => navigate(`/user/users/${depU.id}`)}>
                              <span className="material-symbols-outlined view-icon">visibility</span>
                              <span className="tooltip">View User</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3}>No users in this department...</td>
                    </tr>
                  )}
                  
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {activeTable === 'student-paper' && (
          tableLoading ? <ShimmerTable row={5} col={7}/> : <>
            <div className="table-container">
              <table>
                <thead>
                  <tr className="esp-tr">
                    <th>Title Thesis</th>
                    <th>Researchers</th>
                    <th>Adviser</th>
                    <th>Academic&nbsp;Year<br/>Sem&nbsp;and&nbsp;SY</th>
                    <th>SDG Label</th>
                    <th>Course</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentStudentPapers.length > 0 ? (
                    departmentStudentPapers.map((paper) => {
                      const color = getSdgColor(paper.sdg_number);

                      return (
                        <tr key={paper.research_id} style={{ borderLeft: `8px solid ${color}` }}>
                          <td>
                            {paper.research_title}
                          </td>

                          <td>
                            {Array.isArray(paper.researchers)
                              ? paper.researchers.map((name, index) => (
                                  <div key={index} style={{margin: '8px 0', textAlign: 'left'}}>{name}</div>
                                ))
                              : <div style={{textAlign: 'left'}}>{paper.researchers}</div>}
                          </td>

                          <td>
                            {paper.adviser}
                          </td> 

                          <td>
                            {paper.semester}  {paper.academic_year}-{paper.academic_year + 1}
                          </td>

                          <td style={{color: color, fontWeight: '500'}}>
                            {Array.isArray(paper.sdg_labels) 
                            ? paper.sdg_labels.map((label, index) => (
                              <div key={index} style={{margin: '8px 0', textAlign: 'left'}}>{label}</div>
                              ))
                            : <div style={{textAlign: 'left'}}>{paper.sdg_labels}</div>}
                          </td>

                          <td>
                            {paper.course_abb}
                          </td>

                          <td>
                            <button onClick={() => navigate(`/user/department/${dep_id}/paper/${paper.research_id}`)}>
                              <span className="material-symbols-outlined view-icon">visibility</span>
                              <span className="tooltip">View Paper</span>
                            </button>
                            <button onClick={() => handleDeletePaper(paper.research_id)}>
                              <span className="material-symbols-outlined delete-icon">delete</span>
                              <span className="tooltip">Delete Paper</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7">No papers found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTable === 'faculty-paper' && (
          tableLoading ? <ShimmerTable row={5} col={6}/> : <>
            <div className="table-container">
              <table>
                <thead>
                  <tr className="esp-tr">
                    <th>Title of Research</th>
                    <th>Name&nbsp;of&nbsp;Researcher/s</th>
                    <th>Funding&nbsp;Source<br/>(if any)</th>
                    <th>Academic&nbsp;Year<br/>Sem&nbsp;and&nbsp;SY</th>
                    <th>SDG Label</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentFacultyPapers.length > 0 ? (
                    departmentFacultyPapers.map((paper) => {
                      const color = getSdgColor(paper.sdg_number);

                      return (
                        <tr key={paper.research_id} style={{ borderLeft: `8px solid ${color}` }}>
                          <td>
                            {paper.research_title}
                          </td>

                          <td>
                            {Array.isArray(paper.researchers)
                              ? paper.researchers.map((name, index) => (
                                  <div key={index} style={{margin: '8px 0', textAlign: 'left'}}>{name}</div>
                                ))
                              : <div style={{textAlign: 'left'}}>{paper.researchers}</div>}
                          </td>

                          <td>
                            {
                              paper.funding_source === 'self-funded' 
                              ? 'Self-Funded' : paper.funding_source === 'earist' 
                              ? 'EARIST' 
                              : 'N/A'
                            }
                          </td> 
                          
                          <td>
                            {paper.semester}  {paper.academic_year}-{paper.academic_year + 1}
                          </td>

                          <td style={{color: color, fontWeight: '500'}}>
                            {Array.isArray(paper.sdg_labels) 
                            ? paper.sdg_labels.map((label, index) => (
                              <div key={index} style={{margin: '8px 0', textAlign: 'left'}}>{label}</div>
                              ))
                            : <div style={{textAlign: 'left'}}>{paper.sdg_labels}</div>}
                          </td>

                          <td>
                            <button onClick={() => navigate(`/user/department/${dep_id}/paper/${paper.research_id}`)}>
                              <span className="material-symbols-outlined view-icon">visibility</span>
                              <span className="tooltip">View Paper</span>
                            </button>
                            <button onClick={() => handleDeletePaper(paper.research_id)}>
                              <span className="material-symbols-outlined delete-icon">delete</span>
                              <span className="tooltip">Delete Paper</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7">No papers found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTable === 'research-presentation' && (
          tableLoading ? <ShimmerTable row={5} col={13}/> : <>
            <div>
              <div className="table-container" id="printable-table"
                style={{
                  overflowX: 'auto'
                }}>

                <table>
                  <thead className="hid-default">
                    <tr>
                      <th colSpan={3} style={{textAlign: 'left', border: 'none', padding: '15px 10px', fontSize: '1em', fontWeight: 'bold', textTransform: 'uppercase'}}>FACULTY RESEARCH ENGAGEMENT<br/></th>
                      <th colSpan={8} style={{textAlign: 'center', border: 'none', padding: '15px 10px', fontSize: '1em', fontWeight: 'bold', textTransform: 'uppercase'}}>RESEARCH PAPER PRESENTATION<br/></th>
                      <th colSpan={3} style={{textAlign: 'right', border: 'none', padding: '15px 10px', fontSize: '1em', fontWeight: 'bold'}}>{new Date().getFullYear()}</th>
                      <th style={{display: 'none'}}></th>
                    </tr>

                    <tr className="esp-tr" style={{borderLeft: '2px solid #1E4A40'}}>
                      <th style={{backgroundColor: '#1E4A40', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'left', fontFamily: 'Arial, Helvetica, sans-serif'}}>Department</th>
                      <th style={{backgroundColor: '#1E4A40', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'left', fontFamily: 'Arial, Helvetica, sans-serif'}}>Author</th>
                      <th style={{backgroundColor: '#1E4A40', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'left', fontFamily: 'Arial, Helvetica, sans-serif'}}>Co-author</th>
                      <th style={{backgroundColor: '#1E4A40', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'left', fontFamily: 'Arial, Helvetica, sans-serif'}}>Title of Research Paper</th>
                      <th style={{backgroundColor: '#1E4A40', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'left', fontFamily: 'Arial, Helvetica, sans-serif'}}>SDG Alignment</th>
                      <th style={{backgroundColor: '#1E4A40', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'left', fontFamily: 'Arial, Helvetica, sans-serif'}}>Conference Title</th>
                      <th style={{backgroundColor: '#1E4A40', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'left', fontFamily: 'Arial, Helvetica, sans-serif'}}>Organizer</th>
                      <th style={{backgroundColor: '#1E4A40', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'left', fontFamily: 'Arial, Helvetica, sans-serif'}}>Venue</th>
                      <th style={{backgroundColor: '#1E4A40', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'left', fontFamily: 'Arial, Helvetica, sans-serif'}}>Date Presented</th>
                      <th style={{backgroundColor: '#1E4A40', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'left', fontFamily: 'Arial, Helvetica, sans-serif'}}>Type of Conference</th>
                      <th style={{backgroundColor: '#1E4A40', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'left', fontFamily: 'Arial, Helvetica, sans-serif'}}>Special Order No.</th>
                      <th style={{backgroundColor: '#1E4A40', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'left', fontFamily: 'Arial, Helvetica, sans-serif'}}>Status</th>
                      <th style={{backgroundColor: '#1E4A40', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'left', fontFamily: 'Arial, Helvetica, sans-serif'}}>Funding Source</th>
                      <th style={{backgroundColor: '#1E4A40', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', fontFamily: 'Arial, Helvetica, sans-serif'}} className="action-column">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {departmentResearchPresentation.length > 0 ? (
                      departmentResearchPresentation.map(item => {
                        const isSelfFunded = item.funding_source_engage?.toLowerCase() === "self funded";

                        return (
                          <tr key={item.id} className={isSelfFunded ? "self-funded" : ""} style={{borderLeft: '2px solid #1e293b'}}>
                            <td style={{textAlign: 'center', padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>{item.department_abb || department[0]?.department_abb || 'N/A'}</td>
                            <td style={{padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>{item.author}</td>
                            <td style={{padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>
                              {Array.isArray(item.co_authors) && item.co_authors.length > 0
                                ? item.co_authors.filter(co => co && co.trim()).map((co, idx) => <div key={idx} style={{marginBottom: '4px'}}>{co}</div>)
                                : item.co_authors || 'N/A'}
                            </td>
                            <td style={{padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>{item.research_title}</td>
                            <td style={{padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>
                              {Array.isArray(item.sdg_alignment) && item.sdg_alignment.length > 0
                                ? item.sdg_alignment.map((sdg, i) => (
                                    <div key={i} style={{marginBottom: '4px'}}>{sdg}</div>
                                  ))
                                : item.sdg_alignment || 'N/A'}
                            </td>
                            <td style={{padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>{item.conference_title}</td>
                            <td style={{padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>{item.organizer}</td>
                            <td style={{padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>{item.venue}</td>
                            <td style={{padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>{formatDateRange(item.date_presented, item.end_date_presented)}</td>
                            <td style={{padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>{item.conference_category}</td>
                            <td style={{padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>{item.special_order_no || "N/A"}</td>
                            <td style={{padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>{item.status_engage}</td>
                            <td style={{padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>{item.funding_source_engage}</td>
                          <td className="action-column" style={{padding: '8px 6px', border: '1px solid #000'}}>
                            <button
                              onClick={() => handleDeletePresentation(item.id)}
                              className="delete-btn"
                            >
                              <span className="material-symbols-outlined delete-icon">delete</span>
                              <span className="tooltip">Delete Presentation</span>
                            </button>
                          </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={15}>No research presentation records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table> 
                <div className="print-footer-left">
                  PREPARED BY: {userData ? `${userData.firstname} ${userData.lastname}` : ""}
                </div>
                <div className="print-footer-center">
                  {department[0]?.department_name}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTable === "research-publications" && (
          tableLoading ? <ShimmerTable row={5} col={13}/> : <>
            <div>
              <div className={`form-container ${showAddPublicationForm ? "slide-down" : "slide-up"}`}>
                <div className="add-form-container">
                  <h3>Add Research Publication</h3>

                  <form onSubmit={handleAddPublication} className="form">

                    <div className="form-input">
                      <input
                        type="text"
                        placeholder="Published Title"
                        value={published_title}
                        onChange={(e) => setPubTitle(e.target.value)}
                        required
                      />
                      <label>Published Title</label>
                    </div>

                    <div className="grouped-inputs">
                      <div className="form-input">
                        <input
                          type="text"
                          placeholder="Author Name"
                          value={pub_author}
                          onChange={(e) => setPubAuthor(e.target.value)}
                          required
                        />
                        <label>Author</label>
                      </div>
                    </div>

                    <div className="form-input">
                      <button type="button" onClick={addPubCoAuthor} className="add-coauthor-btn">+</button>

                      {pub_co_authors.map((pub_co_authors, index) => (
                        <div key={index} className="coauthor-row">
                          <input
                            type="text"
                            value={pub_co_authors}
                            onChange={(e) => updatePubCoAuthor(e.target.value, index)}
                            placeholder={`Co-author ${index + 1}`}
                            style={{ width: "80%", margin: "5px 0" }}
                          />

                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => removePubCoAuthor(index)}
                              style={{ height: "25px", padding: "0" }}
                            >
                              <span className="material-symbols-outlined">remove</span>
                            </button>
                          )}
                        </div>
                      ))}

                      <label>Co-Authors</label>
                    </div>
                    

                    <div className="form-input">
                      <input
                        type="text"
                        placeholder="Journal / Publication Title"
                        value={journal_title}
                        onChange={(e) => setPubJournal(e.target.value)}
                        required
                      />
                      <label>Title of Journal / Publication</label>
                    </div>

                    <div className="form-input">
                      <input
                        type="text"
                        placeholder="Conference / Proceedings"
                        value={ conference_or_proceedings}
                        onChange={(e) => setPubConference(e.target.value)}
                        required
                      />
                      <label>Conference / Proceedings</label>
                    </div>

                    <div className="form-input">
                      <input
                        type="text"
                        placeholder="Publisher"
                        value={ publisher}
                        onChange={(e) => setPubPublisher(e.target.value)}
                        required
                      />
                      <label>Publisher</label>
                    </div>

                    <div className="form-input">
                      <input 
                        name="s-date" 
                        type="date" 
                        value={pubDatePresented}
                        onChange={(e) => setPubDatePresented(e.target.value)}
                        required/>
                      <label htmlFor="s-date">Start Date</label>
                    </div>
                    <div className="form-input">
                      <input 
                        name="e-date" 
                        type="date" 
                        value={pubEndDatePresented}
                        onChange={(e) => setPubEndDatePresented(e.target.value)}
                        required/>
                      <label htmlFor="e-date">End Date</label>
                    </div>

                    <div className="form-input">
                      <input
                        type="text"
                        placeholder="DOI"
                        value={doi}
                        onChange={(e) => setPubDOI(e.target.value)}
                        required
                      />
                      <label>DOI</label>
                    </div>

                    <div className="form-input">
                      <input
                        type="text"
                        placeholder="ISSN / ISBN"
                        value={ issn_isbn}
                        onChange={(e) => setPubISSN(e.target.value)}
                      />
                      <label>ISSN / ISBN</label>
                    </div>

                    <div className="form-input">
                      <input
                        type="text"
                        placeholder="Volume & Issue No."
                        value={volume_issue}
                        onChange={(e) => setPubVolumeIssue(e.target.value)}
                        required
                      />
                      <label>Volume & Issue No.</label>
                    </div>

                    <div className="form-input">
                      <input
                        type="text"
                        placeholder="Index Type"
                        value={index_type}
                        onChange={(e) => setPubIndex(e.target.value)}
                        required
                      />
                      <label>Index</label>
                    </div>

                    <div className="form-group">
                      <button type="submit" className="submit-btn">Submit</button>
                    </div>
                  </form>
                </div>
              </div>

              {/* TABLE BELOW FORM */}
              <div 
                className="table-container"
                id="printable-table"
                style={{ overflowX: "auto" }}
              >
                      <table>
                  <thead className="hid-default">
                    <tr>
                      <th colSpan={3} style={{ textAlign: "left", border: 'none', padding: '15px 10px', fontSize: '1em', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        FACULTY RESEARCH ENGAGEMENT<br />
                      </th>
                      <th colSpan={7} style={{ textAlign: "center", border: 'none', padding: '15px 10px', fontSize: '1em', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        RESEARCH PUBLICATIONS<br />
                      </th>
                      <th colSpan={3} style={{ textAlign: "right", border: '1px solid black', padding: '15px 10px', fontSize: '1em', fontWeight: 'bold' }}>
                        {new Date().getFullYear()}
                      </th>
                      <th style={{display: 'none'}}></th>
                    </tr>

                    <tr className="esp-tr" style={{backgroundColor: '#000f3f'}}>
                      <th style={{backgroundColor: '#000f3f', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'center', fontFamily: 'Arial, Helvetica, sans-serif'}}>#</th>
                      <th style={{backgroundColor: '#000f3f', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'center', fontFamily: 'Arial, Helvetica, sans-serif'}}>Published Title</th>
                      <th style={{backgroundColor: '#000f3f', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'center', fontFamily: 'Arial, Helvetica, sans-serif'}}>Author</th>
                      <th style={{backgroundColor: '#000f3f', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'center', fontFamily: 'Arial, Helvetica, sans-serif'}}>Co-author</th>
                      <th style={{backgroundColor: '#000f3f', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'center', fontFamily: 'Arial, Helvetica, sans-serif'}}>Title of Journal / Publication</th>
                      <th style={{backgroundColor: '#000f3f', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'center', fontFamily: 'Arial, Helvetica, sans-serif'}}>Conference / Proceedings</th>
                      <th style={{backgroundColor: '#000f3f', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'center', fontFamily: 'Arial, Helvetica, sans-serif'}}>Publisher</th>
                      <th style={{backgroundColor: '#000f3f', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'center', fontFamily: 'Arial, Helvetica, sans-serif'}}>Date of Publication</th>
                      <th style={{backgroundColor: '#000f3f', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'center', fontFamily: 'Arial, Helvetica, sans-serif'}}>DOI</th>
                      <th style={{backgroundColor: '#000f3f', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'center', fontFamily: 'Arial, Helvetica, sans-serif'}}>ISSN / ISBN</th>
                      <th style={{backgroundColor: '#000f3f', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'center', fontFamily: 'Arial, Helvetica, sans-serif'}}>Volume & Issue No.</th>
                      <th style={{backgroundColor: '#000f3f', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', textAlign: 'center', fontFamily: 'Arial, Helvetica, sans-serif'}}>Index</th>
                      <th style={{backgroundColor: '#000f3f', color: 'white', padding: '10px 6px', fontSize: '0.9em', fontWeight: '600', fontFamily: 'Arial, Helvetica, sans-serif'}} className="action-column">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {departmentResearchPublications.length > 0 ? (
                      departmentResearchPublications.map((item, index) => (
                        <tr key={item.id}>
                          <td style={{textAlign: 'center', padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>{index + 1}</td>
                          <td style={{padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>{item.published_title}</td>
                          <td style={{padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>{item.pub_author}</td>
                          <td style={{padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>
                              {Array.isArray(item.pub_co_authors) && item.pub_co_authors.length > 0
                                ? item.pub_co_authors.filter(co => co && co.trim()).map((co, idx) => <div key={idx} style={{marginBottom: '4px'}}>{co}</div>)
                                : item.pub_co_authors || 'N/A'}
                            </td>
                          <td style={{padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>{item.journal_title}</td>
                          <td style={{padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>{item.conference_or_proceedings || "N/A"}</td>
                          <td style={{padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>{item.publisher}</td>
                          <td style={{padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>{item.pub_date_presented ? formatDateRange(item.pub_date_presented, item.pub_end_date_presented): "N/A"}</td>
                          <td style={{padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>{item.doi || "N/A"}</td>
                          <td style={{padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>{item.issn_isbn}</td>
                          <td style={{padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>{item.volume_issue || "N/A"}</td>
                          <td style={{padding: '8px 6px', fontSize: '0.85em', border: '1px solid #000', verticalAlign: 'top', fontFamily: 'Arial, Helvetica, sans-serif'}}>{item.index_type}</td>
                          <td className="action-column" style={{padding: '8px 6px', border: '1px solid #000'}}>
                            <button
                              onClick={() => handleDeletePublication(item.id)}
                              className="delete-btn"
                              >
                              <span className="material-symbols-outlined delete-icon">delete</span>
                              <span className="tooltip">Delete Publication</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="15">No research publication records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="print-footer-left">
                  PREPARED BY: {userData ? `${userData.firstname} ${userData.lastname}` : ""}
                </div>
                <div className="print-footer-center">
                  {department[0]?.department_name}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTable === 'course' && (
          tableLoading ? <ShimmerTable row={5} col={4}/> : <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Course&nbsp;ID</th>
                    <th>Course&nbsp;Name</th>
                    <th>Course&nbsp;Abbreviation</th>
                    {userData?.role === 'admin' && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {departmentCourse.length > 0 ? (
                    departmentCourse.map((course) => {

                      return (
                        <tr key={course.course_id}>
                          <td>{course.course_id}</td>
                          <td>{course.course_name}</td>
                          <td>{course.course_abb}</td>
                          {userData?.role === 'admin' && (
                            <td>
                              <button onClick={() => handleDeleteCourse(course.course_id)}>
                                <span className="material-symbols-outlined delete-icon">delete</span>
                                <span className="tooltip">Delete Course</span>
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7">No papers found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        show={modalConfig.show}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        confirmText={modalConfig.confirmText}
        onCancel={closeModal}
        />

      <div className="toast-box" id="toast-box"></div>
    </>
  );
};

export default Department;