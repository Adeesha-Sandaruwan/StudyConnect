import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import NavBar from './components/NavBar';
import AuthPage from './pages/AuthPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Onboarding from './pages/Onboarding';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TutorDashboard from './pages/TutorDashboard';
import Profile from './pages/Profile';
import StudyPosts from './pages/StudyPosts';
import SinglePost from './pages/SinglePost';
import Notifications from './pages/Notifications'; // FIX: Imported the Notifications page

const ProtectedRoute = ({ children }) => {
    const { user } = useContext(AuthContext); 
    if (!user) {
        return <Navigate to="/login" replace />;
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
                    
                    {/* Wrap all internal pages with the ProtectedRoute */}
                    <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/student-dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
                    <Route path="/tutor-dashboard" element={<ProtectedRoute><TutorDashboard /></ProtectedRoute>} />
                    <Route path="/posts" element={<ProtectedRoute><StudyPosts /></ProtectedRoute>} />
                    <Route path="/posts/:id" element={<ProtectedRoute><SinglePost /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    
                    {/* FIX: Replaced the placeholder div with the actual Notifications component */}
                    <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                </Routes>
            </div>
        </div>
    );
}

export default App;