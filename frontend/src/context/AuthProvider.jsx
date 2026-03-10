import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';
import Loader from '../components/Loader';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await api.get('/users/me');
                setUser(response.data.user || response.data);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentUser();
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/users/login', { email, password });
        setUser(response.data.user || response.data);
        
        let hasProfile = false;
        try {
            await api.get('/profiles/me');
            hasProfile = true;
        } catch {
            hasProfile = false;
        }
        
        return { ...response.data, hasProfile };
    };

    const register = async (userData) => {
        const response = await api.post('/users/register', userData);
        setUser(response.data.user || response.data);
        return { ...response.data, hasProfile: false };
    };

    const logout = async () => {
        await api.post('/users/logout');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {loading ? <Loader text="Authenticating..." /> : children}
        </AuthContext.Provider>
    );
};