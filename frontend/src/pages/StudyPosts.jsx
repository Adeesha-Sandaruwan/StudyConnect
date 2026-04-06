import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import CreatePostModal from '../components/CreatePostModal';

const UpArrowIcon = ({ filled }) => (
    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? "0" : "1.5"} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4l-7 7h4v9h6v-9h4l-7-7z" />
    </svg>
);

const DownArrowIcon = ({ filled }) => (
    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? "0" : "1.5"} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20l7-7h-4V4H9v9H5l7 7z" />
    </svg>
);

const StudyPosts = () => {
    const { user } = useContext(AuthContext);
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isVerified, setIsVerified] = useState(false);
    
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [keyword, setKeyword] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [subjectTag, setSubjectTag] = useState('');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const SUBJECTS = [
        'Mathematics', 'Physics', 'Chemistry', 'Biology', 
        'Computer Science', 'Languages', 'Business', 'Other'
    ];

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
    }, [user]);

    useEffect(() => {
        fetchPosts();
    }, [page, keyword, subjectTag]);

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            let query = `?page=${page}&limit=10`;
            if (keyword) query += `&keyword=${encodeURIComponent(keyword)}`;
            if (subjectTag) query += `&subjectTag=${encodeURIComponent(subjectTag)}`;

            const res = await api.get(`/studyposts${query}`);
            setPosts(res.data.posts);
            setTotalPages(res.data.pages);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setKeyword(searchInput);
        setPage(1); 
    };

    const handleSubjectChange = (tag) => {
        setSubjectTag(tag === subjectTag ? '' : tag);
        setPage(1); 
    };

    const handlePostCreated = () => {
        setPage(1); 
        fetchPosts(); 
    };

    // OPTIMISTIC UI VOTE HANDLER
    const handleVote = async (e, postId, type) => {
        e.preventDefault();
        if (!isVerified) {
            alert('You must complete onboarding and be verified by an admin to vote.');
            return;
        }

        // Store the current state in case we need to revert
        const originalPosts = [...posts];
        
        // Find the post being voted on
        const targetPost = posts.find(p => p._id === postId);
        if (!targetPost) return;

        // Create copies of the vote arrays
        let newUpvotes = [...(targetPost.upvotes || [])];
        let newDownvotes = [...(targetPost.downvotes || [])];
        const userId = user._id;

        // Apply logic optimistically
        if (type === 'upvote') {
            if (newUpvotes.includes(userId)) {
                newUpvotes = newUpvotes.filter(id => id !== userId); // Toggle off
            } else {
                newUpvotes.push(userId); // Toggle on
                newDownvotes = newDownvotes.filter(id => id !== userId); // Remove from downvotes
            }
        } else if (type === 'downvote') {
            if (newDownvotes.includes(userId)) {
                newDownvotes = newDownvotes.filter(id => id !== userId); // Toggle off
            } else {
                newDownvotes.push(userId); // Toggle on
                newUpvotes = newUpvotes.filter(id => id !== userId); // Remove from upvotes
            }
        }

        // Immediately update UI
        setPosts(prevPosts => prevPosts.map(p => 
            p._id === postId ? { ...p, upvotes: newUpvotes, downvotes: newDownvotes } : p
        ));

        // Send to backend
        try {
            const res = await api.put(`/studyposts/${postId}/${type}`);
            // Optionally sync with exact backend response, though usually unnecessary if logic matches
            setPosts(prevPosts => prevPosts.map(p => 
                p._id === postId ? { ...p, upvotes: res.data.upvotes, downvotes: res.data.downvotes } : p
            ));
        } catch (err) {
            console.error('Vote failed, reverting UI', err);
            // Revert to original state on failure
            setPosts(originalPosts);
        }
    };

    const sortedPosts = [...posts].sort((a, b) => {
        const netA = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
        const netB = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);
        return netB - netA;
    });

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 font-sans">
            <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onPostCreated={handlePostCreated} />

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                
                <div className="w-full lg:w-3/4 flex flex-col gap-4">
                    
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Study Feed</h1>
                        {subjectTag && (
                            <span className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2">
                                {subjectTag}
                                <button onClick={() => handleSubjectChange(subjectTag)} className="text-gray-400 hover:text-red-500">✕</button>
                            </span>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="w-10 h-10 border-4 border-[#5b7cfa] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : sortedPosts.length === 0 ? (
                        <div className="bg-white rounded-[20px] shadow-sm p-12 text-center border border-gray-200 flex flex-col items-center">
                            <div className="bg-gray-50 p-6 rounded-full mb-4">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                            </div>
                            <h2 className="text-xl font-extrabold text-gray-900 mb-2">It's quiet here...</h2>
                            <p className="text-gray-500 text-sm">No discussions found for this category or search.</p>
                            {isVerified && (
                                <button onClick={() => setIsCreateModalOpen(true)} className="mt-6 bg-[#5b7cfa] text-white px-6 py-2.5 rounded-full font-bold shadow-sm hover:bg-[#4a6be0] transition-colors">
                                    Start a Discussion
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {sortedPosts.map(post => {
                                const hasUpvoted = post.upvotes?.includes(user?._id);
                                const hasDownvoted = post.downvotes?.includes(user?._id);
                                const voteCount = (post.upvotes?.length || 0) - (post.downvotes?.length || 0);

                                return (
                                    <Link to={`/posts/${post._id}`} key={post._id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 border border-gray-200 hover:border-[#5b7cfa]/40 group">
                                        
                                        <div className={`hidden sm:flex flex-col items-center rounded-full py-1.5 px-1 min-w-[52px] h-fit transition-colors border ${hasUpvoted ? 'bg-[#5b7cfa] border-[#5b7cfa] text-white' : hasDownvoted ? 'bg-red-500 border-red-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-600'}`} onClick={(e) => e.preventDefault()}>
                                            <button onClick={(e) => handleVote(e, post._id, 'upvote')} className={`p-1.5 rounded-full hover:bg-black/10 transition-colors`}>
                                                <UpArrowIcon filled={hasUpvoted} />
                                            </button>
                                            <span className="text-sm font-extrabold my-0.5">
                                                {voteCount}
                                            </span>
                                            <button onClick={(e) => handleVote(e, post._id, 'downvote')} className={`p-1.5 rounded-full hover:bg-black/10 transition-colors`}>
                                                <DownArrowIcon filled={hasDownvoted} />
                                            </button>
                                        </div>

                                        <div className="flex-1 flex flex-col min-w-0">
                                            <div className="flex items-center justify-between mb-2.5">
                                                <div className="flex items-center gap-2">
                                                    {post.user?.avatar ? (
                                                        <img src={post.user.avatar} alt="avatar" className="w-6 h-6 rounded-full object-cover border border-gray-100" />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-[#5b7cfa]/10 flex items-center justify-center text-[#5b7cfa] font-bold text-[10px]">
                                                            {post.user?.name?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="font-bold text-xs sm:text-sm text-gray-900 hover:underline">{post.user?.name || 'Unknown User'}</span>
                                                        <span className="text-gray-400 text-xs font-medium">• {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                    </div>
                                                </div>
                                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider shrink-0">
                                                    {post.subjectTag || 'General'}
                                                </span>
                                            </div>

                                            <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 mb-2 leading-tight group-hover:text-[#5b7cfa] transition-colors pr-4">{post.title}</h3>
                                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">{post.description}</p>

                                            <div className="flex items-center justify-between mt-auto pt-2">
                                                <div className={`flex sm:hidden items-center rounded-full border transition-colors ${hasUpvoted ? 'bg-[#5b7cfa] border-[#5b7cfa] text-white' : hasDownvoted ? 'bg-red-500 border-red-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-600'}`} onClick={(e) => e.preventDefault()}>
                                                    <button onClick={(e) => handleVote(e, post._id, 'upvote')} className={`p-1.5 sm:p-2 rounded-l-full hover:bg-black/10 transition-colors`}>
                                                        <UpArrowIcon filled={hasUpvoted} />
                                                    </button>
                                                    <span className="text-xs font-extrabold min-w-[20px] text-center">
                                                        {voteCount}
                                                    </span>
                                                    <button onClick={(e) => handleVote(e, post._id, 'downvote')} className={`p-1.5 sm:p-2 rounded-r-full hover:bg-black/10 transition-colors`}>
                                                        <DownArrowIcon filled={hasDownvoted} />
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-1.5 bg-gray-50 sm:bg-transparent border sm:border-transparent border-gray-200 px-3 sm:px-0 py-1.5 sm:py-0 rounded-full text-gray-500 hover:text-gray-700 font-bold text-xs sm:text-sm transition-colors">
                                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                                    {post.answers?.length || 0} Answers
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {!isLoading && totalPages > 1 && (
                        <div className="flex justify-center items-center gap-3 mt-6">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white shadow-sm text-gray-700 hover:bg-[#5b7cfa] hover:text-white border border-gray-200'}`}>Prev</button>
                            <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">{page} / {totalPages}</span>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${page === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white shadow-sm text-gray-700 hover:bg-[#5b7cfa] hover:text-white border border-gray-200'}`}>Next</button>
                        </div>
                    )}
                </div>

                <div className="w-full lg:w-1/4 relative">
                    <div className="sticky top-24 flex flex-col gap-5">
                        
                        {isVerified && (
                            <button onClick={() => setIsCreateModalOpen(true)} className="w-full bg-[#5b7cfa] text-white px-6 py-3.5 rounded-2xl font-extrabold shadow-md hover:bg-[#4a6be0] hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                                Create Post
                            </button>
                        )}

                        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                            <h3 className="font-extrabold text-gray-900 mb-3 text-xs uppercase tracking-widest">Search Community</h3>
                            <form onSubmit={handleSearch} className="relative">
                                <input type="text" placeholder="Search posts..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[#5b7cfa] focus:border-transparent outline-none transition-all" />
                                <svg className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </form>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-200">
                            <h3 className="font-extrabold text-gray-900 mb-3 text-xs uppercase tracking-widest">Topics</h3>
                            <div className="flex flex-wrap gap-2">
                                <button 
                                    onClick={() => handleSubjectChange('')} 
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${subjectTag === '' ? 'bg-[#5b7cfa] text-white border-[#5b7cfa]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'}`}
                                >
                                    All
                                </button>
                                {SUBJECTS.map(sub => (
                                    <button 
                                        key={sub} 
                                        onClick={() => handleSubjectChange(sub)} 
                                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${subjectTag === sub ? 'bg-[#5b7cfa] text-white border-[#5b7cfa]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'}`}
                                    >
                                        {sub}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StudyPosts;