import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useSelector } from 'react-redux';

const ExportButtons = () => {
  const truthTable = useSelector((state) => state.truthTable);
  const variables = useSelector((state) => state.variables);

  const exportPDF = () => {
    const input = document.querySelector('.container');
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('truth-table.pdf');
    });
  };

  const exportCSV = () => {
    if (!truthTable || truthTable.length === 0) {
      alert('No truth table data to export.');
      return;
    }

    const csvHeaders = [...variables, 'Result'].join(',');
    const csvRows = truthTable.map((row) =>
      [...variables.map((varName) => (row[varName] ? 'T' : 'F')), row.result === true ? 'T' : row.result === false ? 'F' : 'Error'].join(',')
    );
    const csvContent = [csvHeaders, ...csvRows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'truth-table.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="export-buttons">
      <button onClick={exportPDF}>Export as PDF</button>
      <button onClick={exportCSV}>Export as CSV</button>
    </div>
  );
};

export default ExportButtons;