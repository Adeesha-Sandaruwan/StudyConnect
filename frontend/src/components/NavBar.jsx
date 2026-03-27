import { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const NavLinks = ({ homeLink, currentPath, closeMenu }) => (
    <>
        <Link to={homeLink} className={`font-bold transition-colors ${currentPath === homeLink ? 'text-[#5b7cfa]' : 'text-gray-600 hover:text-[#5b7cfa]'}`} onClick={closeMenu}>Dashboard</Link>
        <Link to="/posts" className={`font-bold transition-colors ${currentPath === '/posts' ? 'text-[#5b7cfa]' : 'text-gray-600 hover:text-[#5b7cfa]'}`} onClick={closeMenu}>Study Posts</Link>
        <Link to="/notifications" className={`font-bold transition-colors ${currentPath === '/notifications' ? 'text-[#5b7cfa]' : 'text-gray-600 hover:text-[#5b7cfa]'}`} onClick={closeMenu}>Notifications</Link>
        <Link to="/profile" className={`font-bold transition-colors ${currentPath === '/profile' ? 'text-[#5b7cfa]' : 'text-gray-600 hover:text-[#5b7cfa]'}`} onClick={closeMenu}>Profile</Link>
    </>
);

const NavBar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const hideOnPaths = ['/login', '/register', '/onboarding', '/forgot-password'];
    if (!user || hideOnPaths.some(path => location.pathname.startsWith(path))) {
        return null; 
    }

    const homeLink = user.role === 'admin' ? '/admin' 
                   : user.role === 'tutor' ? '/tutor-dashboard' 
                   : '/student-dashboard';

    const handleLogout = async () => {
        try {
            await api.post('/users/logout');
            logout(); 
            navigate('/login');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to={homeLink} className="text-2xl font-extrabold text-[#5b7cfa] tracking-tight">
                            StudyConnect
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center space-x-8">
                        <NavLinks homeLink={homeLink} currentPath={location.pathname} closeMenu={() => setIsMobileMenuOpen(false)} />
                        <div className="border-l border-gray-200 h-6 mx-2"></div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wide">
                                {user.role}
                            </span>
                            <button onClick={handleLogout} className="bg-red-50 text-red-600 font-bold px-4 py-2 rounded-xl hover:bg-red-100 transition-colors text-sm">
                                Logout
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center md:hidden">
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-500 hover:text-[#5b7cfa] focus:outline-none p-2">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isMobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full left-0">
                    <div className="px-4 pt-2 pb-6 space-y-4 flex flex-col">
                        <NavLinks homeLink={homeLink} currentPath={location.pathname} closeMenu={() => setIsMobileMenuOpen(false)} />
                        <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Logged in as {user.role}</span>
                            <button onClick={handleLogout} className="text-red-600 font-bold text-sm">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default NavBar;