import { useState } from 'react';
import api from '../services/api';

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
    const SUBJECTS = [
        'Mathematics', 'Physics', 'Chemistry', 'Biology', 
        'Computer Science', 'Languages', 'Business', 'Other'
    ];

    const [formData, setFormData] = useState({ title: '', description: '', subjectTag: '' });
    const [files, setFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length > 3) {
            setError('You can only upload a maximum of 3 media files.');
            return;
        }
        setError('');
        setFiles(selectedFiles);
    };

    const removeFile = (indexToRemove) => {
        setFiles(files.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.title.trim() || !formData.description.trim() || !formData.subjectTag) {
            setError('Please fill in all required fields.');
            return;
        }

        setIsLoading(true);

        const submitData = new FormData();
        submitData.append('title', formData.title.trim());
        submitData.append('description', formData.description.trim());
        submitData.append('subjectTag', formData.subjectTag);
        
        files.forEach(file => {
            submitData.append('media', file);
        });

        try {
            await api.post('/posts', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Reset form and tell the parent to refresh the feed
            setFormData({ title: '', description: '', subjectTag: '' });
            setFiles([]);
            onPostCreated(); 
            onClose();
        } catch (err) {
            // This will catch your 3rd-party Profanity API rejection message!
            setError(err.response?.data?.message || 'Failed to create post. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                        <span>📝</span> Create Study Post
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-2xl font-bold transition-colors">&times;</button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl shadow-sm mb-6 flex items-start gap-3">
                            <span className="text-lg">⚠️</span>
                            <span className="font-semibold text-sm mt-0.5">{error}</span>
                        </div>
                    )}

                    <form id="create-post-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Title *</label>
                            <input type="text" name="title" placeholder="What do you need help with?" value={formData.title} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#5b7cfa] transition-all" maxLength="100" />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Subject *</label>
                            <select name="subjectTag" value={formData.subjectTag} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#5b7cfa] transition-all appearance-none cursor-pointer">
                                <option value="">Select a Subject</option>
                                {SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Description *</label>
                            <textarea name="description" placeholder="Provide more details, formulas, or context..." value={formData.description} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#5b7cfa] transition-all resize-none h-32"></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Attachments (Max 3: Images or PDFs)</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#5b7cfa] transition-colors relative">
                                <input type="file" multiple accept="image/jpeg, image/png, image/jpg, application/pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <span className="text-3xl mb-2 block">📎</span>
                                <span className="text-sm font-bold text-[#5b7cfa]">Click to upload</span>
                                <span className="text-xs text-gray-500 block mt-1">or drag and drop files here</span>
                            </div>
                            
                            {/* File Preview Chips */}
                            {files.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {files.map((file, index) => (
                                        <div key={index} className="bg-blue-50 text-[#5b7cfa] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-blue-100">
                                            <span className="truncate max-w-[150px]">{file.name}</span>
                                            <button type="button" onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700 font-bold text-sm leading-none">&times;</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-300 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" form="create-post-form" disabled={isLoading} className={`bg-[#5b7cfa] text-white px-8 py-2.5 rounded-xl font-bold shadow-md flex items-center gap-2 transition-all ${isLoading ? 'opacity-70 cursor-wait' : 'hover:bg-[#4a6be0] hover:-translate-y-0.5'}`}>
                        {isLoading ? 'Posting...' : 'Publish Post 🚀'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default CreatePostModal;