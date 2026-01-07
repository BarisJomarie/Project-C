const PresentationPrint = (showModal, closeModal) => {
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

            .hid-th,
            .hid-td {
              visibility: visible;
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

export default PresentationPrint;