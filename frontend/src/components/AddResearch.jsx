import { useParams, useNavigate } from "react-router-dom";
import { ResponsiveContainer, Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis, Cell } from 'recharts'
import { useState, useEffect } from "react";
import { showToast } from "../utils/toast";
import ConfirmModal from "../utils/ConfirmModal";
import axios from "axios";
import Loading from "../utils/Loading";
import '../styles/style.css';
import '../styles/form.css';
import '../styles/addPage.css';

const AddResearch = () => {
  const { dep_id } = useParams();
  const [modalConfig, setModalConfig] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
  })
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [depData, setDepData] = useState(null);
  const [departmentCourses, setDepartmentCourses] = useState([]);
  const [researchType, setResearchType] = useState("");
  const [semester, setSemester] = useState("");
  const [fundingSource, setFundingSource] = useState("");
  const [sy, setSY] = useState("");
  const [rtitle, setRTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [adviser, setAdviser] = useState("");
  const [researchers, setResearchers] = useState([""]);
  const [course, setCourse] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [confidenceData, setConfidenceData] = useState(null);
  const [status, setStatus] = useState("");
  const [probabilities, setProbabilities] = useState({});
  const [sdg_index, setSdgIndex] = useState(null);
  const [isPredicted, setIsPredicted] = useState(false);
  const [selectedSdgs, setSelectedSdgs] = useState([]);
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
    setModalConfig(prev => ({...prev, show: false}));
  };



  // GET USER ID
  const getUserData = () => {
    axios.get(`${API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(response => {
      if (response.data) {
        // console.log(response.data);
        setUserData(response.data);
        if (response.data.role !== 'admin') {
          setCourse(response.data.course); // default course for non-admin
        }
      } else {
        console.log(`No user found`);
      }
    })
    .catch(err => {
      console.error(`Failed to fetch user`, err);
    });
  };



  // GET DEPARTMENT INFO
  const getDepartment = () => {
    axios.get(`${API_URL}/api/users/department/info`, {
      params: { department_id: dep_id },
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      // console.log('Department fetched:', res.data);
      setDepData(Array.isArray(res.data) ? res.data[0] : res.data);
    }).catch(err => {
      console.error('Error fetching department', err);
    });
  };



  // GET DEPARTMENT COURSES
  const getDepartmentCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users/department-courses`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { department_id: dep_id },
      });

      if (Array.isArray(response.data)) {
        setDepartmentCourses(response.data);
        // console.log('Courses fetched:', response.data);
      } else {
        setDepartmentCourses([]);
      }
    } catch (err) {
      console.error('Failed to fetch courses', err);
    }
  };



  useEffect(() => {
    getUserData();
    getDepartment();
    getDepartmentCourses();
  }, []);



  const sdgOptions = [
    "No Poverty",
    "Zero Hunger",
    "Good Health and Well-being",
    "Quality Education",
    "Gender Equality",
    "Clean Water and Sanitation",
    "Affordable and Clean Energy",
    "Decent Work and Economic Growth",
    "Industry, Innovation and Infrastructure",
    "Reduced Inequalities",
    "Sustainable Cities and Communities",
    "Responsible Consumption and Production",
    "Climate Action",
    "Life Below Water",
    "Life on Land",
    "Peace, Justice and Strong Institutions",
    "Partnerships for the Goals"
  ];



  const sdgColors = [
    "#e5233d", "#dda73a", "#4ca146", "#c7212f",
    "#ef402d", "#27bfe6", "#fbc412", "#fbc412",
    "#f26a2e", "#e01483", "#f89d2a", "#bf8d2c",
    "#407f46", "#1f97d4", "#59ba47", "#136a9f",
    "#14496b"
  ];



  const handleAddResearch = async (e) => {
    e.preventDefault();

    if (!rtitle?.trim() || !researchType?.trim() || (!isPredicted && selectedSdgs.length === 0) || !status?.trim()) {
      showToast('warning', 'Missing Fields', 'Please fill all required fields including SDG.');
      return;
    }

    if(researchType === 'faculty' && !fundingSource?.trim()) {
      showToast('warning', 'Missing Fields', 'Please select funding source for Faculty Research.');
      return;
    }

    if(researchType === 'student' && !course?.trim()) {
      showToast('warning', 'Missing Fields', 'Please select course for Student Thesis.');
      return;
    }

    showModal(
      'Adding Research Paper',
      <>
        Are you sure you want to add this paper?
        <br/><br/>
        Title: <strong>{rtitle}</strong><br/>
        Research Type: <strong>{researchType === 'student'
          ? 'Student Thesis'
          : 'Faculty Research'}</strong><br/>
        Status: <strong>{status === 'on-going'
          ? 'On Going'
          : status === 'completed'
          ? 'Completed'
          : 'Proposed'}</strong><br/>
        {researchType === 'faculty' && (
          <>
            Funding Source: <strong>{fundingSource === 'self-funded'
              ? 'Self-Funded'
              : 'EARIST'}</strong><br/>
          </>
        )}
        Semester: <strong>{semester}</strong><br/>
        Academic Year: <strong>{sy}</strong><br/>
      </>,
      async () => {
        try {
          // If there’s a prediction, use it; otherwise, build a manual confidence object
          let probObj = {};

          if (isPredicted && Array.isArray(probabilities)) {
            probabilities.forEach((p, idx) => {
              probObj[idx] = p;
            });
          } else if (selectedSdgs.length > 0) {
            // Manual multiple SDG: set 1 for selected, 0 for others
            sdgOptions.forEach((sdg, idx) => {
              probObj[idx] = selectedSdgs.some((s) => s.index === idx + 1) ? 1 : 0;
            });
          } else {
            // default o
            sdgOptions.forEach((sdg, idx) => {
              probObj[idx] = 0;
            });
          }

          const payload = {
            user_id: Number(userId),
            research_type: researchType,
            semester: semester,
            funding_source: fundingSource,
            sy: Number(sy),
            title: rtitle,
            abstract,
            conclusion,
            adviser,
            researchers,
            department: Number(dep_id),
            course: course 
              ? Number(course) 
              : null,
            sdg_number: isPredicted 
              ? sdg_index + 1 
              : selectedSdgs.map((s) => s.index),
            sdg_label: isPredicted 
              ? prediction 
              : selectedSdgs.map((s) => s.label),
            confidence_scores: probObj,
            status: status,

            user_code: userData?.user_code,
            role: userData?.role
          };

          // console.log('Submitting research paper with payload:', payload);

          const res = await axios.post(`${API_URL}/api/users/research-add`, payload, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (res.status === 201) {
            showToast('success', 'Research Added', 'Research added successfully');
            clearField();
          }

        } catch (err) {
          console.error(err);
          const message = err.response?.data?.message || "Failed to add research";
          showToast('error', 'Error', message);
        } finally {
          closeModal();
        }
      }
    )
  };

  



  const analyzeResearch = async () => {
    if (!rtitle?.trim() || !abstract?.trim() || !conclusion?.trim()) {
      showToast('warning', 'Fields is empty', 'Title, Abstract & Keywords cannot be empty.');
      return;
    }

    // STRICT WORD COUNT VALIDATION
  const countWords = (str) => {
    return str
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length;
  };

  const titleWordCount = countWords(rtitle);

  if (titleWordCount < 5) {
    showToast('warning', 'Invalid Title', `Research title must contain at least 5 words. You currently have ${titleWordCount}.`);
    return;
  }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/nlp/analyze-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `${rtitle} ${abstract} ${conclusion}`
        }),
      });

      const result = await res.json();

      setPrediction(result.prediction);
      setConfidence(result.confidence);
      setSdgIndex(result.sdg_index);

      // store raw probabilities array
      setProbabilities(result.probabilities);

      const confidenceData = sdgOptions.map((sdg, idx) => ({
        sdg,
        score: result.probabilities[idx] || 0,
        index: idx,
      }));
      setConfidenceData(confidenceData);

      setIsPredicted(true);

    } catch (err) {
      console.error("Error analyzing research:", err);
      showToast('error', 'Prediction Failed', 'Could not predict SDG at this time.');
    } finally {
      setLoading(false);
    }
  };



  const clearField = () => {
    setResearchType("");
    setStatus("");
    setSemester("");
    setFundingSource("");
    setCourse("");
    setAdviser("");
    setSY("");

    setRTitle("");
    setAbstract("");
    setConclusion("");
    setPrediction(null);
    setConfidence(null);
    setConfidenceData(null);
    setResearchers([""]);
    setSelectedSdgs([]);
    setIsPredicted(false);
  };



  const ConfidenceChart = ({ data }) => (
    <div className="confidence-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data}
          layout="vertical"
          margin={{ left: 30}}
          >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="sdg" tick={{ fontSize: 8, width: 90 }}/>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const idx = payload[0].payload.index;
                const textColor = sdgColors[idx % sdgColors.length];
                const bgmColor = getContrastYIQ(textColor);
                return (
                  <div className="confidence-chart-tooltip" style={{
                    backgroundColor: bgmColor,
                    color: textColor,
                  }}>
                    <div>
                      {payload[0].payload.sdg}
                    </div>
                    <div>
                      Score: {payload[0].value}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />

          <Bar dataKey="score">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={sdgColors[index % sdgColors.length]}/>
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );



  function getContrastYIQ(hexcolor){
    hexcolor = hexcolor.replace('#', '');
    const r = parseInt(hexcolor.substr(0,2),16);
    const g = parseInt(hexcolor.substr(2,2),16);
    const b = parseInt(hexcolor.substr(4,2),16);
    const yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 128) ? '#000' : '#fff';
  }



  return (
    <>
      {loading && <Loading text="Predicting the SDG, please wait..." />}
      <div className='hyperlink' onClick={() => navigate(-1)}><p>Go Back</p></div>
      <h1 style={{textAlign: 'center'}}>Add Research for Department of <span style={{color: '#C83F12'}}>{depData?.department_name}</span></h1>
      <div className="line"></div>
      <div className="form-container default">
        <form onSubmit={handleAddResearch}>
          {/* RESEARCH TYPE */}
          <div className="form-input" name='rtype'>
            <div className="radio-group">
           
              {/* STUDENT THESIS */}
              <label className={`${status === 'proposed' ? 'disabled' : ''} radio-buttons`}>
                <input 
                  type="radio" 
                  name="researchType" 
                  value="student" 
                  checked={researchType === 'student'} 
                  onChange={() => {
                    setResearchType('student'); 
                    setFundingSource('');

                    const currYear = new Date().getFullYear();
                    setSY(currYear);
                  }} 
                  disabled={status === 'proposed'}
                  />
                Student Thesis
              </label>

              {/* FACULTY RESEARCH */}
              <label className="radio-buttons">
                <input 
                  type="radio" 
                  name="researchType" 
                  value="faculty" 
                  checked={researchType === 'faculty'} 
                  onChange={() => {
                    setResearchType('faculty'); 
                    setCourse('');

                    if (status === 'completed') {
                      const currYear = new Date().getFullYear();
                      setSY(currYear);
                    } else {
                      setSY('');
                    }
                  }}
                  />
                Faculty Research
              </label>

            </div>
            <label htmlFor="rtype">Research Type</label>
          </div>

          {/* STATUS */}
          <div className="form-input" name='status'>
            <div className="radio-group">

              {/* ON-GOING */}
              <label>
                <input 
                  type="radio" 
                  name="status" 
                  value="on-going" 
                  checked={status === 'on-going'} 
                  onChange={() => setStatus('on-going')}
                  />
                Ongoing
              </label>

              {/* COMPLETED */}
              <label>
                <input 
                  type="radio" 
                  name="status" 
                  value="completed" 
                  checked={status === 'completed'} 
                  onChange={() => {
                    setStatus('completed');

                    if (researchType === 'faculty') {
                      const currYear = new Date().getFullYear();
                      setSY(currYear);
                    }
                  }}
                  />
                Completed
              </label>

              {/* PROPOSED */}
              <label className={`${researchType === 'student' ? 'disabled' : ''}`}>
                <input 
                  type="radio" 
                  name="status" 
                  value="proposed" 
                  checked={status === 'proposed'} 
                  onChange={() =>setStatus('proposed')} 
                  disabled={researchType === 'student'}
                  />
                Proposed
              </label>

            </div>
            <label htmlFor="status">Status</label>
          </div>

          {/* FUNDING SOURCE (for Faculty research) */}
          <div className="form-input" name='funding'>
            <div className="radio-group">

              {/* SELF FUNDED */}
              <label className={`${researchType === 'student' ? 'disabled' : ''}`}>
                <input 
                  type="radio" 
                  name="fundingSource" 
                  value="self-funded" 
                  checked={fundingSource === 'self-funded'} 
                  onChange={() => setFundingSource('self-funded')} 
                  disabled={researchType === 'student'}
                  />
                Self-Funded
              </label>

              {/* EARIST FUNDED */}
              <label className={`${researchType === 'student' ? 'disabled' : ''}`}>
                <input 
                  type="radio" 
                  name="fundingSource" 
                  value="earist" 
                  checked={fundingSource === 'earist'} 
                  onChange={() => setFundingSource('earist')} 
                  disabled={researchType === 'student'}
                  />
                EARIST
              </label>

            </div>
            <label htmlFor="rtype">Funding Source (if any)</label>
          </div>

          {/* SEMESTER */}
          <div className="form-input" name='rtype'>
            <div className="radio-group">

              {/* 1st SEMESTER */}
              <label>
                <input 
                  type="radio" 
                  name="sem" 
                  value="1st" 
                  checked={semester === '1st'} 
                  onChange={() => setSemester('1st')}
                  />
                1st Semester
              </label>

              {/* 2nd SEMESTER */}
              <label>
                <input 
                  type="radio" 
                  name="sem" 
                  value="2nd" 
                  checked={semester === '2nd'} 
                  onChange={() => setSemester('2nd')}
                  />
                2nd Semester
              </label>

            </div>
            <label htmlFor="rtype">Semester</label>
          </div>

          {/* SY */}
          <div className="form-input">
            <input 
              name="sy" 
              type="number" 
              placeholder="YYYY (max 4)" 
              value={sy} 
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 4) {
                  setSY(e.target.value)
                }
              }} 
              required/>
            <label htmlFor="sy">School Year</label>
          </div>

          {/* DEPARTMENT */}
          <div className="form-input">
            <input 
              name="department" 
              type="text" 
              value={depData?.department_name || 'Department ?'} 
              disabled 
              />
            <label htmlFor="department">Department</label>
          </div>

          {/* COURSE */}
          <div className="form-input">
            <select 
              value={course} 
              onChange={(e) => setCourse(e.target.value)} 
              required
              >
              <option value="">-- Select Course --</option>
              {departmentCourses.map((c) => (
                <option key={c.course_id} value={c.course_id}>{c.course_name}</option>
              ))}
            </select>
            <label>Course</label>
          </div>

          {/* ADVISER */}
          <div className="form-input">
            <input 
              name="adviser" 
              type="text" 
              placeholder="Lastname, Firstname MI." 
              value={adviser} 
              onChange={(e) => setAdviser(e.target.value)} 
              disabled={researchType === "faculty"} 
              required={researchType !== "faculty"} 
              />           
            <label htmlFor="adviser">Adviser</label>
          </div>

          {/* RESEARCHERS */}
          <div className="form-input">
            <div className="form-button-container" style={{ justifyContent: 'center', gap: '10px'}}>

              {/* ADD RESEARCHER */}
              <button 
                type="button" 
                onClick={() => setResearchers([...researchers, ""])} 
                disabled={researchers.length === 6}
                >
                  +
              </button>

              {/* REMOVE RESEARCHER */}
              <button 
                type="button" 
                onClick={() => setResearchers(researchers.slice(0, -1))} 
                disabled={researchers.length === 1}
                >
                  -
              </button>

            </div>
            {researchers.map((res, index) => (
              <input
                key={index}
                type="text"
                value={res}
                onChange={(e) => {
                  const newResearchers = [...researchers];
                  newResearchers[index] = e.target.value;
                  setResearchers(newResearchers);
                }}
                placeholder={`Researcher ${index + 1} Lastname, Firstname MI.`}
                required
                style={{ display: "block", marginBottom: "10px" }}
              />
            ))}
            <label>Researchers</label>
          </div>

          {/* TITLE */}
          <div className="form-input">
            <input 
              name="title" 
              type="text" 
              placeholder="Enter research title" 
              value={rtitle} 
              onChange={(e) => setRTitle(e.target.value)} 
              required
              />
            <label>Research Title</label>
          </div>

          {/* ABSTRACT */}
          <div className="form-input">
            <textarea 
              name="abstract" 
              placeholder="Enter abstract (optional)" 
              value={abstract} 
              onChange={(e) => {
                setAbstract(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }} 
              />
            <label htmlFor="abstract">Abstract</label>
          </div>

          {/* CONCLUSION */}
          <div className="form-input">
            <textarea 
              name="keywords" 
              placeholder="Enter keywords (optional)" 
              value={conclusion} 
              onChange={(e) => {
                setConclusion(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }} 
              />
            <label htmlFor="keywords">Keywords</label>
          </div>

          {/* SDG SELECTION (IF NOT PREDICTION MODE) */}
          <div className={`manual-sdg-section ${!isPredicted ? "visible" : ""}`}>
            <div className="form-input">
              <div className="sdg-checkboxes" name="sdg">
                {sdgOptions.map((opt, idx) => (
                  <label key={idx} className="checkbox-option">
                    <input
                      type="checkbox"
                      value={opt}
                      checked={selectedSdgs.some((s) => s.label === opt)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSdgs([...selectedSdgs, { label: opt, index: idx + 1 }]);
                        } else {
                          setSelectedSdgs(selectedSdgs.filter((s) => s.label !== opt));
                        }
                      }}
                    />
                    {idx + 1}.&nbsp;{opt}       
                  </label>
                ))}
              </div>
              <label htmlFor="sdg">Select SDG</label>
            </div>
          </div>

          <div className="form-button-container">

            <button type="button" onClick={() => clearField()}>Clear</button>
            <button type="button" className="btn-submit" onClick={analyzeResearch} >Predict</button>
            {!prediction && <button type="submit" className="btn-submit" style={{ width: '100%'}}>Add Paper</button>}

          </div>

        {prediction && (
          <>
            <div className="prediction-box">
              <h3>Predicted SDG:</h3>
              <p>{prediction}</p>
              <p>Confidence: {(confidence * 100).toFixed(2)}%</p>
              
              {confidenceData && confidenceData.length > 0 ? (
                <div className="confidence-chart-container">
                  <ConfidenceChart data={confidenceData} />
                </div>
              ) : (
                <div>
                  <p>Cannot generate graph.</p>
                </div>
              )}

              {confidence < 0.7 ? (
                <div>
                  <p style={{color: 'red'}}>Low confidence detected. It is recommended to select the SDG manually.</p>
                </div>
              ) : confidence < 0.9 ? (
                <div>
                  <p style={{color: '#868605'}}>Medium confidence detected. Prediction is okay but should be double-checked.</p>
                </div>
              ) : (
                <div>
                  <p style={{color: 'green'}}>High confidence detected. Prediction is reliable.</p>
                </div>
              )}

              <div className="form-button-container">
                <button 
                  type="button" 
                  onClick={() => {
                    setPrediction(null);
                    setConfidence(null);
                    setConfidenceData(null);
                    setIsPredicted(false);
                    setSelectedSdgs([]); 
                  }}
                  >
                  Cancel Prediction
                </button>
                <button type="submit">Add Paper</button>
              </div>
            </div>
          </>
        )}
        </form>
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
};

export default AddResearch;