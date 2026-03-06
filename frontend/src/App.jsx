import { Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';

function App() {
    return (
        <Routes>
            <Route path="/" element={<div>StudyConnect Home Feed Placeholder</div>} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
        </Routes>
    );
}

export default App;