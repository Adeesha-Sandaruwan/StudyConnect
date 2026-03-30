import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            // FIX: Actually utilizing the 'err' variable to pull the exact backend error message
            setError(err.response?.data?.message || 'Failed to load notifications.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNotificationClick = async (notif) => {
        navigate(`/posts/${notif.post?._id}`);
        
        if (!notif.isRead) {
            try {
                await api.put(`/notifications/${notif._id}/read`);
                setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
            } catch (err) {
                console.error('Failed to mark notification as read:', err);
            }
        }
    };

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    };

    if (isLoading) {
        return (
            <div className="min-h-[80vh] flex justify-center items-center">
                <div className="w-12 h-12 border-4 border-[#5b7cfa] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 font-sans pb-24">
            <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 mb-8">
                <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight mb-2">Notifications</h1>
                <p className="text-gray-500 text-sm mb-8">Stay updated on answers and upvotes on your study posts.</p>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 font-semibold border-l-4 border-red-500">
                        {error}
                    </div>
                )}

                {notifications.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
                        <span className="text-5xl block mb-4">🔕</span>
                        <h3 className="text-xl font-bold text-gray-700">All caught up!</h3>
                        <p className="text-gray-500 mt-2">You do not have any new notifications right now.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {notifications.map(notif => (
                            <div 
                                key={notif._id} 
                                onClick={() => handleNotificationClick(notif)}
                                className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer transition-all border ${notif.isRead ? 'bg-white border-gray-100 hover:border-gray-200' : 'bg-blue-50/50 border-blue-100 shadow-sm hover:shadow-md'}`}
                            >
                                <div className="shrink-0 relative mt-1">
                                    {notif.sender?.avatar ? (
                                        <img src={notif.sender.avatar} alt="avatar" className="w-12 h-12 rounded-full object-cover shadow-sm" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-[#5b7cfa]/10 flex items-center justify-center text-[#5b7cfa] font-extrabold text-lg">
                                            {notif.sender?.name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                        {notif.type === 'upvote' ? (
                                            <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                                            </div>
                                        ) : (
                                            <div className="w-5 h-5 bg-blue-100 text-[#5b7cfa] rounded-full flex items-center justify-center">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start gap-2">
                                        <p className="text-sm text-gray-800 leading-snug">
                                            <span className="font-extrabold">{notif.sender?.name || 'Someone'}</span> 
                                            {notif.type === 'upvote' ? ' upvoted your post ' : ' answered your post '}
                                            <span className="font-semibold">"{notif.post?.title || 'a deleted post'}"</span>
                                        </p>
                                        {!notif.isRead && (
                                            <div className="w-2.5 h-2.5 bg-[#5b7cfa] rounded-full shrink-0 mt-1"></div>
                                        )}
                                    </div>
                                    <span className={`text-xs mt-1 block ${notif.isRead ? 'text-gray-400' : 'text-[#5b7cfa] font-semibold'}`}>
                                        {timeAgo(notif.createdAt)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;