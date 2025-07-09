import { useMemo, useState } from 'react';

// Helper function to access nested values
const getNestedValue = (obj, key) => {
  if (!key || typeof key !== 'string') return '';
  return key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : ''), obj);
};

const useSearch = (data, searchKeys) => {
  // Initialize searchQuery based on searchKeys type
  const initialQuery = typeof searchKeys === 'object' ? {} : '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  const filteredData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    // Case 1: Single string key (e.g., 'full_name')
    if (typeof searchKeys === 'string') {
      if (!searchQuery) return data;
      return data.filter((item) => {
        const value = getNestedValue(item, searchKeys);
        return value
          ?.toString()
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      });
    }

    // Case 2: Object of keys (e.g., { city_id: 'region.city_id', region_id: 'region.id' })
    if (typeof searchKeys === 'object' && searchKeys !== null) {
      if (!Object.keys(searchQuery).length) return data;
      return data.filter((item) => {
        return Object.entries(searchQuery).every(([key, value]) => {
          if (!value) return true; // Ignore empty search values
          const itemValue = getNestedValue(item, searchKeys[key] || key);
          return itemValue
            ?.toString()
            .toLowerCase()
            .includes(value.toString().toLowerCase());
        });
      });
    }

    // Fallback: Return original data if searchKeys is invalid
    return data;
  }, [data, searchQuery, searchKeys]);

  return { searchQuery, setSearchQuery, filteredData };
};

export default useSearch;