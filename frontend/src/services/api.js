import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    withCredentials: true
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // FIX: Added the root Homepage ('/') to the exact match list
        const publicPaths = ['/login', '/register', '/'];
        const currentPath = window.location.pathname;

        // FIX: Added .startsWith() to safely catch dynamic reset-password tokens
        const isPublicPath = 
            publicPaths.includes(currentPath) || 
            currentPath.startsWith('/resetpassword') || 
            currentPath.startsWith('/reset-password') ||
            currentPath.startsWith('/forgot-password');

        if (error.response && error.response.status === 401 && !isPublicPath) {
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;