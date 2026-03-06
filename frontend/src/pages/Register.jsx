import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Student' });
    const [error, setError] = useState('');
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await register(formData);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        }
    };

    const handleGoogleAuth = async () => {
        try {
            const res = await api.post('/users/google');
            console.log(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Google authentication failed.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col items-center w-full px-12 bg-white relative">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Registration</h1>
            
            <div className={`w-full max-w-sm mb-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-md overflow-hidden transition-all duration-300 ease-out transform ${error ? 'translate-y-0 opacity-100 max-h-20' : '-translate-y-4 opacity-0 max-h-0'}`}>
                <div className="p-3 flex items-center justify-center text-center">
                    <span className="text-red-600 font-semibold text-sm">{error}</span>
                </div>
            </div>

            <input type="text" name="name" placeholder="Username" required onChange={handleChange} value={formData.name} className="bg-gray-100 border-none px-4 py-3 rounded-md w-full mb-3 outline-none focus:ring-2 focus:ring-[#5b7cfa]" />
            <input type="email" name="email" placeholder="Email" required onChange={handleChange} value={formData.email} className="bg-gray-100 border-none px-4 py-3 rounded-md w-full mb-3 outline-none focus:ring-2 focus:ring-[#5b7cfa]" />
            <input type="password" name="password" placeholder="Password" required onChange={handleChange} value={formData.password} className="bg-gray-100 border-none px-4 py-3 rounded-md w-full mb-3 outline-none focus:ring-2 focus:ring-[#5b7cfa]" />
            <select name="role" onChange={handleChange} value={formData.role} className="bg-gray-100 border-none px-4 py-3 rounded-md w-full mb-6 outline-none focus:ring-2 focus:ring-[#5b7cfa] text-gray-600">
                <option value="Student">Student</option>
                <option value="Tutor">Tutor</option>
            </select>
            <button type="submit" className="w-full bg-[#5b7cfa] text-white rounded-md py-3 font-semibold shadow-md hover:bg-[#4a6be0] transition-colors mb-4">Register</button>
            <span className="text-xs text-gray-500 mb-3">or register with social platforms</span>
            <div className="flex gap-4">
                <button type="button" onClick={handleGoogleAuth} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors font-bold text-gray-700">G</button>
            </div>
        </form>
    );
};

export default Register;