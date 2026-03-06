import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { validateLoginForm } from '../utils/validation';
import api from '../services/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState(null);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors(null);

        const validationErrors = validateLoginForm(email, password);
        if (validationErrors) {
            setFieldErrors(validationErrors);
            setError('Please fix the errors below.');
            return;
        }

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        }
    };

    const handleGoogleAuth = async () => {
        try {
            const res = await api.post('/users/google');
            console.log(res.data);
        } catch (err) {
            setError('Google authentication failed.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full px-14 bg-white">
            <h1 className="text-4xl font-extrabold mb-8 text-gray-800">Login</h1>
            
            <div className={`w-full absolute top-8 left-0 right-0 px-8 transition-all duration-500 ease-out transform ${error ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded shadow-md flex justify-between items-center">
                    <span className="font-semibold text-sm">{error}</span>
                    <button onClick={() => setError('')} className="text-red-700 font-bold">&times;</button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                <div className="relative">
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`bg-gray-100 border ${fieldErrors?.email ? 'border-red-500' : 'border-transparent'} text-sm px-4 py-3.5 rounded-lg w-full outline-none focus:ring-2 focus:ring-[#5b7cfa] transition-all`} 
                    />
                    <svg className="absolute right-4 top-3.5 w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>
                    {fieldErrors?.email && <span className="text-xs text-red-500 mt-1 ml-1 block">{fieldErrors.email}</span>}
                </div>

                <div className="relative">
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`bg-gray-100 border ${fieldErrors?.password ? 'border-red-500' : 'border-transparent'} text-sm px-4 py-3.5 rounded-lg w-full outline-none focus:ring-2 focus:ring-[#5b7cfa] transition-all`} 
                    />
                    <svg className="absolute right-4 top-3.5 w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
                    {fieldErrors?.password && <span className="text-xs text-red-500 mt-1 ml-1 block">{fieldErrors.password}</span>}
                </div>

                <div className="w-full flex justify-end">
                    <span className="text-xs font-semibold text-gray-500 hover:text-gray-800 cursor-pointer transition-colors">Forgot Password?</span>
                </div>

                <button type="submit" className="w-full bg-[#5b7cfa] text-white rounded-lg py-3.5 font-bold shadow-lg hover:bg-[#4a6be0] transform hover:-translate-y-0.5 transition-all">
                    Login
                </button>
            </form>

            <div className="w-full mt-8 flex flex-col items-center">
                <span className="text-xs text-gray-500 mb-4 font-semibold uppercase tracking-wider">or login with social platforms</span>
                <div 
                    onClick={handleGoogleAuth}
                    className="w-full max-w-[280px] bg-[#1a73e8] hover:bg-[#155ab6] text-white rounded-full flex items-center justify-between p-1 cursor-pointer transition-all shadow-md transform hover:scale-105"
                >
                    <div className="flex items-center pl-4 w-full">
                        <div className="flex flex-col items-start leading-tight">
                            <span className="text-[13px] font-semibold">Continue with Google</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-full p-2 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;