import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';


const isActivePath = (currentPath, path, exact = false) => {
    if (exact) {
        return currentPath === path;
    }
    return currentPath === path || currentPath.startsWith(`${path}/`);
};

const getNavItemClass = (isActive, mobile = false) => {
    if (mobile) {
        return `rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-all ${
            isActive
                ? 'bg-[#eef2ff] text-[#4460d8] shadow-sm'
                : 'text-gray-700 hover:bg-gray-100 hover:text-[#4460d8]'
        }`;
    }

    return `relative py-2 text-[15px] font-semibold transition-colors ${
        isActive ? 'text-[#4460d8]' : 'text-gray-600 hover:text-[#4460d8]'
    }`;
};


const NavLinks = ({ homeLink, currentPath, closeMenu, unreadCount, userRole, mobile = false }) => {
    const links = [
        { to: '/', label: 'Home', exact: true },
        { to: homeLink, label: 'Dashboard' },
    ];

    if (userRole === 'student') {
        links.push(
            { to: '/student-requests', label: 'My Requests' },
            { to: '/browse-requests', label: 'Browse' }
        );
    }

    if (userRole === 'tutor') {
        links.push(
            { to: '/tutor/my-requests', label: 'My Assignments' },
            { to: '/tutor/available-requests', label: 'Available' }
        );
    }

    if (userRole === 'admin') {
        links.push({ to: '/admin/requests', label: 'Manage Requests' });
    }

    links.push(
        { to: '/posts', label: 'Study Posts' },
        { to: '/feedbacks', label: 'Feedbacks' },
        { to: '/notifications', label: 'Notifications', showBadge: true },
        { to: '/profile', label: 'Profile' }
    );

    return (
        <>
            {links.map((link) => {
                const isActive = isActivePath(currentPath, link.to, Boolean(link.exact));
                return (
                    <Link
                        key={link.to}
                        to={link.to}
                        className={`${getNavItemClass(isActive, mobile)} ${
                            link.showBadge ? 'flex items-center gap-2' : ''
                        }`}
                        onClick={closeMenu}
                    >
                        {link.label}
                        {link.showBadge && unreadCount > 0 && (
                            <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-white shadow-sm">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </Link>
                );
            })}
        </>
    );
};

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

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

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
        <>
            <nav className="sticky top-0 z-40 border-b border-[#d9e0ff] bg-white/90 shadow-sm backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="text-2xl font-extrabold tracking-tight text-[#5b7cfa]">
                            StudyConnect
                        </Link>
                    </div>

                    <div className="hidden items-center gap-7 md:flex">
                        <NavLinks
                            homeLink={homeLink}
                            currentPath={location.pathname}
                            closeMenu={() => setIsMobileMenuOpen(false)}
                            unreadCount={unreadCount}
                            userRole={user.role}
                        />

                        <div className="h-7 border-l border-gray-200" />

                        <div className="flex items-center gap-3">
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gray-700">
                                {user.role}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
                            >
                                Logout
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center md:hidden">
                        <button
                            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                            aria-expanded={isMobileMenuOpen}
                            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                            className="rounded-xl border border-gray-200 p-2 text-gray-600 transition-colors hover:border-[#c8d3ff] hover:bg-[#f5f7ff] hover:text-[#4460d8]"
                        >
                            {isMobileMenuOpen ? (
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M18 6L6 18" />
                                    <path d="M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <line x1="3" y1="12" x2="21" y2="12" />
                                    <line x1="3" y1="18" x2="21" y2="18" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-30 md:hidden" role="presentation">
                    <button
                        aria-label="Close mobile menu"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="absolute inset-0 bg-gray-900/25"
                    />

                    <div className="absolute inset-x-0 top-16 mx-3 rounded-2xl border border-[#d9e0ff] bg-white p-4 shadow-2xl">
                        <div className="flex max-h-[calc(100vh-6.5rem)] flex-col gap-2 overflow-y-auto">
                            <NavLinks
                                homeLink={homeLink}
                                currentPath={location.pathname}
                                closeMenu={() => setIsMobileMenuOpen(false)}
                                unreadCount={unreadCount}
                                userRole={user.role}
                                mobile
                            />

                            <div className="mt-1 border-t border-gray-200 pt-3">
                                <div className="mb-3 rounded-xl bg-gray-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-gray-600">
                                    Logged in as {user.role}
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default NavBar;