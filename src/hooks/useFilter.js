import { useState, useCallback } from 'react';

/**
 * Custom hook for managing filter state
 * @param {Array} data - Initial data array to filter
 * @param {Object} initialFilters - Initial filter state
 * @returns {Object} - { filteredData, filters, setFilters, addFilter, removeFilter, clearFilters }
 */
const useFilter = (data = [], initialFilters = {}) => {
    const [filters, setFilters] = useState(initialFilters);

    // Apply filters to data
    const filteredData = useCallback(() => {
        if (!Array.isArray(data)) return [];
        
        return data.filter(item => {
            for (const [key, value] of Object.entries(filters)) {
                if (!value) continue; // Skip empty filters

                const itemValue = String(item[key] || '').toLowerCase();
                const filterValue = String(value).toLowerCase();

                // Supports partial match
                if (!itemValue.includes(filterValue)) {
                    return false;
                }
            }
            return true;
        });
    }, [data, filters]);

    // Update a single filter
    const updateFilter = useCallback((key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    }, []);

    // Add multiple filters
    const addFilters = useCallback((newFilters) => {
        setFilters(prev => ({
            ...prev,
            ...newFilters
        }));
    }, []);

    // Remove a specific filter
    const removeFilter = useCallback((key) => {
        setFilters(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });
    }, []);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setFilters({});
    }, []);

    return {
        filteredData: filteredData(),
        filters,
        setFilters,
        updateFilter,
        addFilters,
        removeFilter,
        clearFilters,
        hasActiveFilters: Object.values(filters).some(v => v)
    };
};

export default useFilter;