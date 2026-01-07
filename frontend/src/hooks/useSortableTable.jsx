import { useState, useMemo } from "react";

const useSortableTable = (data) => {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [hoveredColumn, setHoveredColumn] = useState(null);

  const handleSort = (column) => {
    if(sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const resetSort = () => { 
    setSortColumn(null); 
    setSortDirection('asc'); 
  };

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      let valA = a[sortColumn]; 
      let valB = b[sortColumn];

      if (sortColumn === 'date_presented' || sortColumn === 'end_date_presented') { 
        const dateA = new Date(valA); 
        const dateB = new Date(valB); 
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA; 
      }

      if (Array.isArray(valA) || Array.isArray(valB)) { 
        valA = Array.isArray(valA) ? valA.join(', ') : ''; 
        valB = Array.isArray(valB) ? valB.join(', ') : ''; 
      }

      valA = valA?.toString().toLowerCase() || ''; 
      valB = valB?.toString().toLowerCase() || '';

      return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [data, sortColumn, sortDirection]);

  return { sortedData, sortColumn, sortDirection, hoveredColumn, setHoveredColumn, handleSort, resetSort };
};

export default useSortableTable;