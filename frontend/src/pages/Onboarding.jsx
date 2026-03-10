import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Onboarding = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        bio: '', phoneNumber: '', city: '', country: 'Sri Lanka', dob: '', gender: 'Prefer not to say', nicNumber: '',
        emergencyContactName: '', emergencyContactRelation: '', emergencyContactPhone: '',
        subjects: '', experience: '', availability: '', gradeLevel: '', schoolOrUniversity: '', learningNeeds: ''
    });

    const [files, setFiles] = useState({
        avatar: null, nicFront: null, nicBack: null, certificates: []
    });

    const isTutor = user?.role === 'tutor' || user?.role === 'Tutor';

    const handleTextChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.name === 'certificates') {
            setFiles({ ...files, certificates: Array.from(e.target.files) });
        } else {
            setFiles({ ...files, [e.target.name]: e.target.files[0] });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const submitData = new FormData();
        
        Object.keys(formData).forEach(key => {
            if (formData[key]) submitData.append(key, formData[key]);
        });

        if (files.avatar) submitData.append('avatar', files.avatar);
        if (files.nicFront) submitData.append('nicFront', files.nicFront);
        if (files.nicBack) submitData.append('nicBack', files.nicBack);
        if (files.certificates.length > 0) {
            files.certificates.forEach(file => {
                submitData.append('certificates', file);
            });
        }

        try {
            await api.post('/profiles', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit profile. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    return (
        <div className="min-h-screen bg-[#eef2f6] flex flex-col items-center py-10 px-4 sm:px-6">
            <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="bg-[#5b7cfa] p-8 text-white text-center">
                    <h1 className="text-3xl font-extrabold mb-2">Welcome to StudyConnect!</h1>
                    <p className="text-sm opacity-90">Let's build your profile so you can start {isTutor ? 'teaching' : 'learning'}.</p>
                    
                    <div className="flex justify-center items-center mt-8 gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-white text-[#5b7cfa]' : 'bg-white/30'}`}>1</div>
                        <div className={`h-1 w-12 rounded ${step >= 2 ? 'bg-white' : 'bg-white/30'}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-white text-[#5b7cfa]' : 'bg-white/30'}`}>2</div>
                        <div className={`h-1 w-12 rounded ${step >= 3 ? 'bg-white' : 'bg-white/30'}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-white text-[#5b7cfa]' : 'bg-white/30'}`}>3</div>
                    </div>
                </div>

                <div className="p-8 sm:p-12">
                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm font-semibold border-l-4 border-red-500">
                            {error}
                        </div>
                    )}

                    <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
                        
                        {step === 1 && (
                            <div className="animate-fade-in flex flex-col gap-5">
                                <h2 className="text-xl font-bold text-gray-800 mb-2">Personal Details</h2>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Profile Avatar</label>
                                    <input type="file" name="avatar" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"/>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number *</label>
                                        <input type="tel" name="phoneNumber" required value={formData.phoneNumber} onChange={handleTextChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth *</label>
                                        <input type="date" name="dob" required value={formData.dob} onChange={handleTextChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Gender *</label>
                                        <select name="gender" value={formData.gender} onChange={handleTextChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all">
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                            <option value="Prefer not to say">Prefer not to say</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">NIC Number *</label>
                                        <input type="text" name="nicNumber" required value={formData.nicNumber} onChange={handleTextChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">City *</label>
                                        <input type="text" name="city" required value={formData.city} onChange={handleTextChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
                                        <input type="text" name="country" value={formData.country} onChange={handleTextChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Bio</label>
                                    <textarea name="bio" rows="3" value={formData.bio} onChange={handleTextChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all"></textarea>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-fade-in flex flex-col gap-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 mb-4">Emergency Contact</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <input type="text" name="emergencyContactName" placeholder="Full Name *" required value={formData.emergencyContactName} onChange={handleTextChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all"/>
                                        <input type="text" name="emergencyContactRelation" placeholder="Relationship *" required value={formData.emergencyContactRelation} onChange={handleTextChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all"/>
                                        <input type="tel" name="emergencyContactPhone" placeholder="Phone Number *" required value={formData.emergencyContactPhone} onChange={handleTextChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all"/>
                                    </div>
                                </div>

                                <div className="mt-4 pt-6 border-t border-gray-100">
                                    <h2 className="text-xl font-bold text-gray-800 mb-4">{isTutor ? 'Professional Experience' : 'Academic Profile'}</h2>
                                    
                                    {isTutor ? (
                                        <div className="flex flex-col gap-4">
                                            <input type="text" name="subjects" placeholder="Subjects (comma separated)" value={formData.subjects} onChange={handleTextChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all"/>
                                            <input type="text" name="experience" placeholder="Years of Experience" value={formData.experience} onChange={handleTextChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all"/>
                                            <input type="text" name="availability" placeholder="Availability (e.g. Weekends, Mon-Fri Evenings)" value={formData.availability} onChange={handleTextChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all"/>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-4">
                                            <input type="text" name="gradeLevel" placeholder="Current Grade Level" value={formData.gradeLevel} onChange={handleTextChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all"/>
                                            <input type="text" name="schoolOrUniversity" placeholder="School or University" value={formData.schoolOrUniversity} onChange={handleTextChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all"/>
                                            <input type="text" name="learningNeeds" placeholder="Specific Learning Needs" value={formData.learningNeeds} onChange={handleTextChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all"/>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-fade-in flex flex-col gap-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-2">Identity & Verification</h2>
                                <p className="text-sm text-gray-500 mb-4">To keep StudyConnect secure, we require an ID verification. Your files are encrypted and secure.</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#5b7cfa] transition-colors">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 cursor-pointer">NIC Front Image</label>
                                        <input type="file" name="nicFront" accept="image/*,application/pdf" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"/>
                                    </div>
                                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#5b7cfa] transition-colors">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 cursor-pointer">NIC Back Image</label>
                                        <input type="file" name="nicBack" accept="image/*,application/pdf" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"/>
                                    </div>
                                </div>

                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#5b7cfa] transition-colors mt-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 cursor-pointer">Upload Certificates (Optional, Max 5)</label>
                                    <input type="file" name="certificates" multiple accept="image/*,application/pdf" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"/>
                                    <p className="text-xs text-gray-400 mt-2">Hold Ctrl (or Cmd) to select multiple files.</p>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-100">
                            {step > 1 ? (
                                <button type="button" onClick={prevStep} className="px-8 py-3 rounded-lg font-bold text-gray-600 hover:bg-gray-100 transition-colors">Back</button>
                            ) : (
                                <button type="button" onClick={() => navigate('/')} className="px-8 py-3 rounded-lg font-bold text-gray-400 hover:text-gray-600 transition-colors">Skip for now</button>
                            )}
                            
                            {step < 3 ? (
                                <button type="submit" className="px-8 py-3 rounded-lg font-bold bg-[#5b7cfa] text-white hover:bg-[#4a6be0] shadow-md transition-transform active:scale-95">Next Step</button>
                            ) : (
                                <button type="submit" disabled={isLoading} className={`px-8 py-3 rounded-lg font-bold bg-[#5b7cfa] text-white shadow-md transition-transform flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#4a6be0] active:scale-95'}`}>
                                    {isLoading ? 'Uploading...' : 'Submit Profile'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;