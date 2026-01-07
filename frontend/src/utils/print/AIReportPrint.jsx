import AIReport from "../../components/AIReport";

const AIReportPrint = (showModal, closeModal) => {
  showModal(
    'Printing AI Report',
    `This report will be printed. Do you want to continue?`,
    async () => {
      try {
        const printContents = document.getElementById('ai-report-body').innerHTML;
        if (!printContents) return;

        // Open a new window
        const printWindow = window.open('', '_blank', 'width=1200,height=800');
        // Write the report HTML into the new window
        printWindow.document.write(`
          <html>
            <head>
              <title>SDG Classification and Analytics Report</title>
              <style>
                body, div, p, h1, h2, h3, table, td, th, span, li, b, i {
                  font-family: Arial, sans-serif;
                }

                /* Print specific rules */
                @media print {
                  * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  @page {
                    size: A4 landscape;
                    margin: 1in 0.8in;
                  }

                  /* Hide everything except the report */
                  body * {
                    visibility: visible !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                  }

                  .ai-report-body, .ai-report-body * {
                    visibility: visible !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                  }

                  .ai-report-body {
                    position: absolute !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    left: 0;
                    top: 0;
                    width: 100% !important;
                    background: #fff !important;
                    color: #000 !important;
                    box-sizing: border-box;
                    border: none !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }

                  /* Keep header and start of table together */
                  .report-section {
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                  }

                  /* Allow table body to flow across pages */
                  .ai-report-body-table {
                    page-break-inside: auto !important;
                    break-inside: auto !important;
                  }

                  table {
                    border-collapse: separate !important;
                    border-spacing: 0 !important;
                    width: 100%;
                  }

                  td, th {
                    border: 1px solid black !important;
                    box-decoration-break: clone !important;
                    -webkit-box-decoration-break: clone !important;
                    padding: 6px !important;
                    font-size: 12pt !important;
                    vertical-align: top;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    background-color: inherit !important;
                  }

                  tr, td, th {
                    page-break-inside: auto !important;
                    break-inside: auto !important;
                  }

                  td p {
                    text-align: 'justify';
                  }

                  thead {
                    display: table-header-group !important;
                  }

                  tfoot {
                    display: table-footer-group !important;
                  }

                  .ai-report-body-inner {
                    padding: 40px 60px !important;
                  }
                }

                /* General styling (non-print specific) */
                .ai-report-body {
                  border-radius: 10px;
                  margin: 10px auto;
                  padding: 1in 0.8in;
                  background-color: #fff;
                  width: 90%;
                  white-space: pre-wrap;
                  page-break-inside: avoid;
                }

                .ai-text {
                  white-space: pre-line;
                }

                .ai-text p {
                  margin-left: 1rem;
                }

                .ai-report-body-inner {
                  padding: 94px 75px;
                  box-sizing: border-box;
                }

                .ai-report-body-header {
                  display: flex;
                  flex-direction: row;
                  justify-content: center;
                  align-items: center;
                  gap: 20px;
                }

                .ai-report-body-header.logo {
                  width: 100px;
                  height: auto;
                }

                .ai-report-body-header.logo img {
                  width: 100%;
                  height: auto;
                }

                .ai-report-body-header.text {
                  display: flex;
                  flex-direction: column;
                  gap: 0;
                }

                .ai-report-body-header.text i,
                .ai-report-body-header.text b,
                .ai-report-body-header h2 {
                  font-family: 'Arial', sans-serif;
                  margin: 0;
                }

                .ai-report-body-table table {
                  width: 100%;
                  border-collapse: collapse;
                  page-break-inside: auto;
                }

                .ai-report-body-table td,
                .ai-report-body-table th {
                  border: 1px solid black;
                  color: black;
                  padding: 6px;
                }

                .ai-report-body-footer {
                  display: flex;
                  flex-direction: column;
                  gap: 20px;
                  margin-top: 20px;
                }

                .ai-report-body-footer p {
                  margin: 0;
                }

                .ai-report-body-footer b {
                  display: inline-block;
                  margin-top: 5px;
                }

                .ai-report-body-footer b.b-header {
                  margin-bottom: 20px;
                }

                .markdown-body {
                  line-height: 1.3;
                }

                .markdown-body ul,
                .markdown-body ol {
                  margin-top: 0.2em;
                  margin-bottom: 0.2em;
                  padding-left: 1.2em;
                }

                .markdown-body ul ul,
                .markdown-body ol ol {
                  margin-top: 0;
                  margin-bottom: 0;
                }

                .markdown-body li p {
                  margin: 0;
                }

                /* Section header styling */
                .section-header {
                  font-weight: bold !important;
                  padding: 15px !important;
                  text-align: left !important;
                  background-color: #E5E4E2 !important;
                }

                @media print {
                  .section-header {
                    background-color: #E5E4E2 !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                  }
                  
                  .e-end {
                    margin-top: 20px;
                  }

                  .report-td-header {
                    padding: 20px !important;
                  }
                }
              </style>
            </head>
            <body>
            ${printContents}
            </body>
          </html>
        `);

        printWindow.document.close();

        // Wait until the content is fully loaded before printing
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();

          printWindow.onafterprint = () => {
            // Wait a bit after print dialog closes
            setTimeout(() => {
              showModal(
                'Printed Successfully',
                'Remember to save this report if satisfied. Thank you for using the system!'
              );
            }, 500);

            printWindow.close();
          };
        };

        addAuditLog({userData, token, action: 'Printed AI Report', actor_type: 'user' });
      } catch (err) {
        console.error("Error printing report:", err);
        showToast("error", "Print Error", "Something went wrong while printing."); 
      } finally {
        closeModal();
      }
    },
    'Print Report'
  );
};

export default AIReportPrint;