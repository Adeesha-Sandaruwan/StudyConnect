import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const UpArrowIcon = ({ filled }) => (
    <svg className="w-6 h-6" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? "0" : "1.5"} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4l-7 7h4v9h6v-9h4l-7-7z" />
    </svg>
);

const DownArrowIcon = ({ filled }) => (
    <svg className="w-6 h-6" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? "0" : "1.5"} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20l7-7h-4V4H9v9H5l7 7z" />
    </svg>
);

const FRIENDLY_POST_REMOVED_MSG = 'This post was removed or is no longer available.';
const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

const SinglePost = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [post, setPost] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [isVerified, setIsVerified] = useState(false);

    const [answerText, setAnswerText] = useState('');
    const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
    const [answerError, setAnswerError] = useState('');

    useEffect(() => {
        const checkVerification = async () => {
            if (user?.role === 'admin') {
                setIsVerified(true);
                return;
            }
            try {
                const res = await api.get('/profiles/me');
                setIsVerified(res.data.verificationStatus === 'verified');
            } catch {
                setIsVerified(false);
            }
        };
        checkVerification();
        fetchPost();
    }, [id, user]);

    const fetchPost = async () => {
        setIsLoading(true);

        if (!id || !OBJECT_ID_REGEX.test(id)) {
            setPost(null);
            setError(FRIENDLY_POST_REMOVED_MSG);
            setIsLoading(false);
            return;
        }

        try {
            const res = await api.get(`/studyposts/${id}`);
            setPost(res.data);
        } catch (err) {
            const status = err.response?.status;
            const serverMessage = err.response?.data?.message || '';
            const castObjectIdError = typeof serverMessage === 'string' && serverMessage.includes('Cast to ObjectId failed');

            if (status === 404 || status === 400 || castObjectIdError) {
                setError(FRIENDLY_POST_REMOVED_MSG);
            } else {
                setError('Failed to load the study post. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // OPTIMISTIC UI VOTE HANDLER
    const handleVote = async (type) => {
        if (!isVerified) {
            alert('You must complete onboarding and be verified by an admin to vote.');
            return;
        }

        // Store original state
        const originalPost = { ...post };

        // Create copies of vote arrays
        let newUpvotes = [...(post.upvotes || [])];
        let newDownvotes = [...(post.downvotes || [])];
        const userId = user._id;

        // Apply logic optimistically
        if (type === 'upvote') {
            if (newUpvotes.includes(userId)) {
                newUpvotes = newUpvotes.filter(id => id !== userId);
            } else {
                newUpvotes.push(userId);
                newDownvotes = newDownvotes.filter(id => id !== userId);
            }
        } else if (type === 'downvote') {
            if (newDownvotes.includes(userId)) {
                newDownvotes = newDownvotes.filter(id => id !== userId);
            } else {
                newDownvotes.push(userId);
                newUpvotes = newUpvotes.filter(id => id !== userId);
            }
        }

        // Immediately update UI
        setPost(prev => ({ ...prev, upvotes: newUpvotes, downvotes: newDownvotes }));

        // Send to backend
        try {
            const res = await api.put(`/studyposts/${id}/${type}`);
            // Sync strictly with backend if needed, though UI is already updated
            setPost(prev => ({ ...prev, upvotes: res.data.upvotes, downvotes: res.data.downvotes }));
        } catch (err) {
            console.error('Vote failed, reverting UI', err);
            // Revert on failure
            setPost(originalPost);
        }
    };

    const handleDeletePost = async () => {
        if (!window.confirm("Are you sure you want to permanently delete this post?")) return;
        try {
            await api.delete(`/studyposts/${id}`);
            navigate('/posts');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete post.');
        }
    };

    const handleAddAnswer = async (e) => {
        e.preventDefault();
        if (!isVerified || !answerText.trim()) return;
        setAnswerError('');
        setIsSubmittingAnswer(true);

        try {
            const res = await api.post(`/studyposts/${id}/answer`, { text: answerText });
            const newAnswer = res.data[res.data.length - 1]; 
            const populatedAnswer = { ...newAnswer, user: { _id: user._id, name: user.name, avatar: user.avatar, role: user.role } };
            
            setPost(prev => ({ ...prev, answers: [...prev.answers, populatedAnswer] }));
            setAnswerText('');
        } catch (err) {
            setAnswerError(err.response?.data?.message || 'Failed to submit answer.');
        } finally {
            setIsSubmittingAnswer(false);
        }
    };

    const handleDeleteAnswer = async (answerId) => {
        if (!window.confirm("Delete this answer?")) return;
        try {
            await api.delete(`/studyposts/${id}/answer/${answerId}`);
            setPost(prev => ({ ...prev, answers: prev.answers.filter(a => a._id !== answerId) }));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete answer.');
        }
    };

    const nextMedia = () => setCurrentMediaIndex((prev) => (prev === post.media.length - 1 ? 0 : prev + 1));
    const prevMedia = () => setCurrentMediaIndex((prev) => (prev === 0 ? post.media.length - 1 : prev - 1));
    const isPdf = (url) => url?.toLowerCase().includes('.pdf');

    if (isLoading) return <div className="min-h-[80vh] flex justify-center items-center"><div className="w-10 h-10 border-4 border-[#5b7cfa] border-t-transparent rounded-full animate-spin"></div></div>;
    if (error || !post) return <div className="max-w-2xl mx-auto p-8 mt-12 bg-white rounded-2xl shadow-sm text-center border border-gray-200"><svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg><h2 className="text-xl font-bold text-gray-900">{error || 'Post not found'}</h2><button onClick={() => navigate('/posts')} className="mt-6 bg-gray-100 text-gray-700 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors">← Back to Feed</button></div>;

    const canDeletePost = user?._id === post.user?._id || user?.role === 'admin';
    const hasUpvoted = post.upvotes?.includes(user?._id);
    const hasDownvoted = post.downvotes?.includes(user?._id);
    const voteCount = (post.upvotes?.length || 0) - (post.downvotes?.length || 0);

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 font-sans pb-32">
            
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => navigate('/posts')} className="text-xs sm:text-sm font-bold text-gray-600 hover:text-[#5b7cfa] flex items-center gap-1.5 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Back to Feed
                </button>
                {canDeletePost && (
                    <button onClick={handleDeletePost} className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Delete Post
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6 border border-gray-200 flex flex-col sm:flex-row">
                
                <div className={`hidden sm:flex flex-col items-center py-5 px-2 min-w-16 border-r transition-colors ${hasUpvoted ? 'bg-[#5b7cfa] border-[#5b7cfa] text-white' : hasDownvoted ? 'bg-red-500 border-red-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-600'}`} onClick={(e) => e.preventDefault()}>
                    <button onClick={() => handleVote('upvote')} className={`p-1.5 rounded-full hover:bg-black/10 transition-colors`}>
                        <UpArrowIcon filled={hasUpvoted} />
                    </button>
                    <span className="text-base font-extrabold my-1.5">
                        {voteCount}
                    </span>
                    <button onClick={() => handleVote('downvote')} className={`p-1.5 rounded-full hover:bg-black/10 transition-colors`}>
                        <DownArrowIcon filled={hasDownvoted} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col">
                    <div className="p-4 sm:p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {post.user?.avatar ? (
                                    <img src={post.user.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-gray-100" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-[#5b7cfa]/10 flex items-center justify-center text-[#5b7cfa] font-bold text-xs">
                                        {post.user?.name?.charAt(0) || '?'}
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-bold text-gray-900 text-sm leading-tight hover:underline cursor-pointer">{post.user?.name || 'Unknown User'}</h3>
                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${post.user?.role === 'tutor' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {post.user?.role || 'Student'}
                                        </span>
                                        <span className="text-xs text-gray-400 font-medium">• {new Date(post.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider">
                                {post.subjectTag || 'General'}
                            </span>
                        </div>

                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-3 leading-snug">{post.title}</h1>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">{post.description}</p>
                    </div>

                    {post.media && post.media.length > 0 && (
                        <div className="relative bg-gray-50 border-y border-gray-200 p-2 sm:p-4 flex justify-center items-center min-h-75">
                            {isPdf(post.media[currentMediaIndex]) ? (
                                <div className="text-center w-full max-w-sm bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                    <svg className="w-12 h-12 mx-auto text-red-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                    <h4 className="font-bold text-gray-900 mb-3 text-sm">PDF Document Attached</h4>
                                    <a href={post.media[currentMediaIndex]} target="_blank" rel="noreferrer" className="inline-block bg-gray-900 text-white px-5 py-2 rounded-full font-bold text-xs shadow-sm hover:bg-gray-800 transition-colors">
                                        Open Document
                                    </a>
                                </div>
                            ) : (
                                <img src={post.media[currentMediaIndex]} alt="Post attachment" className="max-h-125 w-auto object-contain rounded-lg shadow-sm border border-gray-200" />
                            )}

                            {post.media.length > 1 && (
                                <>
                                    <button onClick={prevMedia} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 text-gray-800 w-8 h-8 rounded-full shadow-md flex items-center justify-center font-bold hover:bg-white transition-all border border-gray-200">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
                                    </button>
                                    <button onClick={nextMedia} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 text-gray-800 w-8 h-8 rounded-full shadow-md flex items-center justify-center font-bold hover:bg-white transition-all border border-gray-200">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                                    </button>
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/50 px-2.5 py-1.5 rounded-full backdrop-blur-md">
                                        {post.media.map((_, idx) => (
                                            <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentMediaIndex ? 'bg-white scale-150' : 'bg-white/50'}`} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex sm:hidden items-center justify-between p-3 bg-gray-50 border-t border-gray-200">
                        <div className={`flex items-center rounded-full border transition-colors ${hasUpvoted ? 'bg-[#5b7cfa] border-[#5b7cfa] text-white' : hasDownvoted ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-gray-200 text-gray-700 shadow-sm'}`}>
                            <button onClick={() => handleVote('upvote')} className="p-1.5 rounded-l-full hover:bg-black/5 transition-colors">
                                <UpArrowIcon filled={hasUpvoted} />
                            </button>
                            <span className="text-sm font-extrabold min-w-6 text-center">
                                {voteCount}
                            </span>
                            <button onClick={() => handleVote('downvote')} className="p-1.5 rounded-r-full hover:bg-black/5 transition-colors">
                                <DownArrowIcon filled={hasDownvoted} />
                            </button>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 font-bold text-xs">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                            {post.answers?.length || 0} Answers
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 max-w-3xl mx-auto">
                <h3 className="text-lg font-extrabold text-gray-900 mb-4 px-2">
                    Answers
                </h3>
                
                {post.answers?.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-sm">
                        <p className="text-gray-500 text-sm font-medium">No answers yet. Be the first to help out!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {post.answers.map(answer => {
                            const canDeleteAnswer = user?._id === answer.user?._id || user?._id === post.user?._id || user?.role === 'admin';

                            return (
                                <div key={answer._id} className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-200 relative group flex gap-3 sm:gap-4">
                                    <div className="shrink-0 flex flex-col items-center">
                                        {answer.user?.avatar ? (
                                            <img src={answer.user.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-gray-100" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs">
                                                {answer.user?.name?.charAt(0) || '?'}
                                            </div>
                                        )}
                                        <div className="w-px h-full bg-gray-100 mt-2 rounded-full"></div>
                                    </div>
                                    <div className="flex-1 pb-1">
                                        <div className="flex items-start justify-between mb-1.5">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="font-bold text-sm text-gray-900 hover:underline cursor-pointer">{answer.user?.name || 'Unknown'}</span>
                                                <span className="text-[9px] text-gray-500 font-extrabold uppercase bg-gray-100 px-1.5 py-0.5 rounded tracking-wider">{answer.user?.role}</span>
                                                <span className="text-xs text-gray-400 font-medium">• {new Date(answer.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                            </div>
                                            {canDeleteAnswer && (
                                                <button onClick={() => handleDeleteAnswer(answer._id)} className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{answer.text}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            <div className="mt-8 sticky bottom-6 z-10 mx-auto max-w-3xl">
                {answerError && <div className="bg-red-50 text-red-600 text-xs font-bold px-4 py-2.5 rounded-xl mb-3 shadow-sm border border-red-100">{answerError}</div>}
                <form onSubmit={handleAddAnswer} className={`bg-white p-2 pl-5 rounded-full shadow-lg border border-gray-200 flex items-center transition-all ${isVerified ? 'focus-within:ring-2 focus-within:ring-[#5b7cfa] focus-within:border-transparent' : 'opacity-90 bg-gray-50'}`}>
                    <input 
                        type="text" 
                        placeholder={isVerified ? "Add a comment..." : "Verification required to comment."}
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm font-medium disabled:cursor-not-allowed placeholder-gray-400" 
                        disabled={!isVerified || isSubmittingAnswer}
                    />
                    <button type="submit" disabled={!isVerified || isSubmittingAnswer || !answerText.trim()} className={`px-6 py-2.5 rounded-full font-extrabold text-sm transition-all ${!isVerified || isSubmittingAnswer || !answerText.trim() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#5b7cfa] text-white hover:bg-[#4a6be0] shadow-sm hover:-translate-y-0.5'}`}>
                        {isSubmittingAnswer ? 'Posting...' : 'Reply'}
                    </button>
                </form>
            </div>

        </div>
    );
};

export default SinglePost;