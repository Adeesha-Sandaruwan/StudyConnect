import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    withCredentials: true
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const publicPaths = ['/login', '/register'];
        const isPublicPath = publicPaths.includes(window.location.pathname);

        if (error.response && error.response.status === 401 && !isPublicPath) {
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;