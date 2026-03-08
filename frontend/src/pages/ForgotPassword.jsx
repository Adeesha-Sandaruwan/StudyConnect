import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            const response = await api.post('/users/forgotpassword', { email });
            setMessage(response.data.message || 'Email sent successfully. Please check your inbox.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#eef2f6] p-4 sm:p-8 font-sans">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8 sm:p-10 transform transition-all">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight mb-2">Reset Password</h1>
                    <p className="text-sm text-gray-500">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <div className={`w-full overflow-hidden transition-all duration-300 ease-out ${error ? 'max-h-24 opacity-100 mb-6 scale-100' : 'max-h-0 opacity-0 mb-0 scale-95'}`}>
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded shadow-sm flex justify-between items-center">
                        <span className="font-semibold text-sm">{error}</span>
                        <button type="button" onClick={() => setError('')} className="text-red-700 font-bold text-lg hover:text-red-900 transition-colors focus:outline-none">&times;</button>
                    </div>
                </div>

                <div className={`w-full overflow-hidden transition-all duration-300 ease-out ${message ? 'max-h-24 opacity-100 mb-6 scale-100' : 'max-h-0 opacity-0 mb-0 scale-95'}`}>
                    <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-3 rounded shadow-sm flex justify-between items-center">
                        <span className="font-semibold text-sm">{message}</span>
                        <button type="button" onClick={() => setMessage('')} className="text-green-700 font-bold text-lg hover:text-green-900 transition-colors focus:outline-none">&times;</button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
                    <div className="relative group">
                        <input 
                            type="email" 
                            placeholder="Email Address" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-gray-50 border border-gray-200 text-base md:text-sm px-4 py-3.5 rounded-lg w-full outline-none focus:ring-2 focus:ring-[#5b7cfa] hover:border-gray-300 transition-all duration-200 shadow-sm"
                        />
                        <svg className="absolute right-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-[#5b7cfa] transition-colors duration-200" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={`w-full bg-[#5b7cfa] text-white rounded-lg py-3.5 font-bold shadow-md transition-all duration-200 ease-out focus:ring-4 focus:ring-blue-300 flex justify-center items-center ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#4a6be0] hover:shadow-[0_8px_15px_rgba(91,124,250,0.4)] hover:-translate-y-0.5 active:scale-95 active:translate-y-0'}`}
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            'Send Reset Link'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button 
                        onClick={() => navigate('/login')}
                        className="text-sm font-bold text-[#5b7cfa] hover:text-[#4a6be0] transition-colors"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;