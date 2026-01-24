import React, { useRef, useState } from "react";

export default function SummaryModal({ isOpen, onClose, grouped, fields }) {
  if (!isOpen) return null;
  const modalRef = useRef(null);

  const [authorFilter, setAuthorFilter] = useState(""); 
  const [yearFilter, setYearFilter] = useState({ start: '', end: '' });

  const filteredGrouped = Object.entries(grouped).filter(([author, { rows }]) => {
    // Author filter
    if (authorFilter && !author.toLowerCase().includes(authorFilter.toLowerCase())) {
      return false;
    }

    // Year range filter (works for both academic_year and date-presented)
    if (yearFilter.start || yearFilter.end) {
      const matchesYear = rows.some(row => {
        let year;

        if (row["academic_year"]) {
          // academic_year stored as number/string
          year = parseInt(row["academic_year"], 10);
        } else if (row["date_presented"]) {
          // date-presented stored as full date
          year = new Date(row["date_presented"]).getFullYear();
        } else if (row['date_of_publication']) {
          const match = row.date_of_publication.match(/\b(20\d{2})\b/); 
          year = match ? parseInt(match[1], 10) : null;
        }

        if (!year) return false; // skip if no year found

        const afterStart = yearFilter.start ? year >= parseInt(yearFilter.start, 10) : true;
        const beforeEnd = yearFilter.end ? year <= parseInt(yearFilter.end, 10) : true;

        return afterStart && beforeEnd;
      });

      if (!matchesYear) return false;
    }

    return true;
  });




  const styles = { 
    overlay: { 
      position: "fixed", 
      top: 0, 
      left: 0, 
      width: "100%", 
      height: "100%", 
      backgroundColor: "rgba(0,0,0,0.5)", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      zIndex: 1000000,
    },
    contentContainer: {
      padding: 10,
      backgroundColor: "#fff",
      borderRadius: 4,
      boxShadow: "0 4px 8px rgba(0,0,0,0.2)", 
    },
    contentHead: {
      position: 'sticky',
      top: -20,
      backgroundColor: '#fff',
      height: '120px',
      borderBottom: '1px solid #ddd',
      zIndex: 100,
    }, 
    content: { 
      padding: "20px",
      maxWidth: "90vw",
      minWidth: "90vw", 
      width: "100%", 
      maxHeight: "90vh",
      minHeight: '90vh', 
      overflowY: "auto", 
      scrollbarWidth: 'thin',
      position: 'relative', 
    },
    groupBlock: { 
      marginBottom: "20px", 
    },
    uniqueHeader: {
      position: 'sticky',
      top: 100,
      backgroundColor: '#fff',
      zIndex: 90,
      padding: '10px 0',
      borderBottom: '1px solid #ccc',
    }, 
    table: { 
      width: "100%", 
      borderCollapse: "collapse", 
      tableLayout: 'fixed',
    }, 
    th: { 
      border: "1px solid #ddd", 
      padding: "8px", 
      backgroundColor: "#f2f2f2", 
      textAlign: "left",
      position: 'sticky',
      top: 180,
      zIndex: 80, 
    }, 
    td: { 
      border: "1px solid #ddd", 
      padding: "8px",
      textAlign: 'left',
      wordWrap: 'break-word', 
    }, 
    closeButton: { 
      padding: "8px 12px", 
      backgroundColor: "transparent", 
      color: "#007bff", 
      border: "1px solid #007bff", 
      cursor: "pointer", 
    },
    numhead: {
      width: 50,
      border: "1px solid #ddd", 
      padding: "8px", 
      backgroundColor: "#f2f2f2", 
      textAlign: "left",
      position: 'sticky',
      top: 180,
      zIndex: 80,  
    },
    numbody: {
      width: '30px',
      border: "1px solid #ddd", 
      padding: "8px",
      textAlign: 'left',
      wordWrap: 'break-word', 
    },
    filterRow: { 
      marginBottom: "15px", 
      display: "flex", 
      gap: "10px", 
      alignItems: "center",
      justifyContent: 'space-between',
    },
    buttonContainer: {
      display: 'flex',
      gap: '10px',
    },
    closeModalButton: {
      position: 'absolute',
      top: 1,
      right: 1,
      padding: "8px 12px", 
      backgroundColor: "#ddd", 
      color: "#fff", 
      border: "none", 
      cursor: "pointer",
    },
    input: {
      padding: "8px 12px", 
      cursor: "pointer",
      width: '400px',
      outline: 'none',
      border: '1px solid black',
      marginRight: 10,
    },
    inputYear: {
      padding: '8px 12px',
      cursor: 'pointer',
      width: 100,
      outline: 'none',
      border: '1px solid black',
      marginRight: 10,
    },
    p: {
      textAlign: 'center',
    },
  };

  const handlePrint = () => { 
    const printContents = modalRef.current.innerHTML; 
    const printWindow = window.open("", "", "width=800,height=600"); 
    printWindow.document.write(` 
      <html> 
        <head> 
        <title>Print Report Summary</title> 
          <style>
          * {
            font-family: Arial;
          } 
            table { 
              border-collapse: collapse; 
              width: 100%; 
            } 
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left; 
            } 
            th { 
              background-color: #f2f2f2; 
            } 
          </style> 
        </head> 
        <body>${printContents}</body> 
      </html> 
    `); 
    printWindow.document.close(); 
    printWindow.print(); 
  };

  const handleExportCSV = () => { 
    let csvRows = []; // Header row: numbering + fields 
    Object.entries(grouped).forEach(([key, { rows }]) => { 
      csvRows.push(`Author: ${key}`);
      csvRows.push(["#", ...fields].join(","));
      rows.forEach((row, idx) => { 
        const values = fields.map((field) => { 
          const val = Array.isArray(row[field]) ? row[field].join("; ") : row[field]; // Escape commas/quotes 
          return `"${String(val).replace(/"/g, '""')}"`; 
        }); 
        csvRows.push([idx + 1, ...values].join(",")); 
      }); 
      csvRows.push("");
    }); // Create CSV blob 
    const csvString = csvRows.join("\n"); 
    const blob = new Blob([csvString], { type: "text/csv" }); 
    const url = URL.createObjectURL(blob); // Trigger download 
    const a = document.createElement("a"); 
    a.href = url; 
    a.download = "Report Summary.csv"; 
    a.click(); 
    URL.revokeObjectURL(url); };

  return ( 
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.contentContainer}>
        <div style={styles.content} ref={modalRef} onClick={(e) => e.stopPropagation()}>
          <style> {`@media print { th {-webkit-print-color-adjust: exact; print-color-adjust: exact;} .content-head { display: none; } }`} </style>
          <div className='content-head' style={styles.contentHead}>
            <h1 style={{textDecoration: 'underline'}}>Report Count Produced</h1>
            <button style={styles.closeModalButton} onClick={onClose}>Close</button>

            <div style={styles.filterRow}>
              <div>
                <input type="text" placeholder="Search..." style={styles.input} value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)} />
                <input type="number" placeholder="Start Year" style={styles.inputYear} value={yearFilter.start} onChange={(e) => setYearFilter({ ...yearFilter, start: e.target.value })} />
                <input type="number" placeholder="End Year" style={styles.inputYear} value={yearFilter.end} onChange={(e) => setYearFilter({ ...yearFilter, end: e.target.value })}/>
              </div>
              
              <div style={styles.buttonContainer}>
                <button style={styles.closeButton} onClick={handlePrint}>Print</button> 
                <button style={styles.closeButton} onClick={handleExportCSV}>Save as CSV</button>    
              </div>
            </div> 

          </div>
          {filteredGrouped.length > 0 ? (
            filteredGrouped.map(([key, { count, rows }]) => (
              <React.Fragment key={key}> 
                <div key={key} style={styles.groupBlock}>
                  <div style={styles.uniqueHeader}>
                    <h3>{key} | Produce Paper Count: {count}</h3> 
                  </div>
                  <table style={styles.table}> 
                    <thead>
                      <tr> 
                        <th style={styles.numhead}>#</th>
                        {fields.map((field) => ( 
                          <th key={field} style={styles.th}>{field}</th> 
                        ))} 
                      </tr> 
                    </thead> 
                    <tbody> 
                      {rows.map((row, idx) => ( 
                        <tr key={idx}>
                          <td style={styles.numbody}>{idx + 1}</td> 
                          {fields.map((field) => ( 
                            <td key={field} style={styles.td}>
                              {field === "acdemic_year" && row[field]
                                ? new Date(row[field]).getFullYear()
                                : field === 'date_presented' && row[field]
                                  ? new Date(row[field]).toLocaleDateString("en-US", {
                                      month: "long",   // "January"
                                      day: "numeric",  // "24"
                                      year: "numeric", // "2026"
                                    })
                                  : Array.isArray(row[field])
                                    ? row[field].join(", ")
                                    : row[field]}
                            </td>
                          ))} 
                        </tr> 
                      ))} 
                    </tbody> 
                  </table> 
                </div>
                <hr />
              </React.Fragment> 
            ))
          ) : (
            <React.Fragment>
              <p style={styles.p}>Nothing found...</p>
            </React.Fragment>
          )}        
        </div> 
      </div>
    </div> 
  );
}
