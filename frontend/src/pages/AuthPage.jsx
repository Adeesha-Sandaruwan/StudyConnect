import { useLocation, useNavigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';

const AuthPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const isSignUp = location.pathname === '/register';

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#eef2f6] p-4 font-sans">
            <div className="relative w-[900px] max-w-full h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden flex">
                
                <div className="w-1/2 h-full absolute top-0 left-0">
                    <Register />
                </div>

                <div className="w-1/2 h-full absolute top-0 right-0">
                    <Login />
                </div>

                <div 
                    className={`absolute top-0 w-1/2 h-full bg-[#5b7cfa] z-50 text-white flex flex-col items-center justify-center px-12 transition-all duration-700 ease-in-out transform ${
                        isSignUp ? 'translate-x-full rounded-l-[100px] rounded-r-3xl' : 'translate-x-0 rounded-r-[100px] rounded-l-3xl'
                    }`}
                >
                    <div className={`absolute inset-0 flex flex-col items-center justify-center px-12 transition-all duration-700 ease-in-out ${isSignUp ? 'opacity-0 pointer-events-none translate-x-[-20%]' : 'opacity-100 translate-x-0'}`}>
                        <h1 className="text-4xl font-bold mb-6">Hello, Welcome!</h1>
                        <p className="text-sm font-light mb-8 text-center">Don't have an account?</p>
                        <button 
                            onClick={() => navigate('/register')} 
                            className="border-2 border-white text-white rounded-full px-12 py-2.5 font-bold transition-all duration-300 hover:bg-white hover:text-[#5b7cfa] hover:scale-110 shadow-lg"
                        >
                            Register
                        </button>
                    </div>

                    <div className={`absolute inset-0 flex flex-col items-center justify-center px-12 transition-all duration-700 ease-in-out ${isSignUp ? 'opacity-100 translate-x-0' : 'opacity-0 pointer-events-none translate-x-[20%]'}`}>
                        <h1 className="text-4xl font-bold mb-6">Welcome Back!</h1>
                        <p className="text-sm font-light mb-8 text-center">Already have an account?</p>
                        <button 
                            onClick={() => navigate('/login')} 
                            className="border-2 border-white text-white rounded-full px-12 py-2.5 font-bold transition-all duration-300 hover:bg-white hover:text-[#5b7cfa] hover:scale-110 shadow-lg"
                        >
                            Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;