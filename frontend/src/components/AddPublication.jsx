import React from "react";
import axios from "axios";
import Select from 'react-select'
import CreatableSelect from 'react-select/creatable';
import reactSelect from '../styles/reactSelect';
import useFetchOptions from "../hooks/useFetchOptions";
import useMultiFetchOptions from "../hooks/useMultiFetchOptions";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShimmerThumbnail, ShimmerTitle } from "react-shimmer-effects";
import { useRef } from "react";
import { showToast } from "../utils/toast";

const AddPublication = () => {
  const { dep_id } = useParams();
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');
  const [pageLoading, setPageLoading] = useState(true);
  const [department, setDepartment] = useState(null);

  //TITLE CHECKER LANG TO
  const [titleCheck, setTitleCheck] = useState(null);

  //FOR ISBN/ISSN CODE INPUTS
  const [ISSN_ISBNPrefix, setISSN_ISBNPrefix] = useState('ISSN');
  const [digits, setDigits] = useState(Array(13).fill(''));

  //FOR SELECT FIELDS OPTIONS GROUPINGS
  const [selectedOptions, setSelectedOptions] = useState({});

  //AUTHOR SEARCH
  const [authorSearchTerm, setAuthorSearchTerm] = useState('');
  const { options: authorOptions, loading: authorLoading } = useFetchOptions(authorSearchTerm, 'pub_author', API_URL, token);

  //JOURNAL / PUBLICATION TITLE SEARCH
  const [journalTitleSearchTerm, setJournalTitleSearchTerm] = useState('');
  const { options: journalTitleOptions, loading: journalTItleLoading } = useFetchOptions(journalTitleSearchTerm, 'journal_title', API_URL, token);
  
  // CONFERENCE / PROCEEDINGS SEARCH
  const [conferenceOrProceedingsSearchTerm, setConferenceOrProceedingsSearchTerm] = useState('');
  const { options: conferenceOrProceedingsOptions, loading: conferenceOrProceedingsLoading } = useFetchOptions(conferenceOrProceedingsSearchTerm, 'conference_or_proceedings', API_URL, token);

  //PUBLISHER SEARCH
  const [publisherSearchTerm, setPublisherSearchTerm] = useState('');
  const { options: publisherOptions, loading: publisherLoading } = useFetchOptions(publisherSearchTerm, 'publisher', API_URL, token);

  //INDEX SEARCH
  const [indexSearchTerm, setIndexSearchTerm] = useState('');
  const { options: indexOptions, loading: indexLoading } = useFetchOptions(indexSearchTerm, 'index_type', API_URL, token);

  // CO AUTHOR SEARCH INDEXES
  const [coAuthorSearchTerm, setCoAuthorSearchTerm] = useState({});
  const { optionsByIndex: coAuthorOptionsByIndex, loading: coAuthorLoading } = useMultiFetchOptions(coAuthorSearchTerm, 'pub_co_authors', API_URL, token);

  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const inputRefs = useRef([]);
  
  const DOI_PREFIX = 'https://doi.org/10.'

  const ISSN_GROUPS = [4, 4];
  const ISBN_GROUPS = [3, 1, 5, 3, 1];
  const ACTIVE_GROUPS =
    ISSN_ISBNPrefix === "ISSN" || ISSN_ISBNPrefix === "E-ISSN"
      ? ISSN_GROUPS
      : ISBN_GROUPS;
  const ACTIVE_LENTGH = ACTIVE_GROUPS.reduce((a, b) => a + b, 0);
  const ACTIVE_DIGITS = digits.slice(0, ACTIVE_LENTGH);
  const ISSN_ISBN_OPTIONS = [
    {value: 'ISSN', label: 'ISSN'},
    {value: 'ISBN', label: 'ISBN'},
    {value: 'E-ISSN', label: 'E-ISSN'},
    {value: 'E-ISBN', label: 'E-ISBN'}
  ];

  const formatISSNISBN = (digits, groups) => {
    let index = 0;

    return groups.map(size => {
        const part = digits.slice(index, index + size).join('');
        index += size;
        return part;
      }).join('-');
  };


  const MONTHS = [
    {value: 'January', label: 'January'},
    {value: 'February', label: 'February'},
    {value: 'March', label: 'March'},
    {value: 'April', label: 'April'},
    {value: 'May', label: 'May'},
    {value: 'June', label: 'June'},
    {value: 'July', label: 'July'},
    {value: 'August', label: 'August'},
    {value: 'September', label: 'September'},
    {value: 'October', label: 'October'},
    {value: 'November', label: 'November'},
    {value: 'December', label: 'December'}
  ];

  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: 11 }, (_, i) => {
    const year = currentYear - 5 + i;
    return { value: year.toString(), label: year.toString() };
  });

  const [formData, setFormData] = useState({
    department_id: dep_id,
    published_title: '',
    pub_author: '',
    pub_co_authors: [''],
    journal_title: '',
    conference_or_proceedings: '',
    publisher: '',
    start_month: null,
    end_month: null,
    year: null,
    doi: '',
    issn_isbn: '',
    volume_no: '',
    issue_no: '',
    index_type: []
  });

  // GET DEPARTMENT INFO
  const getDepartment = () => {
    return axios.get(`${API_URL}/api/users/department/info`, {
      params: { department_id: dep_id },
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setDepartment(res.data);

    }).catch(err => {
      if (err.response?.status === 404) console.log(err.response.data.message);
      else if(err.response?.status === 500) console.error(err.response.data.message);
      else console.error('Unexpected error: ', err);
    });
  };

  useEffect(() => {
    setPageLoading(true);
    getDepartment().finally(() => setPageLoading(false));
  }, []);
  
  //TITLE CHECKER
  useEffect(() => {
    const handler = setTimeout(() => {
      if (formData.published_title.trim() !== '') {
        axios.get(`${API_URL}/api/users/publication/title-checker`, {
          params: {published_title: formData.published_title},
          headers: {Authorization: `Bearer ${token}`}
        })
        .then((res) => setTitleCheck(res.data))
        .catch((err) => {
          if (err.response?.status == 400) console.log(err.response.data.message);
          else if (err.response?.status === 500) console.error(err.response.data.message);
          else console.error('Unexpected error: ', err);
        });
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [formData.published_title, API_URL, token]);

  //ADD DIGITS TO FORM DATA
  useEffect(() => {
    if (digits.length > 0) {
      const code = digits.join('');
      setFormData(prev => ({ ...prev, issn_isbn: code }));
    }
  }, [digits]);

  //SA ISSN/ISBN CODE CONTROLS
  const codeControl = (e, pos) => {
    // overwrite: if a number key is pressed, replace immediately
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      const newDigits = [...digits];
      newDigits[pos] = e.key;
      setDigits(newDigits);

      //auto‑jump forward
      if (pos < digits.length - 1) {
        const next = document.getElementById(`digit-${pos + 1}`);
        if (next) next.focus();
      };
    };

    //back
    if (e.key === 'Backspace' && !digits[pos] && pos > 0) {
      const prev = document.getElementById(`digit-${pos - 1}`);
      if (prev) prev.focus();
    };

    //next
    if (e.key === 'ArrowLeft' && pos > 0) {
      const prev = document.getElementById(`digit-${pos - 1}`);
      if (prev) prev.focus();
    };

    //backward
    if (e.key === 'ArrowRight' && pos < digits.length - 1) {
      const next = document.getElementById(`digit-${pos + 1}`);
      if (next) next.focus();
    };
  };

  // CONTROL FOR CO AUTHOR
  const coAuthorControl = (e, index, res) => {
    // ADD
    if (e.key === 'Enter') {
      e.preventDefault();

      // If next input exists and is empty, just focus it
      if (
        formData.pub_co_authors[index + 1] !== undefined &&
        formData.pub_co_authors[index + 1].trim() === ''
      ) {
        setTimeout(() => {
          inputRefs.current[index + 1]?.focus();
        }, 0);
      }
      // Otherwise, if current is non-empty and we're under the limit, add a new slot
      else if (formData.pub_co_authors.length < 6 && res.trim() !== '') {
        setFormData(prev => ({
          ...prev,
          pub_co_authors: [...prev.pub_co_authors, '']
        }));
        setTimeout(() => {
          const lastIndex = formData.pub_co_authors.length;
          inputRefs.current[lastIndex]?.focus();
        }, 0);
      }
    }

    // DELETE
    if (e.key === 'Backspace' && res === '' && formData.pub_co_authors.length > 1) {
      e.preventDefault();
      const newCoAuthor = formData.pub_co_authors.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, pub_co_authors: newCoAuthor }));

      setTimeout(() => {
        const prevIndex = index - 1;
        if (prevIndex >= 0) {
          inputRefs.current[prevIndex]?.focus();
        }
      }, 0);
    }
  }

  //ADD
  const handlePublicationSubmit = async (e) => {
    e.preventDefault();
    
    const excludedKeys = ['conference_or_proceedings', 'doi', 'volume_no', 'issue_no'];
    const emptyRequiredField = Object.entries(formData).find(([key, value]) => value === '' && !excludedKeys.includes(key));

    if (emptyRequiredField) {
      const [key] = emptyRequiredField;

      const fieldLabels = {
        published_title: 'Published Title',
        pub_author: 'Author',
        journal_title: 'Title of Journal / Publication',
        publisher: 'Publisher',
        start_month: 'Date of Publication - Start Month',
        end_month: 'Date of Publication - End Month',
        year: 'Date of Publication - Year',
        issn_isbn: 'ISSN / ISBN Code',
      }
      const label = fieldLabels[key] || key.replace(/_/g, ' ');

      showToast('warning', 'Missing Required Field', `${label} field is empty.`);
      return;
    };

    if (Array.isArray(formData.index_type) && formData.index_type.length === 0) {
      showToast('warning', 'Missing Required Field', 'Index field is empty.');
      return
    };

    if (ACTIVE_DIGITS.length !== ACTIVE_LENTGH || ACTIVE_DIGITS.includes(null)) {
      showToast('warning', 'Invalid Code', `Please complete the ${ISSN_ISBNPrefix} code.`);
      return
    }

    if (formData.volume_no === '' && formData.issue_no !== '') {
      showToast('warning', 'Missing Field', 'Volume & Issue No. - Volume field is empty.');
      return
    }
    if (formData.volume_no !== '' && formData.issue_no === '') {
      showToast('warning', 'Missing Field', 'Volume & Issue No. - Issue field is empty.');
      return
    }

    const formattedCode = formatISSNISBN(ACTIVE_DIGITS, ACTIVE_GROUPS);
    const final_issn_isbn = `${ISSN_ISBNPrefix}: ${formattedCode}`

    const payload = {
      ...formData, issn_isbn: final_issn_isbn
    };

    await axios.post(`${API_URL}/api/users/publication/add`, payload, {
      headers: {Authorization: `Bearer ${token}`}
    }).then(res => {
      showToast('success', 'Added Publication', res.data.message);
      clearFields();
    }).catch(err => {
      if (err.response?.status === 400) console.log(err.response.data.message);
      else if (err.response?.status === 500) console.error(err.response.data.message);
      else console.error('Unexpected Error', err);
    });
  };

  const clearFields = () => {
    setFormData({
      department_id: dep_id,
      published_title: '',
      pub_author: '',
      pub_co_authors: [''],
      journal_title: '',
      conference_or_proceedings: '',
      publisher: '',
      start_month: null,
      end_month: null,
      year: null,
      doi: '',
      issn_isbn: '',
      volume_no: '',
      issue_no: '',
      index_type: []
    });

    setSelectedOptions(prev => ({...prev, index_type: []}));
    clearISSNISBN();
  };
  const clearISSNISBN = () => {
    const length = ISSN_ISBNPrefix === "ISSN" || ISSN_ISBNPrefix === "E-ISSN"
      ? 8
      : 13;
    setDigits(Array(length).fill(null));
    setFormData(prev => ({ ...prev, issn_isbn: "" }));
  };


  return (
    <>
      <div className='hyperlink' onClick={() => navigate(-1)}><p>Go Back</p></div>
      {pageLoading ? <>
        <ShimmerTitle line={1} gap={10} variant="primary"/>
        <ShimmerTitle line={1} gap={10} variant="primary"/>
      </> : <>
        <h1 style={{textAlign: 'center'}}>Add Research Publication for <br/>
        <span style={{color: '#C83F12'}}>{department.department_name}</span>
      </h1>
      </>}
      <div className="line"></div>
      <div className="form-container default">
        {pageLoading ? <ShimmerThumbnail height={250} width={300} rounded /> : <>
          <form 
            onKeyDown={(e) => { 
            if (e.key === 'Enter') { 
              const isReactSelectInput = e.target.closest('.react-select__input'); 
              if (!isReactSelectInput) { 
                e.preventDefault(); 
                } 
            }}}
            onSubmit={handlePublicationSubmit}
            >

            {/* PUBLISHED TITLE */}
            <div className="input-container">
              <div className="form-input">
                {formData.published_title.trim() !== '' && (
                  <>
                    {titleCheck?.exists === true && (
                      <p style={{color: 'red'}} className="checker">{titleCheck.message}</p>
                    )}
                    {titleCheck?.exists === false && (
                      <p style={{color: 'green'}} className="checker">{titleCheck.message}</p>
                    )}
                  </>
                )}
                <label htmlFor="pub-title">Published Title</label>
                <input
                  name="pub-title"
                  type="text"
                  value={formData.published_title}
                  onChange={(e) => setFormData(prev => (
                    {...prev, published_title: e.target.value}
                  ))}
                  placeholder="Enter Published Title"
                />
              </div>
            </div>

            {/* AUTHOR */}
            <div className="input-container">
              <div className="form-input">
                <label htmlFor="pub-title">Author</label>
                <input
                  name="author"
                  type="text"
                  value={formData.pub_author}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => (
                      {...prev, pub_author: value}
                    ));
                    setAuthorSearchTerm(value);
                  }}
                  placeholder="Enter Author Name(e.g., DR. JUAN DELA CRUZ)"
                />

                {/* Suggestions dropdown */}
                {authorSearchTerm.trim() !== '' && authorOptions?.length > 0 && ( 
                  <div className="suggestions"> 
                    {authorOptions.map((option) => ( 
                      <div 
                        key={option.value} 
                        className="suggestion-item"
                        onClick={() => {
                          setFormData(prev => (
                            {...prev, pub_author: option.value}
                          ));
                          setAuthorSearchTerm('');
                        }}
                        > 
                        {option.label} 
                      </div> 
                    ))} 
                  </div> 
                )}
              </div>
            </div>
            
            {/* CO-AUTHORS */}
            <div className="input-container">
              <div className="form-input multi-index">
                <label htmlFor="coa">Co-Authors</label>
                {formData.pub_co_authors.map((res, index) => (
                  <div key={index} className="co-author-input-wrapper">
                    <input
                      ref={el => (inputRefs.current[index] = el)}
                      type="text"
                      name={`co_author_${index}`}
                      value={res}
                      onChange={(e) => {
                        const newCoAuthor = [...formData.pub_co_authors];
                        newCoAuthor[index] = e.target.value;
                        setFormData(prev => ({ ...prev, pub_co_authors: newCoAuthor }));
                        setCoAuthorSearchTerm(prev => ({ ...prev, [index]: e.target.value }));
                      }}
                      onKeyDown={(e) => coAuthorControl(e, index, res)}
                      placeholder={`Co-Author ${index + 1} Name(e.g., DR. JUAN DELA CRUZ)`}
                      style={{ display: 'block', marginBottom: '10px' }}
                    />

                    {/* Suggestions dropdown */}
                    {coAuthorOptionsByIndex[index]?.length > 0 &&
                      coAuthorSearchTerm[index]?.trim() !== '' && (
                        <div className="suggestions">
                          {coAuthorOptionsByIndex[index].map(option => (
                            <div
                              key={option.value}
                              className="suggestion-item"
                              onClick={() => {
                                const newCoAuthor = [...formData.pub_co_authors];
                                newCoAuthor[index] = option.value;
                                setFormData(prev => ({ ...prev, pub_co_authors: newCoAuthor }));
                                setCoAuthorSearchTerm(prev => ({ ...prev, [index]: '' }));
                              }}
                            >
                              {option.label}
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                ))}

                <div className="form-button-container" style={{ justifyContent: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => (
                      {...prev, pub_co_authors: [...prev.pub_co_authors, '']}
                    ))}
                    disabled={formData.pub_co_authors.length === 6}
                  >
                    +
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => (
                      {...prev, pub_co_authors: prev.pub_co_authors.slice(0, -1)}
                    ))}
                    disabled={formData.pub_co_authors.length === 1}
                  >
                    -
                  </button>
                </div>
              </div>
            </div>

            {/* TITLE OF JOURNAL / PUBLICATION */}
            <div className="input-container">
              <div className="form-input">
                <label htmlFor="journal-publication">Title of Journal / Publication</label>
                <input
                  name="journal-publication"
                  type="text"
                  value={formData.journal_title}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ ...prev, journal_title: value }));
                    setJournalTitleSearchTerm(value);
                  }}
                  placeholder="Enter Journal / Publication"
                />

                {/* Suggestions dropdown */}
                {journalTitleSearchTerm.trim() !== '' && journalTitleOptions?.length > 0 && ( 
                  <div className="suggestions"> 
                    {journalTitleOptions.map((option) => ( 
                      <div 
                        key={option.value} 
                        className="suggestion-item"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, journal_title: option.value }));
                          setJournalTitleSearchTerm('');
                        }}
                        > 
                        {option.label} 
                      </div> 
                    ))} 
                  </div> 
                )}
              </div>
            </div>

            {/* CONFERENCE OR PROCEEDINGS */}
            <div className="input-container">
              <div className="form-input">
                <label htmlFor="conference-proceedings">Conference or Proceedings</label>
                <input
                  name="conference-proceedings"
                  type="text"
                  value={formData.conference_or_proceedings}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ ...prev, conference_or_proceedings: value }));
                    setConferenceOrProceedingsSearchTerm(value);
                  }}
                  placeholder="Enter Conference / Proceedings"
                />

                {/* Suggestions dropdown */}
                {conferenceOrProceedingsSearchTerm.trim() !== '' && conferenceOrProceedingsOptions?.length > 0 && ( 
                  <div className="suggestions"> 
                    {conferenceOrProceedingsOptions.map((option) => ( 
                      <div 
                        key={option.value} 
                        className="suggestion-item"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, conference_or_proceedings: option.value }));
                          setConferenceOrProceedingsSearchTerm('');
                        }}
                        > 
                        {option.label} 
                      </div> 
                    ))} 
                  </div> 
                )}
              </div>
            </div>

            {/* PUBLISHER */}
            <div className="input-container">
              <div className="form-input">
                <label htmlFor="publisher">Publisher</label>
                <input
                  name="publisher"
                  type="text"
                  value={formData.publisher}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ ...prev, publisher: value }));
                    setPublisherSearchTerm(value);
                  }}
                  placeholder="Enter Publisher"
                />
                {publisherSearchTerm.trim() !== '' && publisherOptions?.length > 0 && ( 
                  <div className="suggestions"> 
                    {publisherOptions.map((option) => ( 
                      <div 
                        key={option.value} 
                        className="suggestion-item"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, publisher: option.value }));
                          setPublisherSearchTerm('');
                        }}
                        > 
                        {option.label} 
                      </div> 
                    ))} 
                  </div> 
                )}
              </div>
            </div>

            {/* DATE OF PUBLICATION */}
            <div className="input-container">
              <div className="grouped-inputs">
                <div className="grouped-input-container flex">
                  <div className="form-input">
                    <div className="doi-input">
                      <span className="doi-prefix">Start: </span>
                      <Select 
                        name="date"
                        options={MONTHS}
                        value={MONTHS.find(m => m.value === formData.start_month) || null}
                        onChange={(option) => setFormData(prev => ({...prev, start_month: option.value}))}
                        styles={reactSelect}
                        placeholder='-Select Start Month-'/>
                    </div>
                  </div>

                  <div className="form-input">
                    <div className="doi-input">
                      <span className="doi-prefix">End: </span>
                      <Select 
                        name="date"
                        options={MONTHS}
                        value={MONTHS.find(m => m.value === formData.end_month) || null}
                        onChange={(option) => setFormData(prev => ({...prev, end_month: option.value}))}
                        styles={reactSelect}
                        placeholder='-Select End Month-'/>
                    </div>
                  </div>

                  <div className="form-input">
                    <div className="doi-input">
                      <span className="doi-prefix">Year: </span>
                      <Select
                        name="date"
                        options={YEARS}
                        value={YEARS.find(y => y.value === formData.year) || null}
                        onChange={(option) =>
                          setFormData(prev => ({ ...prev, year: option.value }))
                        }
                        styles={reactSelect}
                        placeholder="-Select Year-"
                      />
                    </div>
                  </div>
                </div>
                <label htmlFor="s-date">Date of Publication</label>
              </div>
            </div>
            
            {/* DOI */}
            <div className="input-container">
              <div className="form-input">
                <label htmlFor="doi">DOI</label>
                <div className="doi-input">
                  <span className="doi-prefix">{DOI_PREFIX}</span>
                  <input
                    name="doi"
                    type="text"
                    value={formData.doi}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, doi: e.target.value }))
                    }
                    placeholder="Enter suffix"
                  />
                </div>
              </div>
            </div>

            {/* ISSN / ISBN CODE */}
            <div className="input-container">
              <div className="form-input multi-index">
                <label htmlFor="issn-isbn">ISSN/ISBN</label>
                <div className="radio-group four">
                  {ISSN_ISBN_OPTIONS.map(options => (
                    <label key={options.value} style={{paddingLeft: '8px'}}>
                      <input
                        type="radio"
                        name="issn-isbn-type"
                        value={options.value}
                        checked={ISSN_ISBNPrefix === options.value}
                        onChange={(e) => {
                          setISSN_ISBNPrefix(options.value);
                          
                          const length =
                            options.value === "ISSN" || options.value === "E-ISSN"
                              ? 8
                              : 13;
                          setDigits(Array(length).fill(""));
                        }} 
                      />
                      {options.label}
                    </label>
                  ))}
                </div>

                <div className="issn-isbn-container">
                  <span className="issn-isbn-prefix">{ISSN_ISBNPrefix || 'ISSN'} Code : </span>
                  <div className="issn-isbn-input">
                    {ACTIVE_GROUPS.map((groupSize, index) => {
                      const start = ACTIVE_GROUPS.slice(0, index).reduce((a, b) => a + b, 0);
                      return (
                        <span key={index}>
                          {Array.from({length: groupSize}).map((_, i) => {
                            const pos = start + i;
                            return (
                              <input
                                key={pos}
                                id={`digit-${pos}`}
                                className="digit-input"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={1}
                                placeholder="*"
                                value={digits[pos] ?? ''}
                                onMouseDown={(e) => {
                                  if (pos !== 0) {
                                    e.preventDefault();
                                    const first = document.getElementById('digit-0');
                                    if (first) first.focus();
                                  }
                                }}
                                onChange={(e) => {
                                  //always take the last digit typed
                                  const valStr = e.target.value.replace(/\D/g, "").slice(-1);
                                  const val = valStr ? Number(valStr) : null;

                                  const newDigits = [...digits];
                                  newDigits[pos] = val;
                                  setDigits(newDigits);

                                  // auto‑jump forward
                                  if (val && pos < digits.length - 1) {
                                    const next = document.getElementById(`digit-${pos + 1}`);
                                    if (next) next.focus();
                                  }
                                }}
                                onKeyDown={(e) => codeControl(e, pos)}
                              />
                            );
                          })}
                          {index < ACTIVE_GROUPS.length - 1 && <span>-</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* VOLLUME & ISSUE NO. */}
            <div className="input-container">
              <div className="grouped-inputs">
                <div className="grouped-input-container flex">
                  <div className="form-input vi">
                    <div className="vi-input">
                      <span className="vi-prefix">Volume&nbsp;No. </span>
                      <input
                        name="vi-input"
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        value={formData.volume_no}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setFormData(prev => (
                            {...prev, volume_no: val}
                          ));
                        }}
                        placeholder="**"
                      />
                    </div>
                  </div>

                  <div className="form-input vi">
                    <div className="vi-input">
                      <span className="vi-prefix">Issue&nbsp;No. </span>
                      <input
                        name="vi-input"
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        value={formData.issue_no}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setFormData(prev => (
                            {...prev, issue_no: val}
                          ));
                        }}
                        placeholder="**"
                      />
                    </div>
                  </div>
                </div>
                <label htmlFor="vi-input">Volume & Issue No.</label>
              </div>
            </div>

            {/* INDEX */}
            <div className="input-container last">
              <div className="form-input">
                <label htmlFor="index">Index</label>
                <CreatableSelect
                  isMulti
                  name="index"
                  isLoading={indexLoading}
                  value={selectedOptions.index_type || []}
                  options={[
                    {label: 'Fetched Indexes', options: indexOptions || []}
                  ]}
                  onChange={(selected) => {
                    setSelectedOptions(prev => (
                      {...prev, index_type: selected}
                    ));
                    setFormData(prev => (
                      {...prev, index_type: selected ? selected.map(option => option.value) : []}
                    ));
                  }}
                  onInputChange={(inputValue) => setIndexSearchTerm(inputValue)}
                  formatCreateLabel={(inputValue) => `Create Index: ${inputValue}`}
                  createOptionPosition="first"
                  placeholder='Type Indexing Services'
                  styles={reactSelect}
                  components={{ DropdownIndicator: () => null, IndicatorSeparator: () => null }}
                  menuIsOpen={(indexSearchTerm || '').trim() !== ''}
                />
              </div>
            </div>

            <div className="form-button-container submit">
              <button type="button" onClick={() => clearFields()}>Clear</button>
              <button type="submit">Add Research Publication</button>
            </div>
          </form>
        </>}
      </div>
      <div className="toast-box" id="toast-box"></div>
    </>
  )
}

export default AddPublication;