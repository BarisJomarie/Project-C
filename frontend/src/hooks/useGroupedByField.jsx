import { useMemo, useState } from "react";

export function useGroupedByField(data, field = "author") {
  const [isOpen, setIsOpen] = useState(false);

  const grouped = useMemo(() => {
    return data.reduce((acc, item) => {
      const value = item[field];

      // Case 1: array of names
      if (Array.isArray(value)) {
        value.forEach(name => {
          const key = String(name).trim();
          if (!acc[key]) acc[key] = { count: 0, rows: [] };
          acc[key].count++;
          acc[key].rows.push(item);
        });
      }
      // Case 2: single string
      else if (typeof value === "string") {
        const key = value.trim();
        if (!acc[key]) acc[key] = { count: 0, rows: [] };
        acc[key].count++;
        acc[key].rows.push(item);
      }
      // Case 3: object with main + co_authors
      else if (value && typeof value === "object") {
        const names = [value.main, ...(value.co_authors || [])];
        names.forEach(name => {
          const key = String(name).trim();
          if (!acc[key]) acc[key] = { count: 0, rows: [] };
          acc[key].count++;
          acc[key].rows.push(item);
        });
      }

      return acc;
    }, {});
  }, [data, field]);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    grouped,
  };
}
