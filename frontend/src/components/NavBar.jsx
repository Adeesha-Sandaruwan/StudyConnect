import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';


const NavLinks = ({ homeLink, currentPath, closeMenu, unreadCount, userRole }) => (
    <>
        <Link to="/" className={`font-bold transition-colors ${currentPath === '/' ? 'text-[#5b7cfa]' : 'text-gray-600 hover:text-[#5b7cfa]'}`} onClick={closeMenu}>
            Home
        </Link>

        <Link to={homeLink} className={`font-bold transition-colors ${currentPath === homeLink ? 'text-[#5b7cfa]' : 'text-gray-600 hover:text-[#5b7cfa]'}`} onClick={closeMenu}>
            Dashboard
        </Link>

        {/* Student Links */}
        {userRole === 'student' && (
            <>
                <Link to="/student-requests" className={`font-bold transition-colors ${currentPath === '/student-requests' ? 'text-[#5b7cfa]' : 'text-gray-600 hover:text-[#5b7cfa]'}`} onClick={closeMenu}>
                    My Requests
                </Link>
                <Link to="/browse-requests" className={`font-bold transition-colors ${currentPath === '/browse-requests' ? 'text-[#5b7cfa]' : 'text-gray-600 hover:text-[#5b7cfa]'}`} onClick={closeMenu}>
                    Browse
                </Link>
            </>
        )}

        {/* Tutor Links */}
        {userRole === 'tutor' && (
            <>
                <Link to="/tutor/my-requests" className={`font-bold transition-colors ${currentPath === '/tutor/my-requests' ? 'text-[#5b7cfa]' : 'text-gray-600 hover:text-[#5b7cfa]'}`} onClick={closeMenu}>
                    My Assignments
                </Link>
                <Link to="/tutor/available-requests" className={`font-bold transition-colors ${currentPath === '/tutor/available-requests' ? 'text-[#5b7cfa]' : 'text-gray-600 hover:text-[#5b7cfa]'}`} onClick={closeMenu}>
                    Available
                </Link>
            </>
        )}

        {/* Admin Links */}
        {userRole === 'admin' && (
            <Link to="/admin/requests" className={`font-bold transition-colors ${currentPath === '/admin/requests' ? 'text-[#5b7cfa]' : 'text-gray-600 hover:text-[#5b7cfa]'}`} onClick={closeMenu}>
                Manage Requests
            </Link>
        )}

        {/* Common Links */}
        <Link to="/posts" className={`font-bold transition-colors ${currentPath === '/posts' ? 'text-[#5b7cfa]' : 'text-gray-600 hover:text-[#5b7cfa]'}`} onClick={closeMenu}>
            Study Posts
        </Link>

        {/* ✅ FEEDBACK LINK ADDED */}
        <Link 
            to="/feedbacks" 
            className={`font-bold transition-colors ${
                currentPath === '/feedbacks'
                    ? 'text-[#5b7cfa]'
                    : 'text-gray-600 hover:text-[#5b7cfa]'
            }`}
            onClick={closeMenu}
        >
            Feedbacks
        </Link>

        {/* Notifications */}
        <Link to="/notifications" className={`relative font-bold transition-colors flex items-center gap-1.5 ${currentPath === '/notifications' ? 'text-[#5b7cfa]' : 'text-gray-600 hover:text-[#5b7cfa]'}`} onClick={closeMenu}>
            Notifications
            {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </Link>

        <Link to="/profile" className={`font-bold transition-colors ${currentPath === '/profile' ? 'text-[#5b7cfa]' : 'text-gray-600 hover:text-[#5b7cfa]'}`} onClick={closeMenu}>
            Profile
        </Link>
    </>
);

const NavBar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (user) {
            const fetchUnreadCount = async () => {
                try {
                    const res = await api.get('/notifications');
                    const unread = res.data.filter(n => !n.isRead).length;
                    setUnreadCount(unread);
                } catch (error) {
                    console.error('Failed to fetch unread count', error);
                }
            };
            fetchUnreadCount();
        }
    }, [user, location.pathname]);

    const hideOnPaths = ['/login', '/register', '/onboarding', '/forgot-password'];
    if (!user || hideOnPaths.some(path => location.pathname.startsWith(path))) {
        return null;
    }

    const homeLink =
        user.role === 'admin'
            ? '/admin'
            : user.role === 'tutor'
            ? '/tutor-dashboard'
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
                    
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="text-2xl font-extrabold text-[#5b7cfa] tracking-tight">
                            StudyConnect
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        <NavLinks
                            homeLink={homeLink}
                            currentPath={location.pathname}
                            closeMenu={() => setIsMobileMenuOpen(false)}
                            unreadCount={unreadCount}
                            userRole={user.role}
                        />

                        <div className="border-l border-gray-200 h-6 mx-2"></div>

                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wide">
                                {user.role}
                            </span>

                            <button
                                onClick={handleLogout}
                                className="bg-red-50 text-red-600 font-bold px-4 py-2 rounded-xl hover:bg-red-100 transition-colors text-sm"
                            >
                                Logout
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-gray-500 hover:text-[#5b7cfa] p-2"
                        >
                            ☰
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t shadow-lg absolute w-full left-0">
                    <div className="px-4 pt-2 pb-6 space-y-4 flex flex-col">
                        <NavLinks
                            homeLink={homeLink}
                            currentPath={location.pathname}
                            closeMenu={() => setIsMobileMenuOpen(false)}
                            unreadCount={unreadCount}
                            userRole={user.role}
                        />

                        <div className="border-t pt-4 flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase">
                                Logged in as {user.role}
                            </span>

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