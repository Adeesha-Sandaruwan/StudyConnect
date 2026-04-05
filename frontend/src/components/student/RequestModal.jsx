import { useState, useEffect } from 'react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import Loader from '../Loader';

/**
 * RequestModal Component
 * Modal wrapper for detailed request view / quick edit
 * Shows full request info with ability to edit or close
 */

const RequestModal = ({ isOpen, request, onClose, onUpdate, isLoading = false, allowEdit = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(null);

    useEffect(() => {
        if (request) {
            setEditData({
                subject: request.subject,
                description: request.description,
                priority: request.priority,
                requestType: request.requestType,
                preferredSchedule: request.preferredSchedule || ''
            });
        }
    }, [request, isOpen]);

    if (!isOpen || !request) return null;

    const getGradeLabel = (grade) => {
        if (grade === 0) return 'Course/University';
        return `Grade ${grade}`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleEditChange = (field, value) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = () => {
        if (!allowEdit || typeof onUpdate !== 'function') return;
        onUpdate(request._id, editData);
        setIsEditing(false);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {isLoading && <Loader fullScreen={false} text="" />}

                {!isLoading && (
                    <>
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-blue-50">
                            <div>
                                <h2 className="text-2xl font-extrabold text-gray-900">
                                    {request.subject}
                                </h2>
                                <p className="text-xs text-gray-600 mt-1">
                                    Request ID: {request._id.slice(-8)}
                                </p>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="text-gray-400 hover:text-gray-800 text-3xl font-bold transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Status & Meta Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-600 uppercase mb-1.5">Status</p>
                                    <StatusBadge status={request.status} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-600 uppercase mb-1.5">Priority</p>
                                    <PriorityBadge priority={request.priority} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-600 uppercase mb-1.5">Grade Level</p>
                                    <span className="inline-flex px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg font-semibold text-xs">
                                        🎓 {getGradeLabel(request.gradeLevel)}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-600 uppercase mb-1.5">Type</p>
                                    <span className="inline-flex px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg font-semibold text-xs">
                                        {request.requestType === 'one-time' || request.requestType === 'once' ? '📅 One-time' : '🔄 Ongoing'}
                                    </span>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="border-t border-gray-100 pt-4">
                                <p className="text-xs font-bold text-gray-600 uppercase mb-3">Timeline</p>
                                <div className="flex gap-4 text-xs">
                                    <div>
                                        <p className="text-gray-600 font-semibold">Created</p>
                                        <p className="text-gray-900 font-bold mt-0.5">{formatDate(request.createdAt)}</p>
                                    </div>
                                    {request.updatedAt && (
                                        <div>
                                            <p className="text-gray-600 font-semibold">Last Updated</p>
                                            <p className="text-gray-900 font-bold mt-0.5">{formatDate(request.updatedAt)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="border-t border-gray-100 pt-4">
                                <p className="text-xs font-bold text-gray-600 uppercase mb-2">Description</p>
                                {isEditing ? (
                                    <textarea
                                        value={editData.description}
                                        onChange={(e) => handleEditChange('description', e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 font-semibold outline-none focus:ring-2 focus:ring-[#5b7cfa] transition-all resize-none h-24"
                                    />
                                ) : (
                                    <p className="text-gray-700 font-semibold leading-relaxed text-sm">
                                        {request.description}
                                    </p>
                                )}
                            </div>

                            {/* Student Info */}
                            {request.student && (
                                <div className="border-t border-gray-100 pt-4">
                                    <p className="text-xs font-bold text-gray-600 uppercase mb-3">Student</p>
                                    <div className="flex items-center gap-3 bg-sky-50 p-3 rounded-lg border border-sky-100">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-sky-500 to-[#5b7cfa] flex items-center justify-center text-white font-bold">
                                            {request.student.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{request.student.name}</p>
                                            <p className="text-xs text-gray-600">{request.student.email}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Assigned Tutor */}
                            {request.assignedTutor ? (
                                <div className="border-t border-gray-100 pt-4">
                                    <p className="text-xs font-bold text-gray-600 uppercase mb-3">Assigned Tutor</p>
                                    <div className="flex items-center gap-3 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold">
                                            {request.assignedTutor.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{request.assignedTutor.name}</p>
                                            <p className="text-xs text-gray-600">{request.assignedTutor.email}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-t border-gray-100 pt-4">
                                    <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg p-4 text-center">
                                        <p className="text-blue-700 font-bold text-sm">
                                            🎯 Waiting for a tutor assignment
                                        </p>
                                        <p className="text-blue-600 text-xs mt-1">
                                            Tutors can view this request and admins can assign one
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Preferred Schedule */}
                            {request.preferredSchedule && (
                                <div className="border-t border-gray-100 pt-4">
                                    <p className="text-xs font-bold text-gray-600 uppercase mb-1.5">Preferred Schedule</p>
                                    <p className="text-gray-700 font-semibold text-sm">
                                        🕐 {request.preferredSchedule}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditData({
                                                subject: request.subject,
                                                description: request.description,
                                                priority: request.priority,
                                                requestType: request.requestType,
                                                preferredSchedule: request.preferredSchedule || ''
                                            });
                                        }}
                                        className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isLoading}
                                        className="px-6 py-2.5 bg-[#5b7cfa] text-white rounded-lg font-bold hover:bg-[#4a6be0] transition-colors disabled:opacity-70 flex items-center gap-2"
                                    >
                                        💾 Save Changes
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                                    >
                                        Close
                                    </button>
                                    {allowEdit && typeof onUpdate === 'function' && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-6 py-2.5 bg-[#5b7cfa] text-white rounded-lg font-bold hover:bg-[#4a6be0] transition-colors flex items-center gap-2"
                                        >
                                            ✏️ Edit Request
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default RequestModal;
