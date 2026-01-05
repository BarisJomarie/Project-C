import React from "react";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { showToast } from "../utils/toast";
import axios from "axios";
import { ShimmerTable, ShimmerText, ShimmerThumbnail, ShimmerTitle } from "react-shimmer-effects";


const AddPresentation = () => {
  const {dep_id} = useParams();
  const [pageLoading, setPageLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [department, setDepartment] = useState(null);
  const [currentUploadedPresentation, setCurrentUploadedPresentation] = useState([]);
  const [titleCheck, setTitleCheck] = useState(null);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const API_URL = import.meta.env.VITE_API_URL;

  //SDG ALIGNMENT OPTIONS
  const sdgOptions = [
    "SDG 1: No Poverty",
    "SDG 2: Zero Hunger",
    "SDG 3: Good Health and Well-being",
    "SDG 4: Quality Education",
    "SDG 5: Gender Equality",
    "SDG 6: Clean Water and Sanitation",
    "SDG 7: Affordable and Clean Energy",
    "SDG 8: Decent Work and Economic Growth",
    "SDG 9: Industry, Innovation and Infrastructure",
    "SDG 10: Reduced Inequalities",
    "SDG 11: Sustainable Cities and Communities",
    "SDG 12: Responsible Consumption and Production",
    "SDG 13: Climate Action",
    "SDG 14: Life Below Water",
    "SDG 15: Life on Land",
    "SDG 16: Peace, Justice and Strong Institutions",
    "SDG 17: Partnerships for the Goals"
  ];

  //CONFERENCE CATEGORY OPTIONS
  const conferenceCategory = [
    "Local Conference (International)",
    "Local Conference (National)",
    "International Conference (Outside ASEAN)",
    "International Conference (Within ASEAN)",
    "Local Conference (Regional)"
  ]

  //STATUS OPTIONS
  const status = [
    "Completed",
    "Ongoing",
    "Proposed"
  ]

  //FUNDING SOURCE OPTIONS
  const fundingSource = [
    "EARIST Funded",
    "Self Funded"
  ]

  const [formData, setFormData] = useState({
    department_id: dep_id,
    author: '',
    co_authors: [''],
    research_title: '',
    sdg_alignment: '',
    conference_title: '',
    organizer: '',
    venue: '',
    conference_category: '',
    date_presented: '',
    end_date_presented: '',
    special_order_no: '',
    status_engage: '',
    funding_source_engage: ''
  });

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
  const getDepartment = () => {
    return axios.get(`${API_URL}/api/users/department/info`, {
      params: { department_id: dep_id },
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setDepartment(res.data);
    }).catch(err => {
      console.error('Error fetching department', err);
    });
  };

  // GET USER CURRENT ADDED PRESENTATION
  const getCurrentUploadedPresentation = () => {
    return axios.get(`${API_URL}/api/users/presentation/user-current-upload`, {
      headers: {Authorization: `Bearer ${token}`}
    })
    .then(res => {
      setCurrentUploadedPresentation(res.data);
      // console.log(res.data);
    })
    .catch(err => {
      console.error('Error fetching presentations', err);
    });
  };

  // TITLE CHECKER
  useEffect(() => {
    const handler = setTimeout(() => {
      if (formData.research_title.trim() !== '') {
        axios.get(`${API_URL}/api/users/presentation/title-checker`, {
          params: {title: formData.research_title},
          headers: {Authorization: `Bearer ${token}`},
        })
        .then((res) => {
          setTitleCheck(res.data);
        })
        .catch((err) => {
          console.error(err);
          setTitleCheck({exists: null, message: 'Error checking title'});
        });
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [formData.research_title, API_URL, token]);

  useEffect(() => {
    setPageLoading(true);
    Promise.all([
      getUserData(), 
      getDepartment(),
      getCurrentUploadedPresentation()  
    ]).finally(() => {
      setPageLoading(false);
    });
  }, [dep_id]);

  //CLEAR FORM
  const clearFields = () => {
    setFormData({
      department_id: dep_id,
      author: '',
      co_authors: [''],
      research_title: '',
      sdg_alignment: [],
      conference_title: '',
      organizer: '',
      venue: '',
      conference_category: '',
      date_presented: '',
      end_date_presented: '',
      special_order_no: '',
      status_engage: '',
      funding_source_engage: '',
    });
  }


  // ADD PRESENTATION PAPERS
  const addPresentations = async (e) => {
    e.preventDefault();

    if (!formData.sdg_alignment || formData.sdg_alignment.length === 0) {
      showToast('warning', 'Missing SDG', 'Select at least one (1) SDG!');
      return
    }

    if (titleCheck?.exists === true) {
      showToast('warning', 'Title Exist', 'Title already exist!');
      return
    }

    const allCoAuthorsFilled = formData.co_authors.every(author => author.trim() !== '');
    if (!allCoAuthorsFilled) {
      showToast('warning', 'Missing Co-Author', 'Please fill in all co-author fields!');
      return;
    }

    try {
      // Map frontend fields to backend names
      const payload = {
        ...formData
      };

      const res = await axios.post(
        `${API_URL}/api/users/presentation/add`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // console.log('Response: ', res.data);
      showToast('success', 'Paper Uploaded', 'Research Presentation Added Successfully');
      clearFields();
      getCurrentUploadedPresentation();
    } catch (err) {
      console.error(err);
      console.log('Response: ', err.response?.data);
      showToast('error', 'Paper Error', 'Something went wrong uploading the presentation');
    }
  };

  return (
    <>
      <div className='hyperlink' onClick={() => navigate(-1)}><p>Go Back</p></div>
      {pageLoading ? <>
        <ShimmerTitle line={1} gap={10} variant="primary"/>
        <ShimmerTitle line={1} gap={10} variant="primary"/>
      </> : <>
        <h1 style={{textAlign: 'center'}}>Add Research Presentation for<br/>
        <span style={{color: '#C83F12'}}>{department?.department_name}</span>
      </h1>
      </>}
      <div className="line"></div>
      
      <div className="form-container default">
        {pageLoading ? <ShimmerThumbnail height={250} width={300} rounded /> : <>
          <form onSubmit={addPresentations}>

            {/* AUTHOR */}
            <div className="input-container">
              <div className="form-input">
                <label htmlFor="author">Author</label>
                <input 
                  name="author" 
                  type="text" 
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({...prev, author: e.target.value}))}
                  placeholder={`Author: Firstname M.I. Lastname`}
                  required
                  />
              </div>
            </div>

            {/* CO-AUTHORS */}
            <div className="input-container">
              <div className="form-input multi-index">
                <label htmlFor="coa">Researchers</label>
                {formData.co_authors.map((res, index) => (
                  <input 
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    name={`co_author_${index}`}
                    value={res}
                    onChange={(e) => {
                      const newCoAuthor = [...formData.co_authors];
                      newCoAuthor[index] = e.target.value;
                      setFormData(prev => ({...prev, co_authors: newCoAuthor}));
                    }}
                    onKeyDown={(e) => {
                      //ADD
                      if (e.key === 'Enter') {
                        e.preventDefault();

                        //IF NEXT INPUT IS EMPTY
                        if (formData.co_authors[index + 1] !== undefined && formData.co_authors[index + 1].trim() === "") {
                          setTimeout(() => {
                            inputRefs.current[index + 1]?.focus();
                          }, 0);
                        } 
                        //CREATES NEW IF CURRENT FOCUS IS LAST INDEX
                        else if (formData.co_authors.length < 6 && res.trim() !== '') {
                          setFormData(prev => {
                            const updated = [...prev.co_authors, ''];
                            return {...prev, co_authors: updated};
                          });

                          setTimeout(() => {
                            const lastIndex = formData.co_authors.length;
                            inputRefs.current[lastIndex]?.focus();
                          }, 0);
                        }
                      }

                      //DELETE
                      if (e.key === 'Backspace' && res === '' && formData.co_authors.length > 1) {
                        e.preventDefault();
                        const newCoAuthor = formData.co_authors.filter((_, i) => i !== index);
                        setFormData(prev => ({...prev, co_authors: newCoAuthor}));

                        setTimeout(() => {
                          const prevIndex = index - 1;
                          if (prevIndex >= 0) {
                            const prevInput = document.querySelector(`input[name="co_author_${prevIndex}"]`);
                            prevInput?.focus();
                          }
                        }, 0);
                      }
                    }}
                    placeholder={`Co-Author ${index + 1}: Firstname M.I. Lastname`}
                    required
                    style={{ display: "block", marginBottom: "10px" }}/>
                ))}
                <div className="form-button-container" style={{ justifyContent: 'center', gap: '10px'}}>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({...prev, co_authors: [...prev.co_authors, '']}))}
                    disabled={formData.co_authors.length === 6}>
                      +
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({...prev, co_authors: prev.co_authors.slice(0, -1)}))}
                    disabled={formData.co_authors.length === 1}>
                      -
                  </button>
                </div>
              </div>
            </div>

            {/* RESEARCH TITLE */}
            <div className="input-container">
              <div className="form-input">
                {formData.research_title.trim() !== "" && (
                  <>
                    {titleCheck?.exists === true && (
                      <p style={{ color: "red" }} className="checker">{titleCheck.message}</p>
                    )}
                    {titleCheck?.exists === false && (
                      <p style={{ color: "green" }} className="checker">{titleCheck.message}</p>
                    )}
                  </>
                )}
                <label htmlFor="r-title">Research Title</label>
                <input 
                  name="r-title" 
                  type="text" 
                  value={formData.research_title}
                  onChange={(e) => setFormData(prev => ({...prev, research_title: e.target.value}))}
                  placeholder="Enter Research Presentation Title"
                  required
                  />
              </div>  
            </div>

            {/* SDG ALIGNMENT */}
            <div className="input-container">
              <div className="form-input">
                <label htmlFor="sdg">SDG Alignment</label>
                <div className="sdg-checkboxes" name="sdg">
                  {sdgOptions.map((sdg, idx) => (
                    <label key={idx} className="checkbox-option">
                      <input
                        type="checkbox"
                        value={sdg}
                        checked={formData.sdg_alignment.includes(sdg)}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (formData.sdg_alignment.includes(value)) {
                            //REMOVE
                            setFormData(prev => ({...prev, sdg_alignment: prev.sdg_alignment.filter(item => item != value)}));
                          } else {
                            //SELECT
                            setFormData(prev => ({...prev, sdg_alignment: [...prev.sdg_alignment, value]}));
                          }
                        }} />
                        {sdg}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* CONFERRENCE TITLE */}
            <div className="input-container">
              <div className="form-input">
                <label htmlFor="c-title">Conference Title</label>
                <input 
                  name="c-title" 
                  type="text" 
                  value={formData.conference_title}
                  onChange={(e) => setFormData(prev => ({...prev, conference_title: e.target.value}))}
                  placeholder="Enter Conferece"
                  required
                  />
              </div>
            </div>

            {/* ORGANIZER */}
            <div className="input-container">
              <div className="form-input">
                <label htmlFor="org">Organizer</label>
                <input 
                  name="org" 
                  type="text" 
                  value={formData.organizer}
                  onChange={(e) => setFormData(prev => ({...prev, organizer: e.target.value}))}
                  placeholder="Enter Organizer"
                  required
                  />
              </div>
            </div>

            {/* VENUE */}
            <div className="input-container">
              <div className="form-input">
                <label htmlFor="venue">Venue</label>
                <input 
                  name="venue" 
                  type="text" 
                  value={formData.venue}
                  onChange={(e) => setFormData(prev => ({...prev, venue: e.target.value}))}
                  placeholder="Enter Venue"
                  required
                  />
              </div>
            </div>

            {/* START DATE */}
            <div className="input-container">
              <div className="form-input">
                <label htmlFor="s-date">Start Date</label>
                <input 
                  name="s-date" 
                  type="date" 
                  value={formData.date_presented}
                  onChange={(e) => setFormData(prev => ({...prev, date_presented: e.target.value}))}
                  required
                  />
              </div>
            </div>
           

            {/* END DATE */}
            <div className="input-container">
              <div className="form-input">
                <label htmlFor="e-date">End Date</label>
                <input 
                  name="e-date" 
                  type="date" 
                  value={formData.end_date_presented}
                  onChange={(e) => setFormData(prev => ({...prev, end_date_presented: e.target.value}))}
                  required
                  />
              </div>
            </div>

            {/* CONFERENCE CATEGORY */}
            <div className="input-container">
              <div className="form-input">
                <label htmlFor="conference_category">Conference Category</label>
                <select
                  name="conference_category"
                  value={formData.conference_category}
                  onChange={(e) => setFormData(prev => ({...prev, conference_category: e.target.value }))}
                  required>
                  <option value={''}>-- Select a Category --</option>
                  {conferenceCategory.map((type, idx) => (
                    <option key={idx} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SPECIAL ORDER NO. */}
            <div className="input-container">
              <div className="form-input">
                <label htmlFor="orderno">Special Order No.</label>
                <input 
                  name="orderno" 
                  type="text" 
                  value={formData.special_order_no}
                  onChange={(e) => setFormData(prev => ({...prev, special_order_no: e.target.value}))}
                  placeholder="Enter Special Order No."
                  />
              </div>
            </div>
           
            {/* STATUS */}
            <div className="input-container">
              <div className="form-input">
                <label htmlFor="status">Status</label>
                <select
                  name="status"
                  value={formData.status_engage}
                  onChange={(e) => setFormData(prev => ({...prev, status_engage: e.target.value }))}
                  required>
                  <option value={''}>-- Select the Status --</option>
                  {status.map((stat, idx) => (
                    <option key={idx} value={stat}>
                      {stat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            

            {/* FUNDING SOURCE */}
            <div className="input-container last">
              <div className="form-input">
                <label htmlFor="funding">Funding Source</label>
                <select
                  name="funding"
                  value={formData.funding_source_engage}
                  onChange={(e) => setFormData(prev => ({...prev, funding_source_engage: e.target.value }))}
                  required>
                  <option value={''}>-- Select the Funding Source --</option>
                  {fundingSource.map((fund, idx) => (
                    <option key={idx} value={fund}>
                      {fund}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-button-container">
              <button type="button" onClick={() => clearFields()}>Clear</button>
              <button type="submit">Add Research Presentation</button>
            </div>
          </form>
        </>}
      </div>

      <div className="line"></div>

      {pageLoading ? <ShimmerTable row={4} col={2}/> : <>
        {currentUploadedPresentation.length > 0 && (
          <div className="summary-container">
            <div className="summary-cards">
              <div className="card-table">
                <h4>Recently Added Presentation Papers</h4>
                <div className="list-container">
                  <ul className="custom-list">
                    {currentUploadedPresentation.length > 0 ? (
                      currentUploadedPresentation.map((paper) => (
                        <li key={paper.id} className="list-item">
                          <div className="list-left">
                            <strong className={`actor-`}>{paper.research_title}</strong>
                            <span className="action-text">{Array.isArray(paper.sdg_alignment) ? 
                              paper.sdg_alignment.map((sdg, idx) => (
                                <React.Fragment key={idx}>
                                  {sdg}<br />
                                </React.Fragment>
                              )) :
                              paper.sdg_alignment}</span>
                          </div>
                          <div className="list-right">
                            <strong>{paper.department_name}</strong>
                            <span>{new Date(paper.created_at).toLocaleString()}</span>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="no-items">No recently added publication</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </>}

      <div className="toast-box" id="toast-box"></div>
    </>
    );
};

export default AddPresentation;