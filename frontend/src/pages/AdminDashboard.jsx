import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('kyc');
    const [kycStatus, setKycStatus] = useState('pending'); // 'pending', 'verified', 'rejected'
    const [kycProfiles, setKycProfiles] = useState([]);
    
    const [allUsers, setAllUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [viewProfile, setViewProfile] = useState(null);
    const [editUser, setEditUser] = useState(null);
    const [editFormData, setEditFormData] = useState({ name: '', email: '', role: '' });
    
    const [showAddAdmin, setShowAddAdmin] = useState(false);
    const [addAdminData, setAddAdminData] = useState({ name: '', email: '', password: '' });

    useEffect(() => {
        if (!user) return;
        if (user.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchData();
    }, [activeTab, kycStatus, user, navigate]);

    const fetchData = async () => {
        setIsLoading(true);
        setError('');
        try {
            if (activeTab === 'kyc') {
                const res = await api.get(`/profiles/admin/pending?status=${kycStatus}`);
                setKycProfiles(res.data.profiles || []);
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
            setKycProfiles(prev => prev.filter(p => p._id !== profileId));
            setViewProfile(null);
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

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put(`/users/${editUser._id}`, editFormData);
            setAllUsers(prev => prev.map(u => u._id === editUser._id ? res.data : u));
            setEditUser(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update user.');
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/users/admin', addAdminData);
            setAllUsers([...allUsers, res.data]);
            setShowAddAdmin(false);
            setAddAdminData({ name: '', email: '', password: '' });
            alert("New Admin created successfully!");
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create admin.');
        }
    };

    const renderDocument = (url, title) => {
        if (!url) return null;
        const isPdf = url.toLowerCase().endsWith('.pdf');
        
        return (
            <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h4 className="font-bold text-gray-700 mb-2">{title}</h4>
                {isPdf ? (
                    <a href={url} target="_blank" rel="noreferrer" className="inline-block bg-[#5b7cfa] text-white px-4 py-2 rounded font-semibold text-sm hover:bg-[#4a6be0]">
                        Open PDF Document
                    </a>
                ) : (
                    <a href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt={title} className="w-full max-h-64 object-contain rounded border border-gray-200 shadow-sm hover:opacity-90 transition-opacity" />
                    </a>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#eef2f6] p-4 sm:p-8 font-sans relative">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center bg-white rounded-3xl p-6 sm:p-8 shadow-sm mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Admin Dashboard</h1>
                        <p className="text-gray-500 mt-1">Manage platform users and verify KYC applications.</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-4 bg-gray-100 p-1.5 rounded-xl">
                        <button 
                            onClick={() => setActiveTab('kyc')}
                            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'kyc' ? 'bg-white text-[#5b7cfa] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            KYC Approvals
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

                <div className="bg-white rounded-3xl shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                    
                    {/* Dynamic Toolbar */}
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                        {activeTab === 'kyc' ? (
                            <div className="flex gap-2">
                                <button onClick={() => setKycStatus('pending')} className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${kycStatus === 'pending' ? 'bg-yellow-100 text-yellow-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>⏳ Pending</button>
                                <button onClick={() => setKycStatus('verified')} className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${kycStatus === 'verified' ? 'bg-green-100 text-green-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>✅ Approved</button>
                                <button onClick={() => setKycStatus('rejected')} className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${kycStatus === 'rejected' ? 'bg-red-100 text-red-700 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}>❌ Rejected</button>
                            </div>
                        ) : (
                            <div className="flex justify-end w-full">
                                <button onClick={() => setShowAddAdmin(true)} className="bg-gray-800 text-white hover:bg-gray-900 px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-md">
                                    + Add New Admin
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="w-full overflow-x-auto flex-1">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-[400px]">
                                <div className="w-12 h-12 border-4 border-[#5b7cfa] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'kyc' && (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                                <th className="p-5 font-bold">User Info</th>
                                                <th className="p-5 font-bold">Role / Level</th>
                                                <th className="p-5 font-bold">Applied On</th>
                                                <th className="p-5 font-bold text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {kycProfiles.length === 0 ? (
                                                <tr><td colSpan="4" className="text-center p-8 text-gray-500 font-medium">No {kycStatus} profiles found.</td></tr>
                                            ) : (
                                                kycProfiles.map(profile => (
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
                                                            <span className="text-sm text-gray-600">{new Date(profile.createdAt).toLocaleDateString()}</span>
                                                        </td>
                                                        <td className="p-5 text-center">
                                                            <button onClick={() => setViewProfile(profile)} className="bg-[#5b7cfa] text-white hover:bg-[#4a6be0] px-6 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm">
                                                                Review Documents
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                )}

                                {activeTab === 'users' && (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
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
                                                        <td className="p-5">
                                                            <div className="flex justify-center gap-2">
                                                                <button onClick={() => { setEditFormData({ name: u.name, email: u.email, role: u.role }); setEditUser(u); }} className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                                                                    Edit
                                                                </button>
                                                                {u.role !== 'admin' && (
                                                                    <button onClick={() => handleDeleteUser(u._id)} className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                                                                        Delete
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Document Review Modal */}
            {viewProfile && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-2xl font-extrabold text-gray-800">Review KYC Profile</h2>
                            <button onClick={() => setViewProfile(null)} className="text-gray-400 hover:text-gray-800 text-2xl font-bold">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-lg font-bold text-[#5b7cfa] mb-4 border-b pb-2">User Details</h3>
                                    <div className="space-y-3 text-sm">
                                        <p><span className="font-semibold text-gray-500">Name:</span> {viewProfile.user?.name}</p>
                                        <p><span className="font-semibold text-gray-500">Email:</span> {viewProfile.user?.email}</p>
                                        <p><span className="font-semibold text-gray-500">Role:</span> {viewProfile.user?.role}</p>
                                        <p><span className="font-semibold text-gray-500">DOB:</span> {new Date(viewProfile.dob).toLocaleDateString()}</p>
                                        <p><span className="font-semibold text-gray-500">Gender:</span> {viewProfile.gender || 'N/A'}</p>
                                        <p><span className="font-semibold text-gray-500">Phone:</span> {viewProfile.phoneNumber}</p>
                                        <p><span className="font-semibold text-gray-500">Location:</span> {viewProfile.city}, {viewProfile.country}</p>
                                        <p><span className="font-semibold text-gray-500">Bio:</span> {viewProfile.bio || 'No bio provided'}</p>
                                    </div>

                                    <h3 className="text-lg font-bold text-[#5b7cfa] mb-4 mt-8 border-b pb-2">Emergency Contact</h3>
                                    <div className="space-y-3 text-sm">
                                        <p><span className="font-semibold text-gray-500">Name:</span> {viewProfile.emergencyContact?.name}</p>
                                        <p><span className="font-semibold text-gray-500">Relation:</span> {viewProfile.emergencyContact?.relation}</p>
                                        <p><span className="font-semibold text-gray-500">Phone:</span> {viewProfile.emergencyContact?.phoneNumber}</p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[#5b7cfa] mb-4 border-b pb-2">Academic & Professional</h3>
                                    <div className="space-y-3 text-sm">
                                        <p><span className="font-semibold text-gray-500">Institution:</span> {viewProfile.schoolOrUniversity}</p>
                                        <p><span className="font-semibold text-gray-500">Grade Level:</span> {viewProfile.gradeLevel}</p>
                                        {viewProfile.user?.role === 'student' && (
                                            <p><span className="font-semibold text-gray-500">Learning Needs:</span> {viewProfile.learningNeeds}</p>
                                        )}
                                        {viewProfile.user?.role === 'tutor' && (
                                            <>
                                                <p><span className="font-semibold text-gray-500">NIC Number:</span> {viewProfile.nicNumber}</p>
                                                <p><span className="font-semibold text-gray-500">Subjects:</span> {viewProfile.subjects?.join(', ')}</p>
                                                <p><span className="font-semibold text-gray-500">Experience:</span> {viewProfile.experience} years</p>
                                                <p><span className="font-semibold text-gray-500">Availability:</span> {viewProfile.availability?.join(', ')}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <h3 className="text-xl font-bold text-gray-800 mb-6">Uploaded Documents</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {renderDocument(viewProfile.nicFront, 'NIC Front Image')}
                                    {renderDocument(viewProfile.nicBack, 'NIC Back Image')}
                                    {viewProfile.certificates?.map((cert, index) => (
                                        <div key={index}>
                                            {renderDocument(cert, `Certificate / Document ${index + 1}`)}
                                        </div>
                                    ))}
                                    {!viewProfile.nicFront && !viewProfile.certificates?.length && (
                                        <p className="text-gray-500 italic">No documents were uploaded by this user.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-4">
                            <button onClick={() => handleVerifyProfile(viewProfile._id, 'rejected')} className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 px-6 py-3 rounded-xl font-bold transition-colors">
                                Reject Profile
                            </button>
                            <button onClick={() => handleVerifyProfile(viewProfile._id, 'pending')} className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 hover:text-yellow-700 px-6 py-3 rounded-xl font-bold transition-colors">
                                Mark as Pending
                            </button>
                            <button onClick={() => handleVerifyProfile(viewProfile._id, 'verified')} className="bg-green-500 text-white hover:bg-green-600 px-8 py-3 rounded-xl font-bold transition-colors shadow-md hover:shadow-lg hover:-translate-y-0.5">
                                Approve Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editUser && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-extrabold text-gray-800">Edit User</h2>
                            <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-800 text-2xl font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleUpdateUser} className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                                <input type="text" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#5b7cfa]" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                <input type="email" value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#5b7cfa]" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                                <select value={editFormData.role} onChange={(e) => setEditFormData({...editFormData, role: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#5b7cfa]" required>
                                    <option value="student">Student</option>
                                    <option value="tutor">Tutor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="mt-4 flex gap-3">
                                <button type="button" onClick={() => setEditUser(null)} className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 bg-[#5b7cfa] text-white px-4 py-3 rounded-xl font-bold hover:bg-[#4a6be0] transition-colors shadow-md">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Admin Modal */}
            {showAddAdmin && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-900 text-white">
                            <h2 className="text-xl font-extrabold">Create New Admin</h2>
                            <button onClick={() => setShowAddAdmin(false)} className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
                        </div>
                        <form onSubmit={handleCreateAdmin} className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                                <input type="text" value={addAdminData.name} onChange={(e) => setAddAdminData({...addAdminData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-gray-800" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                <input type="email" value={addAdminData.email} onChange={(e) => setAddAdminData({...addAdminData, email: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-gray-800" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                                <input type="password" value={addAdminData.password} onChange={(e) => setAddAdminData({...addAdminData, password: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-gray-800" required minLength="6" />
                            </div>
                            <div className="mt-4 flex gap-3">
                                <button type="button" onClick={() => setShowAddAdmin(false)} className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors shadow-md">Create Admin</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;