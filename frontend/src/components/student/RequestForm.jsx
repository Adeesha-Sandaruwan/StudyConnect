import { useState } from 'react';

/**
 * RequestForm Component
 * Create/Edit student request form with validation
 * Fields: subject, description, gradeLevel, requestType, preferredSchedule, priority
 */

const RequestForm = ({ initialData = null, onSubmit, isLoading = false }) => {
    const SUBJECTS = [
        'Mathematics',
        'English',
        'Science',
        'History',
        'Geography',
        'ICT',
        'Other'
    ];

    const [formData, setFormData] = useState(initialData || {
        subject: '',
        description: '',
        gradeLevel: '',
        requestType: 'ongoing',
        priority: 'medium',
        preferredSchedule: ''
    });

    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!formData.subject.trim()) {
            newErrors.subject = 'Subject is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.trim().length < 20) {
            newErrors.description = 'Description must be at least 20 characters';
        }

        if (!formData.gradeLevel) {
            newErrors.gradeLevel = 'Grade level is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Subject */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Subject *
                </label>
                <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border bg-gray-50 font-semibold outline-none focus:ring-2 focus:ring-[#5b7cfa] transition-all appearance-none cursor-pointer ${
                        errors.subject 
                            ? 'border-red-300 focus:ring-red-300' 
                            : 'border-gray-200 focus:border-[#5b7cfa]'
                    }`}
                >
                    <option value="">Select a Subject</option>
                    {SUBJECTS.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                    ))}
                </select>
                {errors.subject && (
                    <p className="text-red-600 text-xs font-semibold mt-1.5 flex items-center gap-1">
                        <span>⚠️</span> {errors.subject}
                    </p>
                )}
            </div>

            {/* Grade Level */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Grade Level *
                </label>
                <select
                    name="gradeLevel"
                    value={formData.gradeLevel}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-xl border bg-gray-50 font-semibold outline-none focus:ring-2 focus:ring-[#5b7cfa] transition-all appearance-none cursor-pointer ${
                        errors.gradeLevel 
                            ? 'border-red-300 focus:ring-red-300' 
                            : 'border-gray-200 focus:border-[#5b7cfa]'
                    }`}
                >
                    <option value="">Select Grade Level</option>
                    {['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'University'].map((grade) => (
                        <option key={grade} value={grade}>{grade}</option>
                    ))}
                </select>
                {errors.gradeLevel && (
                    <p className="text-red-600 text-xs font-semibold mt-1.5 flex items-center gap-1">
                        <span>⚠️</span> {errors.gradeLevel}
                    </p>
                )}
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Description * (min. 20 characters)
                </label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe what you need help with, topics, specific areas of difficulty..."
                    rows="4"
                    maxLength="1000"
                    className={`w-full px-4 py-3 rounded-xl border bg-gray-50 font-semibold outline-none focus:ring-2 focus:ring-[#5b7cfa] transition-all resize-none ${
                        errors.description 
                            ? 'border-red-300 focus:ring-red-300' 
                            : 'border-gray-200 focus:border-[#5b7cfa]'
                    }`}
                ></textarea>
                <div className="flex items-center justify-between mt-1.5">
                    {errors.description && (
                        <p className="text-red-600 text-xs font-semibold flex items-center gap-1">
                            <span>⚠️</span> {errors.description}
                        </p>
                    )}
                    <p className="text-gray-500 text-xs ml-auto">
                        {formData.description.length}/1000
                    </p>
                </div>
            </div>

            {/* Request Type */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Request Type
                </label>
                <div className="flex gap-3">
                    {[
                        { value: 'one-time', label: '📅 One-time Session', desc: 'Single tutoring session' },
                        { value: 'ongoing', label: '🔄 Ongoing', desc: 'Regular sessions' }
                    ].map(type => (
                        <label key={type.value} className="flex-1 relative">
                            <input
                                type="radio"
                                name="requestType"
                                value={type.value}
                                checked={formData.requestType === type.value}
                                onChange={handleChange}
                                className="sr-only"
                            />
                            <div className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-center ${
                                formData.requestType === type.value
                                    ? 'border-[#5b7cfa] bg-blue-50'
                                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                            }`}>
                                <p className="font-bold text-sm text-gray-900">{type.label}</p>
                                <p className="text-xs text-gray-600 mt-0.5">{type.desc}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Priority */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Priority Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { value: 'low', label: 'Low', icon: '📍' },
                        { value: 'medium', label: 'Medium', icon: '📌' },
                        { value: 'high', label: 'High', icon: '🔺' }
                    ].map(priority => (
                        <label key={priority.value} className="relative">
                            <input
                                type="radio"
                                name="priority"
                                value={priority.value}
                                checked={formData.priority === priority.value}
                                onChange={handleChange}
                                className="sr-only"
                            />
                            <div className={`p-2 rounded-lg border cursor-pointer transition-all text-center text-xs font-bold ${
                                formData.priority === priority.value
                                    ? 'bg-blue-50 border-[#5b7cfa] text-[#5b7cfa]'
                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}>
                                <div>{priority.icon}</div>
                                {priority.label}
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Preferred Schedule */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                    Preferred Schedule (optional)
                </label>
                <input
                    type="text"
                    name="preferredSchedule"
                    value={formData.preferredSchedule}
                    onChange={handleChange}
                    placeholder="e.g., Weekends, After 5pm, ASAP..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 font-semibold outline-none focus:ring-2 focus:ring-[#5b7cfa] focus:border-[#5b7cfa] transition-all"
                />
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-xl font-bold text-white text-base transition-all flex items-center justify-center gap-2 ${
                    isLoading
                        ? 'bg-gray-400 cursor-wait'
                        : 'bg-[#5b7cfa] hover:bg-[#4a6be0] hover:-translate-y-0.5 shadow-md'
                }`}
            >
                {isLoading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                    </>
                ) : (
                    <>
                        {initialData ? '✏️ Update Request' : '🚀 Create Request'}
                    </>
                )}
            </button>
        </form>
    );
};

export default RequestForm;
