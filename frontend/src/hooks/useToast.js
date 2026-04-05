import { useState, useCallback } from 'react';

/**
 * useToast Custom Hook
 * Manages toast notifications for success/error messages
 * Provides methods to show, hide, and auto-dismiss toasts
 */

export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now();
        const toast = { id, message, type };

        setToasts(prev => [...prev, toast]);

        // Auto-dismiss after duration
        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    // Convenience methods
    const success = useCallback((message, duration = 3000) => {
        return addToast(message, 'success', duration);
    }, [addToast]);

    const error = useCallback((message, duration = 4000) => {
        return addToast(message, 'error', duration);
    }, [addToast]);

    const info = useCallback((message, duration = 3000) => {
        return addToast(message, 'info', duration);
    }, [addToast]);

    const warning = useCallback((message, duration = 3000) => {
        return addToast(message, 'warning', duration);
    }, [addToast]);

    return {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        info,
        warning,
    };
};

export default useToast;
