import React, { useRef, useState } from "react";

export default function SummaryModal({ isOpen, onClose, grouped, fields }) {
  if (!isOpen) return null;
  const modalRef = useRef(null);

  const [authorFilter, setAuthorFilter] = useState(""); 

  const filteredGrouped = Object.entries(grouped)
  .filter(([author]) => {
    // Author filter
    if (authorFilter && !author.toLowerCase().includes(authorFilter.toLowerCase())) {
      return false;
    }
    return true;
  })


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
    contentHead: {
      position: 'sticky',
      top: -20,
      backgroundColor: '#fff',
      height: '120px',
      borderBottom: '1px solid #ddd',
    }, 
    content: { 
      backgroundColor: "#fff", 
      padding: "20px",
      maxWidth: "90vw",
      minWidth: "300px", 
      width: "100%", 
      maxHeight: "90vh",
      minHeight: '50vh', 
      overflowY: "auto", 
      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
      scrollbarWidth: 'thin',
      position: 'relative', 
    },
    groupBlock: { 
      marginBottom: "20px", 
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
      width: '30px',
      border: "1px solid #ddd", 
      padding: "8px", 
      backgroundColor: "#f2f2f2", 
      textAlign: "left", 
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
    },
    buttonContainer: {
      display: 'flex',
      gap: '10px',
    },
    closeModalButton: {
      position: 'absolute',
      top: 5,
      right: 5,
      padding: "8px 12px", 
      backgroundColor: "#ddd", 
      color: "#fff", 
      border: "none", 
      cursor: "pointer",
    },
    input: {
      padding: "8px 12px", 
      backgroundColor: "#ddd",
      border: "none", 
      cursor: "pointer",
      width: '400px',
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
      <div style={styles.content} ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <style> {`@media print { th {-webkit-print-color-adjust: exact; print-color-adjust: exact;} .content-head { display: none; } }`} </style>
        <div className='content-head' style={styles.contentHead}>
          <h1 style={{textDecoration: 'underline'}}>Report Count</h1>
          <button style={styles.closeModalButton} onClick={onClose}>Close</button>
          <div style={styles.filterRow}>
            <input type="text" placeholder="Search..." style={styles.input} value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)} 
            />
            <div style={styles.buttonContainer}>
              <button style={styles.closeButton} onClick={handlePrint}>Print</button> 
              <button style={styles.closeButton} onClick={handleExportCSV}>Save as CSV</button>    
            </div>
          </div> 
        </div> 
        {filteredGrouped.map(([key, { count, rows }]) => (
          <React.Fragment key={key}> 
            <div key={key} style={styles.groupBlock}> 
              <h3>{key} | Produce Paper Count: {count}</h3> 
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
                          {field === "date-presented" && row[field]
                            ? new Date(row[field]).getFullYear()  
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
        ))} 
        
      </div> 
    </div> 
  );
}
