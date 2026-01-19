import React, { useState, useEffect } from 'react';
import { showToast } from '../utils/toast';
import { useNavigate, useParams } from 'react-router-dom';
import ConfirmModal from '../utils/ConfirmModal';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import earistLogo from '../assets/earist_logo.png';
import ccsLogo from '../assets/ccs-logo.png';
import Loading from '../utils/Loading';
import '../styles/style.css';
import '../styles/ai-report.css';
import RatingModal from '../utils/RatingModal';
import AIReportPrint from '../utils/print/AIReportPrint';


const AIReport = () => {
  const {dep_id} = useParams();
  const [loading, setLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
  });
  const [userData, setUserData] = useState({});
  const [department, setDepartment] = useState({});
  const [studentPapers, setStudentPapers] = useState([]);
  const [facultyPapers, setFacultyPapers] = useState([]);
  const [commonSDG, setCommonSDG] = useState([]);
	const [selectYear, setSelectYear] = useState(false);
	const [currentYear, setCurrentYear] = useState(false);
	const [year, setYear] = useState('');
  const [endorsedBy, setEndorsedBy] = useState('');
	const [aiResult, setAIResult] = useState({ aiText: "" });
	const year_now = new Date().getFullYear();
	const years = Array.from({ length: 8 }, (_, i) =>  year_now-1  - i);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [model_used, setModelUsed] = useState('');

  const API_URL = import.meta.env.VITE_API_URL;


  // console.log('Department ID from URL:', dep_id);


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
    setModalConfig(prev => ({...prev, show: false}));
  }



  // GET USER DATA
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



  // GET DEPARTMENT INFO
  const fetchDepartment = () => {
    axios.get(`${API_URL}/api/users/department/info`, {
      params: { department_id: dep_id },
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      // console.log('Department fetched:', res.data);
      setDepartment(Array.isArray(res.data) ? res.data[0] : res.data);
    }).catch(err => {
      console.error('Error fetching department', err);
    });
  };



  // GET STUDENT PAPER BASED ON YEAR AND DEPARTMENT
  const getStudentPaper = async () => {
    const selectedYear = getSelectedYear();

    try {
      const response = await axios.get(`${API_URL}/api/users/research-type/student`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { year: selectedYear, dep_id: dep_id }
      });
      
      if (response.data && Object.keys(response.data).length > 0) {
        // console.log('Student Papers fetched', response.data);
      } else {
        console.log('No Student Papers found');
      }

      setStudentPapers(response.data);
      return response.data; // important if you want to use this later

    } catch (err) {
      console.error('Failed to fetch papers', err);
      return []; // return empty array on error to keep flow safe
    }
  };


  //I CHANGE HERE 18/11/2025
  // GET FACULTY PAPER BASED ON YEAR AND DEPARTMENT
  const getFacultyPaper = async () => {
    const selectedYear = getSelectedYear();

    try {
      const response = await axios.get(`${API_URL}/api/users/research-type/faculty`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { dep_id: dep_id, year: selectedYear }
      });

      setFacultyPapers(response.data);
      // console.log('Faculty Papers fetched:', response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch faculty papers', err);
      return [];
    }
  };




  //GET COMMON SDG
  const getMostCommonSDG = async () => {
    const selectedYear = getSelectedYear();

    try {
      const response = await axios.get(`${API_URL}/api/users/research/commonSDG`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { dep_id: dep_id, year: selectedYear },
      });

      if (response.data?.data?.length > 0) {
        setCommonSDG(response.data.data);
        return response.data.data; // important if you want to use this later
      } else {
        setCommonSDG([]);
        console.log("No SDG data found for this department.");
        return []; // return empty array if no data
      }

    } catch (err) {
      console.error("Error fetching top SDGs:", err);
      return []; // eturn empty array on error
    }
  };



  useEffect(() => {
    // getDepartment();
    fetchUserData();
    fetchDepartment();
    // getStudentPaper();
    // getFacultyPaper();
    // getMostCommonSDG();
  }, []);



  // AUDIT LOG WHEN USER TRIED TO PRINT
  useEffect(() => {
    let hasLoggedPrint = false; // Switch to prevent multiple logsh uheuheueh

    const handlePrint = () => {
      if (hasLoggedPrint) return; // prevent multiple logs
      if (!userData || !token) return;
      hasLoggedPrint = true;
    };

    const mediaQueryList = window.matchMedia('print');
    const handleMediaChange = (e) => {
      if (!e.matches) handlePrint(); // after print
    };
    mediaQueryList.addEventListener('change', handleMediaChange);
  }, [userData, token]);



  // Colors for SDGs
  const sdgColors = [
    "#e5233d", "#dda73a", "#4ca146", "#c7212f",
    "#ef402d", "#27bfe6", "#fbc412", "#fbc412",
    "#f26a2e", "#e01483", "#f89d2a", "#bf8d2c",
    "#407f46", "#1f97d4", "#59ba47", "#136a9f",
    "#14496b"
  ];



	const getSelectedYear = () => (currentYear ? new Date().getFullYear() : year);



  // Analyze SDG using GEMINI AI
	const analyzeSDG = async () => {
    const selectedYear = currentYear ? year_now : selectYear ? year : null;
		if (!selectedYear || selectYear == '--') {
			showToast("warning", "Form", "Please select a year.");
			return;
		}

    if (!endorsedBy) {
			showToast("warning", "Form", "Please input an endorser");
			return;
		}

    showModal(
      'Generating Report',
      <>
        Generating Report<br/><br/>
        Academic Year: <strong>{currentYear 
          ? year_now
          : year}</strong><br/>
        Department: <strong>{department.department_name}</strong><br/>
        Endorsed By: <strong>{endorsedBy}</strong>
      </>,
      async () => {
        try {
          setLoading(true);

          // fetch all three in parallel:
          const [studentPapers, facultyPapers, sdgCommon] = await Promise.all([
            getStudentPaper(),
            getFacultyPaper(),
            getMostCommonSDG()
          ]);
          // console.log('Selected Year for Analysis:', selectedYear);
          // console.log({ studentPapers, facultyPapers, sdgCommon });



          const payload = {
            year: getSelectedYear(),
            depId: dep_id,
          };

          // //Fetch Papers
          // console.log("Fetching papers with payload:", payload);

          const response = await axios.get(`${API_URL}/api/users/analysis-papers`, {
            headers: { Authorization: `Bearer ${token}` },
            params: payload,
          });

          const paperData = response.data;
          // console.log(paperData);


          if (paperData.message === 'No research paper found for the selected year and department.') {
            showToast("warning", "AI Analysis", "No papers found for the selected year.");
            setLoading(false);
            return;
          }

          // 2️⃣ Create metadata
          const created_time_iso = new Date().toISOString();
          const created_time_formatted = new Date(created_time_iso).toLocaleDateString(
            "en-US",
            { year: "numeric", month: "long", day: "numeric" }
          );

          // additional metadata
          const metaData = {
            created_by:
              userData.lastname +
              ", " +
              userData.firstname +  
              (userData.middlename ? " " + userData.middlename.charAt(0) + "." : "") +
              (userData.extension ? " " + userData.extension : ""),
            created_time: created_time_formatted,
          };

          const paperMeta = {
            ...paperData,
            ...metaData,
            departments: Array.isArray(paperData.department) ? paperData.department : [paperData.department],
          };

          // console.log('Fetched Papers', paperData);


          //Send the fetched papers to AI
          const aiResponse = await axios.post(`${API_URL}/api/ai/ai-report`, 
            { sdgData: paperMeta},
            { headers: { Authorization: `Bearer ${token}` } }
          );

          // Example: your AI result
          const aiText = aiResponse.data.analysis || "";
          const modelUsed = aiResponse.data.model_used || "unknown_model";

          setModelUsed(modelUsed);

          // console.log('Model used for analysis:', modelUsed);
          // console.log(aiText);
          
          //Split
          const [lackSection, recommendationSection] = aiText.split("===SPLIT===");

          const cleanText = (text) => {
            const indentSpaces = '&nbsp;&nbsp;&nbsp;';

            const cleaned = text
              // Normalize newlines
              .replace(/\r\n/g, '\n')

              // STEP 1: Bold numbered titles (e.g., "1. Something" → "**1. Something**")
              .replace(/^(\d+\..*?)$/gm, '**$1**')

              // STEP 2: Ensure exactly one blank line after each numbered title
              .replace(/(\*\*\d+\..*?\*\*)\n(?!\n)/g, '$1\n')

              // STEP 3: Normalize main bullets ("•") to Markdown-style
              .replace(/^\s*•\s*/gm, '- ')

              // STEP 4: Normalize nested bullets ("▪") to Markdown nested list
              .replace(/^\s*▪\s*/gm, '  - ')

              // STEP 6: Format SPLIT marker cleanly with blank lines around it
              .replace(/\n*===SPLIT===\n*/g, '===SPLIT===')
              
              // STEP 7: Trim excess whitespace at start/end
              .trim();

            return cleaned;
          };


          setAIResult({
            aiText: aiText.trim(),
            lackSection: cleanText(lackSection),
            recommendationSection: cleanText(recommendationSection),
          });
        }catch(err) {
          console.error('Failed to fetch or analyze papers:', err);
          showToast('error', 'AI', 'Something went wrong!');
        }finally {
          closeModal();
          setLoading(false);
        }
      },
      'Generate Report'
    );
  };

  const handleSaveReport = async (selectedRating) => {
    try {
      const created_by = `${userData.lastname}, ${userData.firstname}`;

      // Flatten student papers
      const allStudentPapers = Object.values(studentPapers || {}).flat();
      const student_papers = allStudentPapers.length > 0
        ? allStudentPapers.map(p => 
            `Title: ${p.research_title || 'N/A'}
            Abstract: ${p.research_abstract || 'N/A'}
            Conclusion: ${p.research_conclusion || 'N/A'}
            Semester: ${p.semester || 'N/A'}`
          ).join('\n\n')
        : 'No student papers available';

      // Flatten faculty papers
      const allFacultyPapers = Object.values(facultyPapers || {}).flat();
      const faculty_papers = allFacultyPapers.length > 0
        ? allFacultyPapers.map(p =>
            `Title: ${p.research_title || 'N/A'}
            Abstract: ${p.research_abstract || 'N/A'}
            Conclusion: ${p.research_conclusion || 'N/A'}
            Funding Source: ${p.funding_source === 'earist' ? 'EARIST' : p.funding_source === 'self-funded' ? 'Self-Funded' : 'N/A'}
            Semester: ${p.semester || 'N/A'}`
          ).join('\n\n')
        : 'No faculty papers available';

      // console.log('faculty papers:', faculty_papers);
      // console.log('student papers:', student_papers);

      const payload = {
        academic_year: getSelectedYear(),
        department: department.department_name,
        created_by,
        student_papers,
        faculty_papers,
        sdg_summary: commonSDG,
        recommendations: aiResult.recommendationSection || "",
        gemini_output: aiResult.aiText || "",
        model_used: model_used || "unknown_model",
        feedback_rating: selectedRating,
      };

      await axios.post(`${API_URL}/api/ai/save-report`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      showToast('success', 'Report Saved', 'Your feedback has been saved.');
    } catch (err) {
      console.error('Failed to save report:', err);
      showToast('error', 'Save Failed', 'Something went wrong while saving.');
    }
  };

  function formatAiOutputForCSV(text) {
    // Split into lines
    const lines = text.split("\n");

    return lines.map(line => {
      // Trim whitespace
      const trimmed = line.trim();

      // If it's a heading with **, strip them and put in a new cell
      if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
        const heading = trimmed.replace(/\*\*/g, "");
        return `"${heading}",""`; // heading in first cell, empty second cell
      }

      // If it's a bullet line, just put it in the next cell
      if (trimmed.startsWith("-")) {
        const bullet = trimmed.replace(/^-+\s*/, "");
        return `"","${bullet}"`; // empty first cell, bullet in second cell
      }

      // Otherwise, return as a single-cell row
      return `"${trimmed}"`;
    }).join("\n");
  }


  // Export Report as CSV
  const handleExportCSV = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Header Information
      csvContent += `"SDG Analysis Report - ${department.department_name}"\n`;
      csvContent += `"Academic Year","${getSelectedYear()}"\n`;
      csvContent += `"Created By","${userData.lastname}, ${userData.firstname}"\n`;
      csvContent += `"Created Date","${new Date().toLocaleDateString()}"\n`;
      csvContent += `"Endorsed By","${endorsedBy}"\n\n`;

      // Student Thesis Section
      csvContent += `"STUDENT THESIS ALIGNMENT WITH SDGs"\n`;
      csvContent += `"Number","Title","Students","Adviser","Academic Year","SDG Number","SDG Title","Status"\n`;
      
      Object.entries(studentPapers || {}).forEach(([course, papers]) => {
        papers.forEach((paper, index) => {
          const researchers = Array.isArray(paper.researchers) ? paper.researchers.join("; ") : paper.researchers;
          const sdgNumbers = Array.isArray(paper.sdg_number) ? paper.sdg_number.join("; ") : paper.sdg_number;
          const sdgLabels = Array.isArray(paper.sdg_labels) ? paper.sdg_labels.join("; ") : paper.sdg_labels;
          
          csvContent += `"${index + 1}","${paper.research_title}","${researchers}","${paper.adviser}","${paper.semester} ${paper.academic_year}-${paper.academic_year + 1}","${sdgNumbers}","${sdgLabels}","${paper.status}"\n`;
        });
      });
      
      csvContent += `\n"FACULTY RESEARCH ALIGNMENT WITH SDGs"\n`;
      csvContent += `"Number","Title","Researcher/s","Funding Source","Academic Year","SDG Number","SDG Title","Status"\n`;
      
      Object.entries(facultyPapers || {}).forEach(([course, papers]) => {
        papers.forEach((paper, index) => {
          const researchers = Array.isArray(paper.researchers) ? paper.researchers.join("; ") : paper.researchers;
          const sdgNumbers = Array.isArray(paper.sdg_number) ? paper.sdg_number.join("; ") : paper.sdg_number;
          const sdgLabels = Array.isArray(paper.sdg_labels) ? paper.sdg_labels.join("; ") : paper.sdg_labels;
          const fundingSource = paper.funding_source === 'earist' ? 'EARIST' : paper.funding_source === 'self-funded' ? 'Self-Funded' : 'N/A';
          
          csvContent += `"${index + 1}","${paper.research_title}","${researchers}","${fundingSource}","${paper.semester} ${paper.academic_year}-${paper.academic_year + 1}","${sdgNumbers}","${sdgLabels}","${paper.status}"\n`;
        });
      });

      // Summary and Analysis
      csvContent += `\n"SUMMARY AND ANALYSIS"\n`;
      csvContent += `"Total Student Theses","${Object.values(studentPapers).reduce((sum, papers) => sum + papers.length, 0)}"\n`;
      csvContent += `"Total Faculty Research","${Object.values(facultyPapers).reduce((sum, papers) => sum + papers.length, 0)}"\n`;
      csvContent += `"Most Common SDGs","${commonSDG.length > 0 ? commonSDG.map(item => item.sdg).join("; ") : "No data"}"\n`;
      csvContent += `\n"GAPS AND AREAS FOR IMPROVEMENT"\n`;
      if (aiResult.lackSection) {
        csvContent += formatAiOutputForCSV(aiResult.lackSection) + "\n";
      }

      csvContent += `\n"RECOMMENDATIONS"\n`;
      if (aiResult.lackSection) {
        csvContent += formatAiOutputForCSV(aiResult.recommendationSection) + "\n";
      }


      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `SDG_Report_${department.department_abb}_${getSelectedYear()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('success', 'Export Successful', 'Report exported as CSV.');
    } catch (err) {
      console.error('Failed to export CSV:', err);
      showToast('error', 'Export Failed', 'Could not export report as CSV.');
    }
  };


  // FOR ROMAN STUFF
  const toRoman = (num) => {
    const romans = [
      ["M",1000],["CM",900],["D",500],["CD",400],
      ["C",100],["XC",90],["L",50],["XL",40],
      ["X",10],["IX",9],["V",5],["IV",4],["I",1]
    ];
    let result = "";
    for (const [letter, value] of romans) {
      while (num >= value) {
        result += letter;
        num -= value;
      }
    }
    return result.toUpperCase();
  };

  let sectionCounter = 1


  return (
    <>
      {loading && <Loading text="Analyzing papers, please wait..." />}
      <div className='hyperlink' onClick={() => navigate(-1)}><p>Go Back</p></div>
      <div className="report-container">
        <h1 className='h1'>SDG Analysis Report in <span style={{color: '#C83F12'}}>{department.department_name}</span></h1>
        <div className='line'></div>
        <form onSubmit={(e) => {
          e.preventDefault();
          analyzeSDG();
        }}>
          <div className='report-form'>
            <div className='report-form-selection'>
              <div className='rfs'>
                {/* YEAR */}
                <h3>Select Academic Year: </h3>
                <div>
                  <input
                    type="radio"
                    id="curr-year"
                    name="year-option"
                    checked={currentYear}
                    onChange={() => {
                      setCurrentYear(true);
                      setSelectYear(false);
                    }}
                  />
                  <label htmlFor="curr-year">Current Year</label>
                </div>
                
                <div>
                  <input
                    type="radio"
                    id="pick-year"
                    name="year-option"
                    checked={selectYear}
                    onChange={() => {
                      setSelectYear(true);
                      setCurrentYear(false);
                    }}
                  />
                  <label htmlFor="pick-year">Select a Year</label>
                </div>
                
                <select value={year} onChange={(e) => setYear(e.target.value)} disabled={!selectYear}>
                  <option value="">--</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className='rfs'>
                <h3>Endorsed By:</h3>
                <input type='text' placeholder='Firstname M.I. Lastname' value={endorsedBy} onChange={(e) => setEndorsedBy(e.target.value)}/>
              </div>

            </div>
            <div className='report-form-selected'>
              <div className='rf-content'>
                <div className='label'>
                  <p>Selected Year: </p>
                  <p>Selected Departments</p>
                </div>
                <div className='output'>
                  <p>{currentYear ? year_now : selectYear ? year : "None"}</p>
                  <p>{department?.department_abb}</p>
                </div>
              </div>
              <button type="submit">Analyze Now</button>
            </div>
          </div>
        </form>
      </div>



        {/* {aiResult.aiText && ( */}
          <div className='report-container' id='report-container'>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              margin: '48px 0',
              flexWrap: 'wrap'
            }}>
              <button type="button" className="ai-rep-but" disabled={aiResult.aiText === ''} onClick={() => AIReportPrint(showModal, closeModal)} style={{margin: 0}}>Print Report</button>
              <button type="button" className="ai-rep-but" disabled={aiResult.aiText === ''} onClick={handleExportCSV} style={{margin: 0}}>Export as CSV</button>
              {/* <button type="button" className="ai-rep-but" onClick={handleSaveReport} style={{margin: 0}}>Save Report</button> */}
            </div>

            <RatingModal
              show={showRatingModal}
              onClose={() => setShowRatingModal(false)}
              onSave={handleSaveReport}
            >
              <p>Are you sure you want to save this report with your selected rating?</p>
            </RatingModal>
              
              <div className="ai-report-body" id='ai-report-body'>
                <div className='report-section'>
                  {/*HEADER */}
                  <div className='ai-report-body-header'>
                    <div className='ai-report-body-header logo'>
                      <img src={earistLogo} alt='earist logo'/>
                    </div>
                    <div className='ai-report-body-header text'>
                      <i>Republic of the Philippines</i>
                      <b>EULOGIO “Amang” RODRIGUEZ</b>
                      <b>INSTITUTE OF SCIENCE AND TECHNOLOGY</b>
                      <i>Nagtahan, Sampaloc, Manila</i>
                    </div>
                    <div className='ai-report-body-header logo'>
                      <img src={ccsLogo} alt='ccs logo'/>
                    </div>
                  </div>

                  <div className='ai-report-body-header'>
                    <h2>COLLEGE OF COMPUTING STUDIES</h2>
                  </div>

                  {/*REPORT TABLE */}
                  <div className="ai-report-body-table">
                  <table>
                    <thead>      
                    </thead>
                    <tbody>
                      
                      <tr>
                        <td className='report-td-header' colSpan={8} style={{ fontWeight: 'bold', padding: '15px', textAlign: 'center'}}>
                          REPORT&nbsp;ON&nbsp;THE&nbsp;ALIGNMENT&nbsp;OF&nbsp;THESIS&nbsp;AND&nbsp;FACULTY&nbsp;RESEARCH&nbsp;WITH&nbsp;THE&nbsp;SUSTAINABLE&nbsp;DEVELOPMENT&nbsp;GOALS&nbsp;(SDGs)
                        </td>
                      </tr>

                      

                      {/* STUDENT THESIS */}
                      {studentPapers && Object.keys(studentPapers).length > 0 ? (
                        Object.entries(studentPapers).map(([course, papers], courseIndex) => (
                          <React.Fragment key={course}>
                            {/* Section header */}
                            <tr>
                              <td colSpan={8} className='section-header'>
                                {toRoman(sectionCounter++)}.&nbsp;&nbsp;&nbsp;&nbsp;Student&nbsp;Thesis&nbsp;Alignment&nbsp;with&nbsp;SDGs&nbsp;({course})
                              </td>
                            </tr>

                            {/* Table Header */}
                            <tr>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Number</td>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Title of Thesis</td>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Name of Students</td>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Adviser</td>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Academic Year and Sem and SY</td>
                              <td colSpan={2} style={{textAlign: 'center'}}>Aligned SDG/s</td>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Status (Completed/On-Going)</td>
                            </tr>
                            <tr>
                              <td style={{textAlign: 'center'}}>SDG Number</td>
                              <td style={{textAlign: 'center'}}>Title</td>
                            </tr>

                            {/* Papers on the course */}
                            {papers.map((paper, index) => (
                              <tr key={paper.research_id || `student-${course}-${index}`}>
                                <td style={{textAlign: 'center'}}>{index + 1}</td>
                                <td>{paper.research_title}</td>
                                <td>
                                  {Array.isArray(paper.researchers)
                                    ? paper.researchers.join("\n")
                                    : paper.researchers}
                                </td>
                                <td>{paper.adviser}</td>
                                <td>
                                  {paper.semester} {paper.academic_year}-{paper.academic_year + 1}
                                </td>
                                <td style={{textAlign: 'center'}}>
                                  {Array.isArray(paper.sdg_number)
                                    ? paper.sdg_number.join(", ")
                                    : paper.sdg_number}
                                </td>
                                <td>
                                  {Array.isArray(paper.sdg_labels)
                                    ? paper.sdg_labels.join(", \n\n")
                                    : paper.sdg_labels}
                                </td>
                                <td>
                                  {paper.status.charAt(0).toUpperCase() + paper.status.slice(1)}
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))
                        ) : (
                          <>
                            <tr>
                              <td colSpan={8} className='section-header'>
                                {toRoman(sectionCounter++)}.&nbsp;&nbsp;&nbsp;&nbsp;Student&nbsp;Thesis&nbsp;Alignment&nbsp;with&nbsp;SDGs
                              </td>
                            </tr>
                            <tr>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Number</td>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Title of Thesis</td>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Name of Students</td>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Adviser</td>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Academic Year and Sem and SY</td>
                              <td colSpan={2} style={{textAlign: 'center'}}>Aligned SDG/s</td>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Status (Completed/On-Going)</td>
                            </tr>
                            <tr>
                              <td style={{textAlign: 'center'}}>SDG Number</td>
                              <td style={{textAlign: 'center'}}>Title</td>
                            </tr>
                            <tr>
                              <td colSpan={8}>
                                No student papers found.
                              </td>
                            </tr>
                          </>
                        )
                      }
                      
                      {/* Faculty Papers */}
                      {facultyPapers && Object.keys(facultyPapers).length > 0 ? (
                        Object.entries(facultyPapers).map(([course, papers], courseIndex) => (
                          <React.Fragment key={course}>
                            {/* Section header */}
                            <tr>
                              <td colSpan={8} className='section-header'>
                                {toRoman(sectionCounter++)}.&nbsp;&nbsp;&nbsp;&nbsp;Faculty&nbsp;Research&nbsp;Alignment&nbsp;with&nbsp;SDGs&nbsp;({course})
                              </td>
                            </tr>

                            {/* Table Header */}
                            <tr>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Number</td>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Title of Research</td>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Name of Researcher/s</td>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Funding Source (if any)</td>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Academic Year and Sem and SY</td>
                              <td colSpan={2} style={{textAlign: 'center'}}>Aligned SDG/s</td>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Status (Completed/On-Going/Proposed)</td>
                            </tr>
                            <tr>
                              <td style={{textAlign: 'center'}}>SDG Number</td>
                              <td style={{textAlign: 'center'}}>Title</td>
                            </tr>

                            {/* Papers on the course */}
                            {papers.map((paper, index) => (
                              <tr key={paper.research_id || `student-${course}-${index}`}>
                                <td style={{textAlign: 'center'}}>{index + 1}</td>
                                <td>{paper.research_title}</td>
                                <td>
                                  {Array.isArray(paper.researchers)
                                    ? paper.researchers.join("\n")
                                    : paper.researchers}
                                </td>
                                <td>{paper.funding_source}</td>
                                <td>
                                  {paper.semester} {paper.academic_year}-{paper.academic_year + 1}
                                </td>
                                <td style={{textAlign: 'center'}}>
                                  {Array.isArray(paper.sdg_number)
                                    ? paper.sdg_number.join(", ")
                                    : paper.sdg_number}
                                </td>
                                <td>
                                  {Array.isArray(paper.sdg_labels)
                                    ? paper.sdg_labels.join(", \n\n")
                                    : paper.sdg_labels}
                                </td>
                                <td>
                                  {paper.status.charAt(0).toUpperCase() + paper.status.slice(1)}
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))
                        ) : (
                          <>
                            <tr>
                              <td colSpan={8} className='section-header'>
                                {toRoman(sectionCounter++)}.&nbsp;&nbsp;&nbsp;&nbsp;Faculty&nbsp;Research&nbsp;Alignment&nbsp;with&nbsp;SDGs
                              </td>
                            </tr>
                            <tr>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Number</td>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Title of Research</td>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Name of Researcher/s</td>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Funding Source (if any)</td>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Academic Year and Sem and SY</td>
                              <td colSpan={2} style={{textAlign: 'center'}}>Aligned SDG/s</td>
                              <td rowSpan={2} style={{textAlign: 'center'}}>Status (Completed/On-Going/Proposed)</td>
                            </tr>
                            <tr>
                              <td style={{textAlign: 'center'}}>SDG Number</td>
                              <td style={{textAlign: 'center'}}>Title</td>
                            </tr>
                            <tr>
                              <td colSpan={8}>
                                No faculty papers found.
                              </td>
                            </tr>
                          </>
                        )
                      }

                      {/* SUMMARY AND ANALYSIS */}
                      <tr>
                        <td colSpan={8} className="section-header">
                          {toRoman(sectionCounter++)}.&nbsp;&nbsp;&nbsp;&nbsp;Summary&nbsp;and&nbsp;Analysis</td>
                      </tr>
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'left'}}>
                          A. Total Number of Theses aligned with SDGs
                        </td>
                        <td colSpan={1} style={{textAlign: 'center'}}>{Object.values(studentPapers).reduce((sum, papers) => sum + papers.length, 0)}</td>
                      </tr>
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'left'}}>
                          B. Total Number of Faculty Research Aligned with SDGs
                        </td>
                        <td colSpan={1} style={{textAlign: 'center'}}>{Object.values(facultyPapers).reduce((sum, papers) => sum + papers.length, 0)}</td>
                      </tr>
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'left'}}>
                          C. Most commonly Addressed SDGs
                        </td>
                        <td colSpan={1} style={{textAlign: 'center'}}>
                          {commonSDG.length > 0
                            ? commonSDG.map(item => item.sdg).join(", ")
                            : "No data"}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'justify'}}>
                          <div>
                            D. Gaps and Areas for Improvement (Brief Analysis)
                          </div>
                          <div>
                            <i>From the report, the alignment of student theses and faculty research with the Sustainable Development Goals (SDGs) is commendable. However, some areas for improvement can be identified:</i>
                          </div>
                          <div className="markdown-body">
                            <ReactMarkdown children={aiResult.lackSection} />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'justify' }}>
                          <div>
                            E. Recommendations: Suggestions for strengthening SDG Alignment in your college
                          </div>
                          <div>
                            <i>To enhance the alignment of student theses and faculty research with the Sustainable Development Goals (SDGs), consider the following recommendations:</i>
                          </div>
                          <div className="markdown-body">
                            <ReactMarkdown children={aiResult.recommendationSection} />
                          </div>
                          <div className='e-end'>
                            <i>By implementing these recommendations, the college can diversify its research impact, promote sustainability-driven innovation, and build stronger collaborations across sectors</i>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className='ai-report-body-footer'>
                  <div>
                    <b className='b-header'>Prepared By</b><br/>
                    <b>
                      {userData?.firstname ? userData.firstname.toUpperCase() : ""}
                      {" "}
                      {userData?.middlename ? `${userData.middlename.charAt(0).toUpperCase()}. ` : ""}
                      {userData?.lastname ? userData.lastname.toUpperCase() : ""}
                    </b><br></br>
                    <p>{userData?.role === 'admin' ? 'Administrator' : 'Research Project Head'}</p>
                    <p>{new Date().toLocaleDateString()}</p>
                  </div>
                  <div>
                    <b className='b-header'>Endorsed By</b><br/>
                    <b>{endorsedBy.toUpperCase()}</b><br></br>
                    <p>Dean, {department?.department_abb}</p>
                    <p>{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/* )} */}

      <ConfirmModal
        show={modalConfig.show}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        confirmText={modalConfig.confirmText}
        onClose={closeModal}
        onCancel={closeModal}
        />

      <div className='toast-box' id='toast-box'></div>
    </>
  );
}

export default AIReport;