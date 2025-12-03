import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios";
import Loading from "../utils/Loading";
import '../styles/style.css'
import '../styles/paperPage.css'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const ResearchPaperPage = () => {
  const { dep_id, paper_id } = useParams();

  const [loading, setLoading] = useState();
  const [paper, setPaper] = useState();
  const [chartData, setChartData] = useState([]);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

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

  const fetchPaper = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/users/research-paper/${paper_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const paperData = response.data;

      let scores = paperData.confidence_scores;
      let researchers = paperData.researchers;
      let sdg_labels = paperData.sdg_labels;

      // Parse if stringified JSON
      if (typeof scores === "string") {
        try {
          scores = JSON.parse(scores);
        } catch {}
      }

      if (typeof researchers === "string") {
        try {
          researchers = JSON.parse(researchers);
        } catch {}
      }

      if (typeof sdg_labels === "string") {
        try {
          const parsed = JSON.parse(sdg_labels);
          sdg_labels = Array.isArray(parsed) ? parsed : [sdg_labels];
        } catch {
          sdg_labels = [sdg_labels]; // wrap plain string
        }
      }

      const formattedData = Object.keys(scores).map((key, index) => ({
        sdg: sdgOptions[key],
        confidence: scores[key],
        fill: sdgColors[index],
      }));

      setChartData(formattedData);
      setPaper({ ...paperData, researchers, sdg_labels });
    } catch (err) {
      console.error("Error fetching paper", err);
      showToast("Failed to load research paper.", "error");
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchPaper();
  }, []);


  return (
    <>
      {loading && <Loading text="Setting up..."/>}
      <div className="hyperlink" style={{textDecoration: 'underline'}} onClick={() => navigate(-1)}>Go Back</div>
        <div className="paper-container">
          <div className="main1">
            <h1>{paper?.research_title}</h1>
            {paper?.researchers && (
              <p><strong>Researchers:</strong> {paper.researchers.join(', ')}</p>
            )}
            <h2>Abstract</h2>
            <p>{paper?.research_abstract}</p>
            <h2>Keywords</h2>
            <p>{paper?.research_conclusion}</p>
          </div>
          <div className="rightsidebar1">
            <h4>Paper Details</h4>
            <div className="rightsidebar1 info1">
              <label>Type  </label>
              <p>{paper?.research_type === 'student' ? 'Student Thesis' : paper?.research_type === 'faculty' ? 'Faculty Research' : 'Unknown'}</p>
            </div>
            <div className="rightsidebar1 info1">
            <label>SDG</label>
              <ul>
                {paper?.sdg_labels && paper.sdg_labels.length > 0 ? (
                  paper.sdg_labels.map((r, index) => (
                    <li key={index}>{r}</li>
                  ))
                ) : (
                  <li>No SDG labels found.</li>
                )}
              </ul>
            </div>
            <div className="rightsidebar1 info1">
              <label>Researchers</label>
              <ul>
                {paper?.researchers && paper.researchers.length > 0 ? (
                  paper.researchers.map((r, index) => (
                    <li key={index}>{r}</li>
                  ))
                ) : (
                  <li>No researchers listed.</li>
                )}
              </ul>
            </div>
            <div className="rightsidebar1 info1">
              {paper?.research_type === "faculty" ? (
                <>
                  <label>Funding Source (if any)</label>
                  <p>{paper?.funding_source ? paper.funding_source : "Not specified"}</p>
                </>
              ) : (
                <>
                  <label>Adviser</label>
                  <p>{paper?.adviser ? paper.adviser : "Not specified"}</p>
                </>
              )}
            </div>
            <div className="rightsidebar1 info1">
              <label>Uploaded by</label>
              <div className="hyperlink" onClick={() => navigate(`/user/users/${paper?.uploaded_by}`)}><p>{paper?.uploader_name}</p></div>
            </div>
          </div>
      </div>
      <div className="sdg-graph">
        <h1 className="chart-title">Confidence Scores by SDG</h1>
        <div className="sdg-graph" style={{ width: '100%', height: '400px' }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray='3 3'/>
              <XAxis dataKey='sdg' angle={-45} textAnchor="end" interval={0} height={120} tick={{fontSize: 12}}/>
              <YAxis/>
              <Tooltip/>
              <Bar dataKey='confidence' radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}

export default ResearchPaperPage;