import { createContext, useState, useCallback } from 'react';
import useStudentRequests from '../hooks/useStudentRequests';

/**
 * StudentRequestContext
 * Shared context for student request state across app
 * Provides centralized state management for requests
 */

export const StudentRequestContext = createContext();

export const StudentRequestProvider = ({ children }) => {
    const [activeMode, setActiveMode] = useState('my-requests');
    
    const requestsState = useStudentRequests(activeMode);

    const value = {
        activeMode,
        setActiveMode,
        ...requestsState,
    };

    return (
        <StudentRequestContext.Provider value={value}>
            {children}
        </StudentRequestContext.Provider>
    );
};

export default StudentRequestContext;
