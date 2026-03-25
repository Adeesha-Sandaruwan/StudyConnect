import { Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Onboarding from './pages/Onboarding';
import AdminDashboard from './pages/AdminDashboard'; // Add this import

function App() {
    return (
        <Routes>
            <Route path="/" element={<div>StudyConnect Home Feed Placeholder</div>} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/resetpassword/:resettoken" element={<ResetPassword />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/admin" element={<AdminDashboard />} /> {/* Add this route */}
        </Routes>
    );
}

export default App;