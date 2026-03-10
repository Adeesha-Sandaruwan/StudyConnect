import { Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Onboarding from './pages/Onboarding';

function App() {
    return (
        <Routes>
            <Route path="/" element={<div>StudyConnect Home Feed Placeholder</div>} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/resetpassword/:resettoken" element={<ResetPassword />} />
            <Route path="/onboarding" element={<Onboarding />} />
        </Routes>
    );
}

export default App;