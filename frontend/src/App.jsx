import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from './context/AuthContext';
import api from './services/api';
import NavBar from './components/NavBar';
import AuthPage from './pages/AuthPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Onboarding from './pages/Onboarding';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import StudentModulePage from './pages/StudentModulePage';
import StudentLessonPage from './pages/StudentLessonPage';
import TutorDashboard from './pages/TutorDashboard';
import TutorModulePage from './pages/TutorModulePage';
import TutorLessonPage from './pages/TutorLessonPage';
import Profile from './pages/Profile';
import StudyPosts from './pages/StudyPosts';
import SinglePost from './pages/SinglePost';
import Notifications from './pages/Notifications';

const ProtectedRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

const VerifiedRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [isVerified, setIsVerified] = useState(null);

    useEffect(() => {
        if (user?.role === 'admin') return;

        let isMounted = true;

        const checkVerification = async () => {
            try {
                const res = await api.get('/profiles/me');
                if (isMounted) {
                    setIsVerified(res.data.verificationStatus === 'verified');
                }
            } catch {
                if (isMounted) setIsVerified(false);
            }
        };

        checkVerification();

        return () => { isMounted = false; };
    }, [user]);

    if (user?.role === 'admin') {
        return children;
    }

    if (isVerified === null) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-[#eef2f6]">
                <div className="w-12 h-12 border-4 border-[#5b7cfa] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isVerified) {
        return <Navigate to="/profile" replace />;
    }

    return children;
};

function App() {
    const { user } = useContext(AuthContext);

    const getHomeRoute = () => {
        if (!user) return '/login';
        if (user.role === 'admin') return '/admin';
        if (user.role === 'tutor') return '/tutor-dashboard';
        return '/student-dashboard';
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#eef2f6]">
            <NavBar />
            
            <div className="flex-1">
                <Routes>
                    <Route path="/" element={<Navigate to={getHomeRoute()} replace />} />
                    <Route path="/login" element={user ? <Navigate to={getHomeRoute()} replace /> : <AuthPage />} />
                    <Route path="/register" element={user ? <Navigate to={getHomeRoute()} replace /> : <AuthPage />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/resetpassword/:resettoken" element={<ResetPassword />} />
                    
                    <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

                    <Route path="/student-dashboard" element={<ProtectedRoute><VerifiedRoute><StudentDashboard /></VerifiedRoute></ProtectedRoute>} />
                    <Route path="/student-dashboard/lesson/:lessonId" element={<ProtectedRoute><VerifiedRoute><StudentLessonPage /></VerifiedRoute></ProtectedRoute>} />
                    <Route path="/student-dashboard/module/:creatorId/:grade/:subjectSlug" element={<ProtectedRoute><VerifiedRoute><StudentModulePage /></VerifiedRoute></ProtectedRoute>} />
                    
                    <Route path="/tutor-dashboard" element={<ProtectedRoute><VerifiedRoute><TutorDashboard /></VerifiedRoute></ProtectedRoute>} />
                    <Route path="/tutor-dashboard/lesson/:id" element={<ProtectedRoute><VerifiedRoute><TutorLessonPage /></VerifiedRoute></ProtectedRoute>} />
                    <Route path="/tutor-dashboard/module/:grade/:subjectSlug" element={<ProtectedRoute><VerifiedRoute><TutorModulePage /></VerifiedRoute></ProtectedRoute>} />
                    
                    <Route path="/posts" element={<ProtectedRoute><VerifiedRoute><StudyPosts /></VerifiedRoute></ProtectedRoute>} />
                    <Route path="/posts/:id" element={<ProtectedRoute><VerifiedRoute><SinglePost /></VerifiedRoute></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute><VerifiedRoute><Notifications /></VerifiedRoute></ProtectedRoute>} />
                </Routes>
            </div>
        </div>
    );
}

export default App;