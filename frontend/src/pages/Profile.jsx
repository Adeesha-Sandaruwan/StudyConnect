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
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    useEffect(() => {
        if (user?.role === 'admin') {
            setIsLoading(false); // Admins don't need KYC profiles
            return;
        }
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

        fetchProfile();
    }, [user]);

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

    useEffect(() => {
        if (!isAvatarModalOpen) return;

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsAvatarModalOpen(false);
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isAvatarModalOpen]);

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
    const inputClass = 'w-full rounded-xl border border-white/60 bg-white/90 px-3 py-2.5 text-sm text-gray-800 shadow-sm outline-none transition focus:border-[#8fb1ff] focus:ring-2 focus:ring-[#dfe9ff]';
    const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#5a66a1]';
    const profileImageUrl = avatarPreview || user.avatar || '';
    const canPreviewAvatar = Boolean(profileImageUrl);

    const displayValue = (value, fallback = 'Not provided') => {
        if (value === null || value === undefined || value === '') {
            return fallback;
        }
        return value;
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-[#edf6ff] via-[#f3efff] to-[#fff3e8]">
            <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
                {profile.verificationStatus === 'pending' && (
                    <div className="mb-6 flex items-start justify-between gap-3 rounded-2xl border border-amber-300 bg-linear-to-r from-amber-50 to-orange-50 px-4 py-3 shadow-sm">
                        <div>
                            <h3 className="text-base font-bold text-amber-900">Verification Pending</h3>
                            <p className="mt-0.5 text-sm text-amber-800">Your profile is under review by an administrator. Some features may be restricted.</p>
                        </div>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-lg">⏳</span>
                    </div>
                )}

                {profile.verificationStatus === 'rejected' && (
                    <div className="mb-6 flex items-start justify-between gap-3 rounded-2xl border border-rose-300 bg-linear-to-r from-rose-50 to-pink-50 px-4 py-3 shadow-sm">
                        <div>
                            <h3 className="text-base font-bold text-rose-900">Verification Rejected</h3>
                            <p className="mt-0.5 text-sm text-rose-800">Please update your details and ensure uploaded documents are clear.</p>
                        </div>
                        <span className="rounded-full bg-rose-100 px-2.5 py-1 text-lg">❌</span>
                    </div>
                )}

                <div className="relative mb-6 overflow-hidden rounded-3xl border border-[#cad8ff] bg-white/95 p-6 shadow-sm sm:p-8">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-r from-[#dde9ff] via-[#e8f7ff] to-[#f8e8ff]" />

                    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
                        <div className="relative self-center sm:self-auto">
                            {canPreviewAvatar ? (
                                <button
                                    type="button"
                                    onClick={() => setIsAvatarModalOpen(true)}
                                    aria-label="Open profile picture"
                                    className="group relative block h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg transition hover:scale-[1.02] sm:h-32 sm:w-32"
                                >
                                    <img src={profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
                                    <span className="absolute inset-0 flex items-end justify-center bg-black/0 pb-3 text-[11px] font-bold text-white opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                                        View Photo
                                    </span>
                                </button>
                            ) : (
                                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg sm:h-32 sm:w-32">
                                    <span className="text-4xl font-bold text-gray-400">{user.name.charAt(0)}</span>
                                </div>
                            )}

                            {isEditing && (
                                <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-[#5b7cfa] p-2 text-white shadow-md transition-colors hover:bg-[#4a6be0]">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    <input type="file" accept="image/jpeg, image/png, image/jpg" className="hidden" onChange={handleAvatarChange} />
                                </label>
                            )}
                        </div>

                        <div className="relative flex-1 text-center sm:text-left">
                            <div className="mb-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                                <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">{user.name}</h1>
                                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${isTutor ? 'bg-orange-100 text-orange-700' : 'bg-cyan-100 text-cyan-700'}`}>
                                    {user.role}
                                </span>
                                {profile.verificationStatus === 'verified' && (
                                    <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold uppercase text-green-700">
                                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                        Verified
                                    </span>
                                )}
                            </div>

                            <p className="text-sm font-medium text-[#51609c] sm:text-base">{user.email}</p>
                            <p className="mt-1 text-sm text-[#6876ad] sm:text-base">{displayValue([profile.city, profile.country].filter(Boolean).join(', '))}</p>
                        </div>

                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="relative self-center rounded-xl border border-[#cfd9ff] bg-linear-to-r from-white to-[#eef3ff] px-4 py-2 text-sm font-bold text-[#4460d8] shadow-sm transition hover:from-[#f7f9ff] hover:to-[#e4ebff] sm:self-start"
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>
                </div>

                {error && <div className="mb-5 rounded-2xl border border-rose-200 bg-linear-to-r from-rose-50 to-pink-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}
                {success && <div className="mb-5 rounded-2xl border border-green-200 bg-linear-to-r from-green-50 to-emerald-50 px-4 py-3 text-sm font-semibold text-green-700">{success}</div>}

                <div className="rounded-3xl border border-[#d8e0ff] bg-white/95 p-5 shadow-sm sm:p-7">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <section className="rounded-2xl border border-sky-100 bg-linear-to-br from-[#f5faff] to-[#eaf5ff] p-5">
                                <h3 className="mb-4 border-b border-sky-200 pb-2 text-base font-extrabold text-[#2f7ecb]">Basic Information</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>Bio</label>
                                        {isEditing ? (
                                            <textarea name="bio" value={formData.bio} onChange={handleInputChange} className={inputClass} rows="3" placeholder="Tell others about your learning goals" />
                                        ) : (
                                            <p className="rounded-xl bg-white/85 px-3 py-2.5 text-sm text-gray-700">{displayValue(profile.bio, 'No bio provided.')}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className={labelClass}>Phone Number</label>
                                            {isEditing ? (
                                                <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className={inputClass} />
                                            ) : (
                                                <p className="rounded-xl bg-white/85 px-3 py-2.5 text-sm text-gray-700">{displayValue(profile.phoneNumber)}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className={labelClass}>Date of Birth</label>
                                            <p className="rounded-xl bg-white/85 px-3 py-2.5 text-sm text-gray-700">{profile.dob ? new Date(profile.dob).toLocaleDateString() : 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>

                                <h3 className="mb-4 mt-6 border-b border-sky-200 pb-2 text-base font-extrabold text-[#2f7ecb]">Emergency Contact</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>Contact Name</label>
                                        {isEditing ? (
                                            <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleInputChange} className={inputClass} />
                                        ) : (
                                            <p className="rounded-xl bg-white/85 px-3 py-2.5 text-sm text-gray-700">{displayValue(profile.emergencyContact?.name)}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className={labelClass}>Relation</label>
                                            {isEditing ? (
                                                <input type="text" name="emergencyContactRelation" value={formData.emergencyContactRelation} onChange={handleInputChange} className={inputClass} />
                                            ) : (
                                                <p className="rounded-xl bg-white/85 px-3 py-2.5 text-sm text-gray-700">{displayValue(profile.emergencyContact?.relation)}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className={labelClass}>Phone Number</label>
                                            {isEditing ? (
                                                <input type="text" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleInputChange} className={inputClass} />
                                            ) : (
                                                <p className="rounded-xl bg-white/85 px-3 py-2.5 text-sm text-gray-700">{displayValue(profile.emergencyContact?.phoneNumber)}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-orange-100 bg-linear-to-br from-[#fff8ee] to-[#fff2fb] p-5">
                                <h3 className="mb-4 border-b border-orange-200 pb-2 text-base font-extrabold text-[#c26b18]">Academic & Professional</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>Institution / School</label>
                                        {isEditing ? (
                                            <input type="text" name="schoolOrUniversity" value={formData.schoolOrUniversity} onChange={handleInputChange} className={inputClass} />
                                        ) : (
                                            <p className="rounded-xl bg-white/85 px-3 py-2.5 text-sm text-gray-700">{displayValue(profile.schoolOrUniversity)}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={labelClass}>Grade Level</label>
                                        {isEditing ? (
                                            <input type="text" name="gradeLevel" value={formData.gradeLevel} onChange={handleInputChange} className={inputClass} />
                                        ) : (
                                            <p className="rounded-xl bg-white/85 px-3 py-2.5 text-sm text-gray-700">{displayValue(profile.gradeLevel)}</p>
                                        )}
                                    </div>

                                    {!isTutor && (
                                        <div>
                                            <label className={labelClass}>Learning Needs</label>
                                            {isEditing ? (
                                                <textarea name="learningNeeds" value={formData.learningNeeds} onChange={handleInputChange} className={inputClass} rows="3" />
                                            ) : (
                                                <p className="rounded-xl bg-white/85 px-3 py-2.5 text-sm text-gray-700">{displayValue(profile.learningNeeds)}</p>
                                            )}
                                        </div>
                                    )}

                                    {isTutor && (
                                        <>
                                            <div>
                                                <label className={labelClass}>Subjects</label>
                                                {isEditing ? (
                                                    <input type="text" name="subjects" value={formData.subjects} onChange={handleInputChange} className={inputClass} placeholder="Comma separated subjects" />
                                                ) : (
                                                    <div className="flex flex-wrap gap-2 rounded-xl bg-white/85 px-3 py-2.5">
                                                        {profile.subjects?.length ? profile.subjects.map((sub, i) => (
                                                            <span key={i} className="rounded-full bg-[#ffe7c7] px-3 py-1 text-xs font-semibold text-[#a85b16]">{sub}</span>
                                                        )) : <span className="text-sm text-gray-700">Not provided</span>}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <div>
                                                    <label className={labelClass}>Experience (Years)</label>
                                                    {isEditing ? (
                                                        <input type="number" name="experience" value={formData.experience} onChange={handleInputChange} className={inputClass} />
                                                    ) : (
                                                        <p className="rounded-xl bg-white/85 px-3 py-2.5 text-sm text-gray-700">{displayValue(profile.experience, '0')} Years</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className={labelClass}>NIC Number</label>
                                                    <p className="rounded-xl bg-white/85 px-3 py-2.5 font-mono text-sm text-gray-700">{displayValue(profile.nicNumber)}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <label className={labelClass}>Availability</label>
                                                {isEditing ? (
                                                    <input type="text" name="availability" value={formData.availability} onChange={handleInputChange} className={inputClass} placeholder="e.g. Weekends, Evenings" />
                                                ) : (
                                                    <p className="rounded-xl bg-white/85 px-3 py-2.5 text-sm text-gray-700">{displayValue(profile.availability?.join(', '))}</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </section>
                        </div>

                        {isEditing && (
                            <div className="mt-8 flex flex-col-reverse justify-end gap-3 border-t border-gray-100 pt-6 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(false);
                                        initFormData(profile);
                                        setAvatarPreview(null);
                                        setAvatarFile(null);
                                    }}
                                    className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-xl bg-linear-to-r from-[#5b7cfa] to-[#7e63f3] px-8 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:from-[#4a6be0] hover:to-[#6f52e7]"
                                >
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {isAvatarModalOpen && canPreviewAvatar && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
                        onClick={() => setIsAvatarModalOpen(false)}
                    >
                        <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
                            <button
                                type="button"
                                onClick={() => setIsAvatarModalOpen(false)}
                                className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-3 py-1 text-sm font-bold text-white transition-colors hover:bg-black/80"
                            >
                                Close
                            </button>
                            <img
                                src={profileImageUrl}
                                alt="Profile preview"
                                className="max-h-[85vh] w-full rounded-2xl border border-white/20 bg-black/20 object-contain"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;