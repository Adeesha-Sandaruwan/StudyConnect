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
            
            // 1. Set the initial fetched notifications
            setNotifications(res.data);

            // 2. The Auto-Clear Magic
            const unreadNotifs = res.data.filter(n => !n.isRead);
            if (unreadNotifs.length > 0) {
                // Fire off read requests to the backend silently without making the user wait
                unreadNotifs.forEach(notif => {
                    api.put(`/notifications/${notif._id}/read`).catch(console.error);
                });
                
                // Instantly update the local state so the UI (and the NavBar on the next click) registers them as read
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            }

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load notifications.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.isRead) {
            try {
                await api.put(`/notifications/${notif._id}/read`);
                setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
            } catch (err) {
                console.error('Failed to mark notification as read:', err);
            }
        }

        if (notif.type === 'request-resource-shared') {
            navigate('/student-requests');
        } else if (notif.type === 'kyc-status') {
            navigate(notif.actionLink || '/profile');
        } else {
            const postId = notif.post?._id;
            navigate(`/posts/${postId || 'deleted'}`);
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

    const getNotificationCopy = (notif) => {
        if (notif.type === 'request-resource-shared') {
            const subject = notif.studentRequest?.subject || 'your request';
            return {
                iconBg: 'bg-linear-to-br from-indigo-100 to-violet-100 text-indigo-700',
                icon: (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2M22 12A10 10 0 112 12a10 10 0 0120 0z"></path></svg>
                ),
                text: (
                    <>
                        <span className="font-extrabold">{notif.sender?.name || 'Your tutor'}</span>
                        {' shared '}
                        <span className="font-semibold">{notif.title || notif.resourceType || 'a resource'}</span>
                        {' on '}
                        <span className="font-semibold">{subject}</span>
                        {notif.message ? `.` : ''}
                    </>
                ),
                subtext: notif.message || 'Open your request to see the shared lesson, note, or PDF.'
            };
        }

        if (notif.type === 'kyc-status') {
            const isApproved = (notif.title || '').toLowerCase().includes('approved') || (notif.message || '').toLowerCase().includes('approved');
            const isRejected = (notif.title || '').toLowerCase().includes('rejected') || (notif.message || '').toLowerCase().includes('rejected');

            return {
                iconBg: isApproved
                    ? 'bg-linear-to-br from-emerald-100 to-green-100 text-emerald-700'
                    : isRejected
                        ? 'bg-linear-to-br from-rose-100 to-red-100 text-rose-700'
                        : 'bg-linear-to-br from-amber-100 to-yellow-100 text-amber-700',
                icon: isApproved ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                ) : isRejected ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M10.29 3.86l-8.49 14.72A2 2 0 003.52 21h16.96a2 2 0 001.72-3.42L13.71 3.86a2 2 0 00-3.42 0z"></path></svg>
                ),
                text: (
                    <>
                        <span className="font-extrabold">{notif.sender?.name || 'Admin'}</span>
                        {' '}updated your KYC status to{' '}
                        <span className="font-semibold">{notif.title || 'pending'}</span>
                    </>
                ),
                subtext: notif.message || 'Open your profile to review the latest KYC status.'
            };
        }

        return {
            iconBg: notif.type === 'upvote' ? 'bg-linear-to-br from-emerald-100 to-green-100 text-emerald-700' : 'bg-linear-to-br from-blue-100 to-indigo-100 text-[#4d67dd]',
            icon: notif.type === 'upvote' ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
            ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            ),
            text: (
                <>
                    <span className="font-extrabold">{notif.sender?.name || 'Someone'}</span>
                    {notif.type === 'upvote' ? ' upvoted your post ' : ' answered your post '}
                    <span className="font-semibold">"{notif.post?.title || 'a deleted post'}"</span>
                </>
            ),
            subtext: ''
        };
    };

    if (isLoading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center bg-linear-to-b from-[#eef5ff] via-[#f6f5ff] to-[#fff6ef]">
                <div className="rounded-2xl border border-[#d9e4ff] bg-white px-6 py-5 shadow-sm">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#5b7cfa] border-t-transparent"></div>
                </div>
            </div>
        );
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-linear-to-b from-[#eef5ff] via-[#f7f5ff] to-[#fff8f1] pb-24">
            <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
                <div className="mb-6 overflow-hidden rounded-3xl border border-[#d6e2ff] bg-white shadow-sm">
                    <div className="bg-linear-to-r from-[#e6eeff] via-[#f1efff] to-[#fff1e5] px-6 py-7 sm:px-8">
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Notifications</h1>
                        <p className="mt-2 text-sm text-gray-600">Stay updated on study post activity and tutor resources shared on your requests.</p>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-[#ccdaff] bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#4b66dd]">
                                Total {notifications.length}
                            </span>
                            <span className="rounded-full border border-[#ffd8d8] bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-600">
                                Unread {unreadCount}
                            </span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-2xl border border-rose-200 bg-linear-to-r from-rose-50 to-pink-50 p-4 text-sm font-semibold text-rose-700">
                        {error}
                    </div>
                )}

                {notifications.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-[#d7e2ff] bg-white px-6 py-12 text-center shadow-sm">
                        <span className="text-5xl block mb-4">🔕</span>
                        <h3 className="text-xl font-bold text-gray-800">All caught up!</h3>
                        <p className="mt-2 text-gray-500">You do not have any new notifications right now.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {notifications.map(notif => {
                            const copy = getNotificationCopy(notif);
                            const unreadCard = !notif.isRead;

                            return (
                            <div 
                                key={notif._id} 
                                onClick={() => handleNotificationClick(notif)}
                                className={`group relative flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-all ${unreadCard ? 'border-[#cfdcff] bg-linear-to-r from-[#f5f8ff] to-[#fdf8ff] shadow-sm hover:-translate-y-0.5 hover:shadow-md' : 'border-gray-100 bg-white hover:border-[#d7e2ff]'}`}
                            >
                                <div className={`absolute inset-y-3 left-0 w-1 rounded-r-full ${unreadCard ? 'bg-linear-to-b from-[#5b7cfa] to-[#8f66f4]' : 'bg-transparent'}`} />

                                <div className="shrink-0 relative mt-1">
                                    {notif.sender?.avatar ? (
                                        <img src={notif.sender.avatar} alt="avatar" className="h-12 w-12 rounded-full object-cover shadow-sm ring-2 ring-white" />
                                    ) : (
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-[#e8eeff] to-[#e8f5ff] text-lg font-extrabold text-[#5b7cfa]">
                                            {notif.sender?.name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow-sm">
                                        <div className={`flex h-5 w-5 items-center justify-center rounded-full ${copy.iconBg}`}>
                                            {copy.icon}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm leading-snug text-gray-800">{copy.text}</p>
                                            {copy.subtext && (
                                                <p className="mt-1 text-xs leading-relaxed text-gray-500">{copy.subtext}</p>
                                            )}
                                        </div>
                                        {!notif.isRead && (
                                            <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-linear-to-r from-[#5b7cfa] to-[#8c67f4]"></div>
                                        )}
                                    </div>

                                    <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs ${notif.isRead ? 'bg-gray-100 text-gray-500' : 'bg-[#e8eeff] font-semibold text-[#4b67de]'}`}>
                                        {timeAgo(notif.createdAt)}
                                    </span>
                                </div>
                            </div>
                        )})}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;