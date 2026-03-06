import { useLocation, useNavigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';

const AuthPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const isSignUp = location.pathname === '/register';

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#eef2f6] p-4 sm:p-8 font-sans overflow-hidden">
            <div className="relative w-full max-w-[950px] min-h-[600px] md:min-h-[650px] bg-white rounded-3xl shadow-2xl overflow-hidden flex">
                
                <div 
                    className={`w-full md:w-1/2 h-full absolute top-0 md:left-0 transition-transform duration-300 ease-out z-10 ${
                        isSignUp ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
                >
                    <Register />
                </div>

                <div 
                    className={`w-full md:w-1/2 h-full absolute top-0 md:right-0 transition-transform duration-300 ease-out z-10 ${
                        isSignUp ? 'translate-x-full md:translate-x-0' : 'translate-x-0'
                    }`}
                >
                    <Login />
                </div>

                <div 
                    className={`hidden md:flex absolute top-0 w-1/2 h-full bg-[#5b7cfa] z-50 text-white flex-col items-center justify-center px-12 transition-all duration-500 ease-in-out transform shadow-2xl ${
                        isSignUp ? 'translate-x-full rounded-l-[100px] rounded-r-3xl' : 'translate-x-0 rounded-r-[100px] rounded-l-3xl'
                    }`}
                >
                    <div className={`absolute inset-0 flex flex-col items-center justify-center px-12 transition-all duration-300 ease-out ${isSignUp ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}>
                        <h1 className="text-4xl font-bold mb-6">Hello, Welcome!</h1>
                        <p className="text-sm font-light mb-8 text-center">Don't have an account?</p>
                        <button 
                            onClick={() => navigate('/register')} 
                            className="border-2 border-white text-white rounded-full px-12 py-2.5 font-bold transition-all duration-200 hover:bg-white hover:text-[#5b7cfa] shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)] focus:outline-none active:scale-90 hover:scale-105"
                        >
                            Register
                        </button>
                    </div>

                    <div className={`absolute inset-0 flex flex-col items-center justify-center px-12 transition-all duration-300 ease-out ${isSignUp ? 'opacity-100 scale-100' : 'opacity-0 pointer-events-none scale-95'}`}>
                        <h1 className="text-4xl font-bold mb-6">Welcome Back!</h1>
                        <p className="text-sm font-light mb-8 text-center">Already have an account?</p>
                        <button 
                            onClick={() => navigate('/login')} 
                            className="border-2 border-white text-white rounded-full px-12 py-2.5 font-bold transition-all duration-200 hover:bg-white hover:text-[#5b7cfa] shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)] focus:outline-none active:scale-90 hover:scale-105"
                        >
                            Login
                        </button>
                    </div>
                </div>
                
                <div className="md:hidden absolute bottom-6 left-0 right-0 flex justify-center z-50">
                    <button 
                        onClick={() => navigate(isSignUp ? '/login' : '/register')}
                        className="text-sm font-bold text-[#5b7cfa] hover:text-[#4a6be0] transition-colors"
                    >
                        {isSignUp ? 'Already have an account? Login' : "Don't have an account? Register"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;