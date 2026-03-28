import { useState, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { validateSlide, validateFile } from '../utils/onboardingValidation';
import api from '../services/api';

const Onboarding = () => {
    const { user } = useContext(AuthContext);
    
    const isTutor = user?.role === 'tutor' || user?.role === 'Tutor';

    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [slideErrors, setSlideErrors] = useState({});
    const [globalError, setGlobalError] = useState('');

    const [formData, setFormData] = useState({
        bio: '', phoneNumber: '', city: '', country: 'Sri Lanka', dob: '', gender: '', 
        nicNumber: '', emergencyContactName: '', emergencyContactRelation: '', emergencyContactPhone: '',
        subjects: '', experience: '', availability: '', gradeLevel: '', schoolOrUniversity: '', learningNeeds: ''
    });

    const [files, setFiles] = useState({
        avatar: null, nicFront: null, nicBack: null, certificates: []
    });

    const slides = useMemo(() => {
        const baseSlides = [
            { id: 'welcome', icon: '👋', title: `Welcome, ${user?.name?.split(' ')[0] || 'there'}!`, subtitle: `Let's set up your ${isTutor ? 'Tutor' : 'Student'} profile. It only takes a minute.` },
            { id: 'basics', icon: '👤', title: 'Tell us about yourself', subtitle: 'Add a friendly bio and a profile picture.' },
            { id: 'demographics', icon: '🎂', title: 'Basic Info', subtitle: 'We use this to verify age requirements.' },
            { id: 'contact', icon: '📍', title: 'Where are you from?', subtitle: 'This helps us connect you locally.' },
            { id: 'emergency', icon: '🆘', title: 'Emergency Contact', subtitle: 'Just in case we need to reach someone.' },
            { id: 'academic', icon: '🎓', title: 'Academic Background', subtitle: isTutor ? 'What level do you teach?' : 'Where are you currently studying?' }
        ];

        if (isTutor) {
            return [
                ...baseSlides,
                { id: 'tutor_professional', icon: '💼', title: 'Professional Details', subtitle: 'What makes you a great tutor?' },
                { id: 'tutor_identity', icon: '🪪', title: 'Identity Verification', subtitle: 'Required to build trust on our platform.' },
                { id: 'tutor_certificates', icon: '📜', title: 'Credentials', subtitle: 'Upload your degrees or certificates (Max 5).' }
            ];
        } else {
            return [
                ...baseSlides,
                { id: 'student_needs', icon: '🧠', title: 'Learning Goals', subtitle: 'What exactly do you need help with?' }
            ];
        }
    }, [isTutor, user?.name]);

    const handleTextChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (slideErrors[e.target.name]) setSlideErrors({ ...slideErrors, [e.target.name]: null });
    };

    // FIX: Actually use this function to handle redirects
    const handleOnboardingComplete = () => {
        if (isTutor) {
            window.location.href = '/tutor-dashboard';
        } else {
            window.location.href = '/student-dashboard';
        }
    };

    const handleFileChange = (e) => {
        const fieldName = e.target.name;
        const selectedFiles = Array.from(e.target.files);
        
        for (let file of selectedFiles) {
            const error = validateFile(file);
            if (error) {
                setSlideErrors({ ...slideErrors, [fieldName]: error });
                e.target.value = ''; 
                return;
            }
        }

        setSlideErrors({ ...slideErrors, [fieldName]: null });

        if (fieldName === 'certificates') {
            setFiles({ ...files, certificates: selectedFiles.slice(0, 5) });
        } else {
            setFiles({ ...files, [fieldName]: selectedFiles[0] });
        }
    };

    const handleNext = () => {
        const currentSlide = slides[currentSlideIndex];
        const errors = validateSlide(currentSlide.id, formData, files, isTutor);

        if (Object.keys(errors).length > 0) {
            setSlideErrors(errors);
            return;
        }

        if (currentSlideIndex < slides.length - 1) {
            setCurrentSlideIndex(prev => prev + 1);
        } else {
            submitProfile();
        }
    };

    const handleBack = () => {
        if (currentSlideIndex > 0) setCurrentSlideIndex(prev => prev - 1);
    };

    const submitProfile = async () => {
        setGlobalError('');
        setIsLoading(true);

        const submitData = new FormData();
        
        Object.keys(formData).forEach(key => {
            if (formData[key]) submitData.append(key, formData[key].trim());
        });

        if (files.avatar) submitData.append('avatar', files.avatar);
        if (isTutor) {
            if (files.nicFront) submitData.append('nicFront', files.nicFront);
            if (files.nicBack) submitData.append('nicBack', files.nicBack);
            if (files.certificates.length > 0) {
                files.certificates.forEach(file => submitData.append('certificates', file));
            }
        }

        try {
            await api.post('/profiles', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // FIX: Redirect to specific dashboard upon completion
            handleOnboardingComplete();
        } catch (err) {
            setGlobalError(err.response?.data?.message || 'Failed to submit profile. Please try again.');
            setIsLoading(false);
        }
    };

    const renderSlideContent = (slideId) => {
        switch (slideId) {
            case 'welcome':
                return (
                    <div className="text-center mt-4">
                        <div className="text-6xl mb-6 animate-bounce">🚀</div>
                        <p className="text-gray-600 text-lg font-medium">We need a few details to personalize your experience. You can skip this and do it later, but verified profiles get full access to the platform!</p>
                    </div>
                );
            case 'basics':
                return (
                    <div className="flex flex-col gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">📸 Profile Picture (Optional)</label>
                            <input type="file" name="avatar" accept="image/jpeg, image/png, image/jpg" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-blue-50 file:text-[#5b7cfa] hover:file:bg-blue-100 transition-all cursor-pointer"/>
                            {slideErrors.avatar && <p className="text-red-500 text-xs mt-1">{slideErrors.avatar}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">✍️ Short Bio {isTutor ? '*' : '(Optional)'}</label>
                            <textarea name="bio" rows="4" placeholder="I am passionate about..." value={formData.bio} onChange={handleTextChange} className={`w-full bg-gray-50 border ${slideErrors.bio ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all resize-none`}></textarea>
                            {slideErrors.bio && <p className="text-red-500 text-xs mt-1 animate-pulse">{slideErrors.bio}</p>}
                        </div>
                    </div>
                );
            case 'demographics':
                return (
                    <div className="flex flex-col gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">📅 Date of Birth *</label>
                            <input type="date" name="dob" value={formData.dob} onChange={handleTextChange} className={`w-full bg-gray-50 border ${slideErrors.dob ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all`}/>
                            {slideErrors.dob && <p className="text-red-500 text-xs mt-1 animate-pulse">{slideErrors.dob}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">🚻 Gender (Optional)</label>
                            <select name="gender" value={formData.gender} onChange={handleTextChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all appearance-none">
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                            </select>
                        </div>
                    </div>
                );
            case 'contact':
                return (
                    <div className="flex flex-col gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">📱 Phone Number *</label>
                            <input type="tel" name="phoneNumber" placeholder="e.g., 0712345678" value={formData.phoneNumber} onChange={handleTextChange} className={`w-full bg-gray-50 border ${slideErrors.phoneNumber ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all`}/>
                            {slideErrors.phoneNumber && <p className="text-red-500 text-xs mt-1 animate-pulse">{slideErrors.phoneNumber}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">🏙️ City *</label>
                                <input type="text" name="city" placeholder="Colombo" value={formData.city} onChange={handleTextChange} className={`w-full bg-gray-50 border ${slideErrors.city ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all`}/>
                                {slideErrors.city && <p className="text-red-500 text-xs mt-1 animate-pulse">{slideErrors.city}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">🌍 Country *</label>
                                <select name="country" value={formData.country} onChange={handleTextChange} className={`w-full bg-gray-50 border ${slideErrors.country ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all appearance-none`}>
                                    <option value="">Select Country</option>
                                    <option value="Sri Lanka">Sri Lanka</option>
                                    <option value="Other">Other</option>
                                </select>
                                {slideErrors.country && <p className="text-red-500 text-xs mt-1 animate-pulse">{slideErrors.country}</p>}
                            </div>
                        </div>
                    </div>
                );
            case 'emergency':
                return (
                    <div className="flex flex-col gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">👤 Contact Name *</label>
                            <input type="text" name="emergencyContactName" placeholder="Full Name" value={formData.emergencyContactName} onChange={handleTextChange} className={`w-full bg-gray-50 border ${slideErrors.emergencyContactName ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all`}/>
                            {slideErrors.emergencyContactName && <p className="text-red-500 text-xs mt-1 animate-pulse">{slideErrors.emergencyContactName}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">🤝 Relationship *</label>
                            <input type="text" name="emergencyContactRelation" placeholder="e.g., Parent, Spouse" value={formData.emergencyContactRelation} onChange={handleTextChange} className={`w-full bg-gray-50 border ${slideErrors.emergencyContactRelation ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all`}/>
                            {slideErrors.emergencyContactRelation && <p className="text-red-500 text-xs mt-1 animate-pulse">{slideErrors.emergencyContactRelation}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">📞 Emergency Phone *</label>
                            <input type="tel" name="emergencyContactPhone" placeholder="0712345678" value={formData.emergencyContactPhone} onChange={handleTextChange} className={`w-full bg-gray-50 border ${slideErrors.emergencyContactPhone ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all`}/>
                            {slideErrors.emergencyContactPhone && <p className="text-red-500 text-xs mt-1 animate-pulse">{slideErrors.emergencyContactPhone}</p>}
                        </div>
                    </div>
                );
            case 'academic':
                return (
                    <div className="flex flex-col gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">🏫 School or University *</label>
                            <input type="text" name="schoolOrUniversity" placeholder="e.g., Royal College / University of Colombo" value={formData.schoolOrUniversity} onChange={handleTextChange} className={`w-full bg-gray-50 border ${slideErrors.schoolOrUniversity ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all`}/>
                            {slideErrors.schoolOrUniversity && <p className="text-red-500 text-xs mt-1 animate-pulse">{slideErrors.schoolOrUniversity}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">📈 {isTutor ? 'Level You Teach' : 'Current Grade Level'} *</label>
                            <select name="gradeLevel" value={formData.gradeLevel} onChange={handleTextChange} className={`w-full bg-gray-50 border ${slideErrors.gradeLevel ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all appearance-none`}>
                                <option value="">Select Level</option>
                                <option value="Primary">Primary</option>
                                <option value="O/L">O/L</option>
                                <option value="A/L">A/L</option>
                                <option value="Undergraduate">Undergraduate</option>
                                <option value="Professional">Professional</option>
                                <option value="Other">Other</option>
                            </select>
                            {slideErrors.gradeLevel && <p className="text-red-500 text-xs mt-1 animate-pulse">{slideErrors.gradeLevel}</p>}
                        </div>
                    </div>
                );
            case 'student_needs':
                return (
                    <div className="flex flex-col gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">🎯 What are your learning goals? *</label>
                            <textarea name="learningNeeds" rows="4" placeholder="I need help with A/L Chemistry past papers..." value={formData.learningNeeds} onChange={handleTextChange} className={`w-full bg-gray-50 border ${slideErrors.learningNeeds ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all resize-none`}></textarea>
                            {slideErrors.learningNeeds && <p className="text-red-500 text-xs mt-1 animate-pulse">{slideErrors.learningNeeds}</p>}
                        </div>
                    </div>
                );
            case 'tutor_professional':
                return (
                    <div className="flex flex-col gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">📚 Subjects (Comma separated) *</label>
                            <input type="text" name="subjects" placeholder="Mathematics, Physics" value={formData.subjects} onChange={handleTextChange} className={`w-full bg-gray-50 border ${slideErrors.subjects ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all`}/>
                            {slideErrors.subjects && <p className="text-red-500 text-xs mt-1 animate-pulse">{slideErrors.subjects}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">⏳ Years of Experience *</label>
                            <input type="number" min="0" name="experience" placeholder="e.g., 5" value={formData.experience} onChange={handleTextChange} className={`w-full bg-gray-50 border ${slideErrors.experience ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all`}/>
                            {slideErrors.experience && <p className="text-red-500 text-xs mt-1 animate-pulse">{slideErrors.experience}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">🗓️ Availability *</label>
                            <input type="text" name="availability" placeholder="Weekends, Mon-Fri Evenings" value={formData.availability} onChange={handleTextChange} className={`w-full bg-gray-50 border ${slideErrors.availability ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all`}/>
                            {slideErrors.availability && <p className="text-red-500 text-xs mt-1 animate-pulse">{slideErrors.availability}</p>}
                        </div>
                    </div>
                );
            case 'tutor_identity':
                return (
                    <div className="flex flex-col gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">🆔 NIC Number *</label>
                            <input type="text" name="nicNumber" placeholder="981234567V" value={formData.nicNumber} onChange={handleTextChange} className={`w-full bg-gray-50 border ${slideErrors.nicNumber ? 'border-red-500' : 'border-gray-200'} rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all`}/>
                            {slideErrors.nicNumber && <p className="text-red-500 text-xs mt-1 animate-pulse">{slideErrors.nicNumber}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`border-2 border-dashed ${slideErrors.nicFront ? 'border-red-400 bg-red-50' : 'border-gray-300'} rounded-xl p-4 text-center hover:border-[#5b7cfa] transition-colors`}>
                                <label className="block text-sm font-bold text-gray-700 mb-2 cursor-pointer">🖼️ NIC Front *</label>
                                <input type="file" name="nicFront" accept="image/jpeg, image/png, application/pdf" onChange={handleFileChange} className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-full file:border-0 file:font-semibold file:bg-blue-50 file:text-[#5b7cfa] cursor-pointer"/>
                                {slideErrors.nicFront && <p className="text-red-500 text-xs mt-2">{slideErrors.nicFront}</p>}
                            </div>
                            <div className={`border-2 border-dashed ${slideErrors.nicBack ? 'border-red-400 bg-red-50' : 'border-gray-300'} rounded-xl p-4 text-center hover:border-[#5b7cfa] transition-colors`}>
                                <label className="block text-sm font-bold text-gray-700 mb-2 cursor-pointer">🖼️ NIC Back *</label>
                                <input type="file" name="nicBack" accept="image/jpeg, image/png, application/pdf" onChange={handleFileChange} className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-full file:border-0 file:font-semibold file:bg-blue-50 file:text-[#5b7cfa] cursor-pointer"/>
                                {slideErrors.nicBack && <p className="text-red-500 text-xs mt-2">{slideErrors.nicBack}</p>}
                            </div>
                        </div>
                    </div>
                );
            case 'tutor_certificates':
                return (
                    <div className="flex flex-col gap-6 text-center mt-4">
                        <div className="text-5xl mb-2">🎓</div>
                        <div className={`border-2 border-dashed ${slideErrors.certificates ? 'border-red-400 bg-red-50' : 'border-gray-300'} rounded-2xl p-8 hover:border-[#5b7cfa] transition-colors`}>
                            <label className="block text-base font-bold text-gray-700 mb-4 cursor-pointer">Upload Certificates (PDF or Images) *</label>
                            <input type="file" name="certificates" multiple accept="image/jpeg, image/png, application/pdf" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:font-semibold file:bg-[#5b7cfa] file:text-white hover:file:bg-[#4a6be0] cursor-pointer transition-all"/>
                            <p className="text-xs text-gray-400 mt-4">Hold Ctrl/Cmd to select multiple. Max 5 files. Max 2MB each.</p>
                            {slideErrors.certificates && <p className="text-red-500 text-sm mt-3 animate-pulse font-semibold">{slideErrors.certificates}</p>}
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#eef2f6] to-[#d9e2f8] flex flex-col items-center justify-center p-4 sm:p-8 font-sans overflow-hidden">
            
            {globalError && (
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-xl shadow-lg z-50 flex items-center gap-3">
                    <span className="text-xl">⚠️</span>
                    <span className="font-semibold text-sm">{globalError}</span>
                    <button onClick={() => setGlobalError('')} className="ml-4 font-bold text-lg hover:text-red-900">&times;</button>
                </div>
            )}

            <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden relative min-h-[500px] flex flex-col">
                
                {/* Progress Bar */}
                <div className="h-2 w-full bg-gray-100 absolute top-0 left-0">
                    <div 
                        className="h-full bg-[#5b7cfa] transition-all duration-500 ease-out rounded-r-full" 
                        style={{ width: `${((currentSlideIndex + 1) / slides.length) * 100}%` }}
                    ></div>
                </div>

                {/* Header */}
                <div className="pt-12 px-8 sm:px-12 pb-4 text-center">
                    <span className="text-4xl mb-4 block">{slides[currentSlideIndex].icon}</span>
                    <h1 className="text-3xl font-extrabold text-gray-800 mb-2 transition-all">{slides[currentSlideIndex].title}</h1>
                    <p className="text-sm text-gray-500 font-medium">{slides[currentSlideIndex].subtitle}</p>
                </div>

                {/* Sliding Form Container */}
                <div className="flex-1 px-8 sm:px-12 py-6 overflow-hidden relative">
                    <div className="w-full transition-transform duration-500 ease-in-out">
                        {renderSlideContent(slides[currentSlideIndex].id)}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 sm:px-12 sm:pb-8 sm:pt-4 bg-gray-50/50 flex justify-between items-center border-t border-gray-100 mt-auto">
                    {currentSlideIndex === 0 ? (
                        // FIX: Attached the redirect function to the Skip button
                        <button onClick={handleOnboardingComplete} className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">
                            Skip for now
                        </button>
                    ) : (
                        <button onClick={handleBack} className="text-sm font-bold text-gray-500 hover:text-[#5b7cfa] px-6 py-2.5 rounded-full hover:bg-blue-50 transition-all">
                            ← Back
                        </button>
                    )}

                    {currentSlideIndex < slides.length - 1 ? (
                        <button onClick={handleNext} className="bg-[#5b7cfa] text-white font-bold px-8 py-3 rounded-full shadow-lg hover:bg-[#4a6be0] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all">
                            Next
                        </button>
                    ) : (
                        <button onClick={handleNext} disabled={isLoading} className={`bg-green-500 text-white font-bold px-8 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all ${isLoading ? 'opacity-70 cursor-wait' : 'hover:bg-green-600 hover:-translate-y-0.5 active:translate-y-0 active:scale-95'}`}>
                            {isLoading ? 'Submitting...' : 'Complete Profile ✅'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Onboarding;