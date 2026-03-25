import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('kyc'); // 'kyc' or 'users'
    const [pendingProfiles, setPendingProfiles] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) return;
        if (user.role !== 'admin') {
            navigate('/'); // Kick out non-admins
            return;
        }
        fetchData();
    }, [activeTab, user, navigate]);

    const fetchData = async () => {
        setIsLoading(true);
        setError('');
        try {
            if (activeTab === 'kyc') {
                const res = await api.get('/profiles/admin/pending');
                setPendingProfiles(res.data.profiles || []);
            } else {
                const res = await api.get('/users');
                setAllUsers(res.data.users || []);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch data.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyProfile = async (profileId, status) => {
        if (!window.confirm(`Are you sure you want to mark this profile as ${status}?`)) return;
        
        try {
            await api.put(`/profiles/admin/verify/${profileId}`, { status });
            // Remove the processed profile from the pending list
            setPendingProfiles(prev => prev.filter(p => p._id !== profileId));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update profile status.');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
        
        try {
            await api.delete(`/users/${userId}`);
            setAllUsers(prev => prev.filter(u => u._id !== userId));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete user.');
        }
    };

    return (
        <div className="min-h-screen bg-[#eef2f6] p-4 sm:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-white rounded-3xl p-6 sm:p-8 shadow-sm mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Admin Command Center</h1>
                        <p className="text-gray-500 mt-1">Manage platform users and verify KYC applications.</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-4 bg-gray-100 p-1.5 rounded-xl">
                        <button 
                            onClick={() => setActiveTab('kyc')}
                            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'kyc' ? 'bg-white text-[#5b7cfa] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Pending KYC ({activeTab === 'kyc' ? pendingProfiles.length : '...'})
                        </button>
                        <button 
                            onClick={() => setActiveTab('users')}
                            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-white text-[#5b7cfa] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            User Management
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 font-semibold border-l-4 border-red-500 shadow-sm">
                        {error}
                    </div>
                )}

                {/* Main Content Area */}
                <div className="bg-white rounded-3xl shadow-sm overflow-hidden min-h-[500px]">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-[400px]">
                            <div className="w-12 h-12 border-4 border-[#5b7cfa] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto">
                            
                            {/* KYC APPROVALS TAB */}
                            {activeTab === 'kyc' && (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                            <th className="p-5 font-bold">User Info</th>
                                            <th className="p-5 font-bold">Role / Level</th>
                                            <th className="p-5 font-bold">Documents</th>
                                            <th className="p-5 font-bold text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {pendingProfiles.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center p-8 text-gray-500 font-medium">No pending profiles to review.</td></tr>
                                        ) : (
                                            pendingProfiles.map(profile => (
                                                <tr key={profile._id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="p-5">
                                                        <div className="flex items-center gap-3">
                                                            {profile.user?.avatar ? (
                                                                <img src={profile.user.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-[#5b7cfa]/10 flex items-center justify-center text-[#5b7cfa] font-bold">
                                                                    {profile.user?.name?.charAt(0) || '?'}
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="font-bold text-gray-800">{profile.user?.name || 'Unknown'}</p>
                                                                <p className="text-xs text-gray-500">{profile.user?.email}</p>
                                                                <p className="text-xs text-gray-400 mt-0.5">{profile.phoneNumber} • {profile.city}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${profile.user?.role === 'tutor' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {profile.user?.role || 'Unknown'}
                                                        </span>
                                                        <p className="text-sm font-semibold text-gray-700 mt-2">{profile.schoolOrUniversity}</p>
                                                        <p className="text-xs text-gray-500">{profile.gradeLevel}</p>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex flex-col gap-1.5">
                                                            {profile.nicFront && <a href={profile.nicFront} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#5b7cfa] hover:underline flex items-center gap-1">🪪 NIC Front</a>}
                                                            {profile.nicBack && <a href={profile.nicBack} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#5b7cfa] hover:underline flex items-center gap-1">🪪 NIC Back</a>}
                                                            {profile.certificates?.length > 0 && (
                                                                <div className="mt-1">
                                                                    <span className="text-xs font-bold text-gray-600">Certificates:</span>
                                                                    {profile.certificates.map((cert, idx) => (
                                                                        <a key={idx} href={cert} target="_blank" rel="noreferrer" className="block text-xs font-semibold text-[#5b7cfa] hover:underline ml-2">📄 Doc {idx + 1}</a>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {!profile.nicFront && !profile.certificates?.length && <span className="text-xs text-gray-400">No documents uploaded</span>}
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex justify-center gap-2">
                                                            <button onClick={() => handleVerifyProfile(profile._id, 'verified')} className="bg-green-100 text-green-700 hover:bg-green-200 px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                                                                Approve
                                                            </button>
                                                            <button onClick={() => handleVerifyProfile(profile._id, 'rejected')} className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                                                                Reject
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}

                            {/* USER MANAGEMENT TAB */}
                            {activeTab === 'users' && (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                            <th className="p-5 font-bold">User Details</th>
                                            <th className="p-5 font-bold">Role</th>
                                            <th className="p-5 font-bold text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {allUsers.length === 0 ? (
                                            <tr><td colSpan="3" className="text-center p-8 text-gray-500 font-medium">No users found.</td></tr>
                                        ) : (
                                            allUsers.map(u => (
                                                <tr key={u._id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="p-5 flex items-center gap-3">
                                                        {u.avatar ? (
                                                            <img src={u.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                                                {u.name?.charAt(0) || '?'}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-bold text-gray-800">{u.name}</p>
                                                            <p className="text-xs text-gray-500">{u.email}</p>
                                                            <p className="text-xs text-gray-400 mt-0.5 font-mono">ID: {u._id}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-gray-800 text-white' : u.role === 'tutor' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-center">
                                                        {u.role !== 'admin' && (
                                                            <button onClick={() => handleDeleteUser(u._id)} className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                                                                Delete User
                                                            </button>
                                                        )}
                                                        {u.role === 'admin' && <span className="text-xs text-gray-400 font-semibold italic">Protected</span>}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;