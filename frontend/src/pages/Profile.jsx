import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { validateFile } from '../utils/onboardingValidation';
import api from '../services/api';

const Profile = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form Data State
    const [formData, setFormData] = useState({});
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    useEffect(() => {
        if (user?.role === 'admin') {
            setIsLoading(false); // Admins don't need KYC profiles
            return;
        }
        fetchProfile();
    }, [user]);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/profiles/me');
            setProfile(res.data);
            initFormData(res.data);
        } catch (err) {
            if (err.response?.status === 404) {
                setProfile(null); // No profile found
            } else {
                setError('Failed to load profile.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const initFormData = (data) => {
        setFormData({
            bio: data.bio || '',
            phoneNumber: data.phoneNumber || '',
            city: data.city || '',
            country: data.country || '',
            emergencyContactName: data.emergencyContact?.name || '',
            emergencyContactRelation: data.emergencyContact?.relation || '',
            emergencyContactPhone: data.emergencyContact?.phoneNumber || '',
            schoolOrUniversity: data.schoolOrUniversity || '',
            gradeLevel: data.gradeLevel || '',
            learningNeeds: data.learningNeeds || '',
            subjects: data.subjects ? data.subjects.join(', ') : '',
            experience: data.experience || '',
            availability: data.availability ? data.availability.join(', ') : ''
        });
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileError = validateFile(file);
        if (fileError) {
            setError(fileError);
            return;
        }

        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const submitData = new FormData();
        
        // Append all text fields
        Object.keys(formData).forEach(key => {
            if (formData[key]) submitData.append(key, formData[key]);
        });

        // Append Avatar if changed
        if (avatarFile) {
            submitData.append('avatar', avatarFile);
        }

        try {
            const res = await api.post('/profiles', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProfile(res.data);
            setIsEditing(false);
            setSuccess('Profile updated successfully!');
            
            // If avatar changed, reload to sync global AuthContext
            if (avatarFile) {
                setTimeout(() => window.location.reload(), 1000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile.');
        }
    };

    if (isLoading) {
        return <div className="min-h-screen flex justify-center items-center"><div className="w-12 h-12 border-4 border-[#5b7cfa] border-t-transparent rounded-full animate-spin"></div></div>;
    }

    // ----------------------------------------------------
    // VIEW: ADMIN PROFILE
    // ----------------------------------------------------
    if (user?.role === 'admin') {
        return (
            <div className="max-w-4xl mx-auto p-6 mt-8">
                <div className="bg-white rounded-3xl shadow-sm p-8 text-center">
                    <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Administrator Profile</h1>
                    <div className="w-24 h-24 mx-auto bg-gray-800 text-white rounded-full flex items-center justify-center text-3xl font-bold mb-4">
                        {user.name.charAt(0)}
                    </div>
                    <p className="text-xl font-bold text-gray-800">{user.name}</p>
                    <p className="text-gray-500">{user.email}</p>
                    <span className="mt-4 inline-block bg-gray-800 text-white px-4 py-1 rounded-full text-sm font-bold uppercase">System Admin</span>
                </div>
            </div>
        );
    }

    // ----------------------------------------------------
    // VIEW: MISSING PROFILE (SKIPPED ONBOARDING)
    // ----------------------------------------------------
    if (!profile) {
        return (
            <div className="max-w-3xl mx-auto p-6 mt-12">
                <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 text-center shadow-sm">
                    <span className="text-5xl mb-4 block">⚠️</span>
                    <h2 className="text-2xl font-extrabold text-red-800 mb-2">Profile Verification Required</h2>
                    <p className="text-red-600 mb-6 font-medium">You skipped the onboarding process. You cannot access any system features, post study materials, or connect with others until your profile is submitted and verified by an administrator.</p>
                    <button onClick={() => navigate('/onboarding')} className="bg-red-600 text-white hover:bg-red-700 px-8 py-3 rounded-xl font-bold transition-colors shadow-md hover:shadow-lg hover:-translate-y-0.5">
                        Complete Onboarding Now
                    </button>
                </div>
            </div>
        );
    }

    // ----------------------------------------------------
    // VIEW: STANDARD PROFILE (STUDENT/TUTOR)
    // ----------------------------------------------------
    const isTutor = user.role === 'tutor';

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
            
            {/* Status Banner */}
            {profile.verificationStatus === 'pending' && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-xl shadow-sm mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-yellow-800 text-lg">Verification Pending</h3>
                        <p className="text-yellow-700 text-sm">Your profile is currently under review by an administrator. Some features may be restricted.</p>
                    </div>
                    <span className="text-3xl">⏳</span>
                </div>
            )}
            {profile.verificationStatus === 'rejected' && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-red-800 text-lg">Verification Rejected</h3>
                        <p className="text-red-700 text-sm">Your profile was rejected. Please update your details and ensure your documents are clear.</p>
                    </div>
                    <span className="text-3xl">❌</span>
                </div>
            )}

            {/* Profile Header */}
            <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative">
                
                {/* Avatar Section */}
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center">
                        {avatarPreview || user.avatar ? (
                            <img src={avatarPreview || user.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl text-gray-400 font-bold">{user.name.charAt(0)}</span>
                        )}
                    </div>
                    {isEditing && (
                        <label className="absolute bottom-0 right-0 bg-[#5b7cfa] text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-[#4a6be0] transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <input type="file" accept="image/jpeg, image/png, image/jpg" className="hidden" onChange={handleAvatarChange} />
                        </label>
                    )}
                </div>

                <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                        <h1 className="text-3xl font-extrabold text-gray-800">{user.name}</h1>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isTutor ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {user.role}
                        </span>
                        {profile.verificationStatus === 'verified' && (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                Verified
                            </span>
                        )}
                    </div>
                    <p className="text-gray-500 font-medium">{user.email}</p>
                    <p className="text-gray-500 mt-1">{profile.city}, {profile.country}</p>
                </div>

                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="absolute top-6 right-6 text-gray-400 hover:text-[#5b7cfa] transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </button>
                )}
            </div>

            {/* Alerts */}
            {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 font-semibold border-l-4 border-red-500">{error}</div>}
            {success && <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 font-semibold border-l-4 border-green-500">{success}</div>}

            {/* Profile Content / Form */}
            <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* Section 1: Basic Info */}
                        <div>
                            <h3 className="text-lg font-bold text-[#5b7cfa] border-b pb-2 mb-4">Basic Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bio</label>
                                    {isEditing ? (
                                        <textarea name="bio" value={formData.bio} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#5b7cfa] text-sm" rows="3"></textarea>
                                    ) : (
                                        <p className="text-gray-800 text-sm">{profile.bio || 'No bio provided.'}</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                                        {isEditing ? (
                                            <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#5b7cfa] text-sm" />
                                        ) : (
                                            <p className="text-gray-800 text-sm">{profile.phoneNumber}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date of Birth</label>
                                        <p className="text-gray-800 text-sm py-3">{new Date(profile.dob).toLocaleDateString()}</p> {/* DOB usually shouldn't be edited */}
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-[#5b7cfa] border-b pb-2 mb-4 mt-8">Emergency Contact</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Name</label>
                                    {isEditing ? (
                                        <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#5b7cfa] text-sm" />
                                    ) : (
                                        <p className="text-gray-800 text-sm">{profile.emergencyContact?.name}</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Relation</label>
                                        {isEditing ? (
                                            <input type="text" name="emergencyContactRelation" value={formData.emergencyContactRelation} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#5b7cfa] text-sm" />
                                        ) : (
                                            <p className="text-gray-800 text-sm">{profile.emergencyContact?.relation}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                                        {isEditing ? (
                                            <input type="text" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#5b7cfa] text-sm" />
                                        ) : (
                                            <p className="text-gray-800 text-sm">{profile.emergencyContact?.phoneNumber}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Role Specific Info */}
                        <div>
                            <h3 className="text-lg font-bold text-[#5b7cfa] border-b pb-2 mb-4">Academic & Professional</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Institution / School</label>
                                    {isEditing ? (
                                        <input type="text" name="schoolOrUniversity" value={formData.schoolOrUniversity} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#5b7cfa] text-sm" />
                                    ) : (
                                        <p className="text-gray-800 text-sm">{profile.schoolOrUniversity}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Grade Level</label>
                                    {isEditing ? (
                                        <input type="text" name="gradeLevel" value={formData.gradeLevel} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#5b7cfa] text-sm" />
                                    ) : (
                                        <p className="text-gray-800 text-sm">{profile.gradeLevel}</p>
                                    )}
                                </div>

                                {/* Student Specific */}
                                {!isTutor && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Learning Needs</label>
                                        {isEditing ? (
                                            <textarea name="learningNeeds" value={formData.learningNeeds} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#5b7cfa] text-sm" rows="3"></textarea>
                                        ) : (
                                            <p className="text-gray-800 text-sm">{profile.learningNeeds}</p>
                                        )}
                                    </div>
                                )}

                                {/* Tutor Specific */}
                                {isTutor && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subjects (Comma Separated)</label>
                                            {isEditing ? (
                                                <input type="text" name="subjects" value={formData.subjects} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#5b7cfa] text-sm" />
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {profile.subjects?.map((sub, i) => <span key={i} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold">{sub}</span>)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Experience (Years)</label>
                                                {isEditing ? (
                                                    <input type="number" name="experience" value={formData.experience} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#5b7cfa] text-sm" />
                                                ) : (
                                                    <p className="text-gray-800 text-sm">{profile.experience} Years</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">NIC Number</label>
                                                <p className="text-gray-800 text-sm py-3 font-mono">{profile.nicNumber}</p> {/* NIC shouldn't be easily editable */}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Availability (Comma Separated)</label>
                                            {isEditing ? (
                                                <input type="text" name="availability" value={formData.availability} onChange={handleInputChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#5b7cfa] text-sm" placeholder="e.g. Weekends, Evenings" />
                                            ) : (
                                                <p className="text-gray-800 text-sm">{profile.availability?.join(', ')}</p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {isEditing && (
                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-4">
                            <button type="button" onClick={() => { setIsEditing(false); initFormData(profile); setAvatarPreview(null); setAvatarFile(null); }} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" className="bg-[#5b7cfa] text-white px-8 py-2.5 rounded-xl font-bold hover:bg-[#4a6be0] transition-colors shadow-md">
                                Save Changes
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default Profile;