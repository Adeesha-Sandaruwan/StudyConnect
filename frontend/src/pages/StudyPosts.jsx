import { useState, useEffect, useContext, useCallback } from 'react';
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
    const [notice, setNotice] = useState('');

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

    const fetchPosts = useCallback(async () => {
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
    }, [page, keyword, subjectTag]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

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
            setNotice('Complete onboarding and verification to vote on posts.');
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

    useEffect(() => {
        if (!notice) return;
        const timer = setTimeout(() => setNotice(''), 3200);
        return () => clearTimeout(timer);
    }, [notice]);

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-linear-to-b from-[#f4f7ff] via-[#f9fbff] to-white">
            <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onPostCreated={handlePostCreated} />

            <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
                <div className="mb-6 overflow-hidden rounded-3xl border border-[#dde4ff] bg-white shadow-sm">
                    <div className="bg-linear-to-r from-[#e8eeff] via-[#f2f6ff] to-[#f8faff] px-5 py-6 sm:px-7 sm:py-7">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">Study Feed</h1>
                                <p className="mt-1 text-sm font-medium text-gray-600 sm:text-base">Discover questions, share ideas, and learn faster together.</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-[#d4ddff] bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#4a66de]">
                                    {sortedPosts.length} visible posts
                                </span>
                                {subjectTag && (
                                    <span className="inline-flex items-center gap-2 rounded-full border border-[#d4ddff] bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#4a66de]">
                                        {subjectTag}
                                        <button onClick={() => handleSubjectChange(subjectTag)} className="text-[#6f82d9] hover:text-red-500">✕</button>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {notice && (
                    <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                        {notice}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
                    <div className="flex flex-col gap-4">

                    {isLoading ? (
                        <div className="flex h-64 items-center justify-center rounded-3xl border border-[#dbe3ff] bg-white shadow-sm">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#5b7cfa] border-t-transparent"></div>
                        </div>
                    ) : sortedPosts.length === 0 ? (
                        <div className="flex flex-col items-center rounded-3xl border border-[#dbe3ff] bg-white p-12 text-center shadow-sm">
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
                                    <Link to={`/posts/${post._id}`} key={post._id} className="group flex flex-col gap-4 rounded-3xl border border-[#dbe3ff] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#b9c8ff] hover:shadow-md sm:flex-row sm:gap-5 sm:p-5">
                                        
                                        <div className={`hidden h-fit w-13 flex-col items-center rounded-full border px-1 py-1.5 transition-colors sm:flex ${hasUpvoted ? 'border-[#5b7cfa] bg-[#5b7cfa] text-white' : hasDownvoted ? 'border-red-500 bg-red-500 text-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`} onClick={(e) => e.preventDefault()}>
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

                                        <div className="flex min-w-0 flex-1 flex-col">
                                            <div className="mb-2.5 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    {post.user?.avatar ? (
                                                        <img src={post.user.avatar} alt="avatar" className="h-7 w-7 rounded-full border border-gray-100 object-cover" />
                                                    ) : (
                                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#5b7cfa]/10 text-[10px] font-bold text-[#5b7cfa]">
                                                            {post.user?.name?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="font-bold text-xs sm:text-sm text-gray-900 hover:underline">{post.user?.name || 'Unknown User'}</span>
                                                        <span className="text-gray-400 text-xs font-medium">• {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                    </div>
                                                </div>
                                                <span className="shrink-0 rounded-full border border-[#d5ddff] bg-[#eef2ff] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#4662da]">
                                                    {post.subjectTag || 'General'}
                                                </span>
                                            </div>

                                            <h3 className="mb-2 pr-4 text-lg font-extrabold leading-tight text-gray-900 transition-colors group-hover:text-[#4b67de] sm:text-xl">{post.title}</h3>
                                            <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-600">{post.description}</p>

                                            <div className="mt-auto flex items-center justify-between pt-2">
                                                <div className={`flex items-center rounded-full border transition-colors sm:hidden ${hasUpvoted ? 'border-[#5b7cfa] bg-[#5b7cfa] text-white' : hasDownvoted ? 'border-red-500 bg-red-500 text-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`} onClick={(e) => e.preventDefault()}>
                                                    <button onClick={(e) => handleVote(e, post._id, 'upvote')} className={`p-1.5 sm:p-2 rounded-l-full hover:bg-black/10 transition-colors`}>
                                                        <UpArrowIcon filled={hasUpvoted} />
                                                    </button>
                                                    <span className="inline-block w-5 text-center text-xs font-extrabold">
                                                        {voteCount}
                                                    </span>
                                                    <button onClick={(e) => handleVote(e, post._id, 'downvote')} className={`p-1.5 sm:p-2 rounded-r-full hover:bg-black/10 transition-colors`}>
                                                        <DownArrowIcon filled={hasDownvoted} />
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-500 transition-colors hover:text-gray-700 sm:border-transparent sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm">
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
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${page === 1 ? 'cursor-not-allowed bg-gray-100 text-gray-400' : 'border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-[#5b7cfa] hover:text-white'}`}>Prev</button>
                            <span className="rounded-full border border-[#d9e1ff] bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-[#4b67de] shadow-sm">{page} / {totalPages}</span>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${page === totalPages ? 'cursor-not-allowed bg-gray-100 text-gray-400' : 'border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-[#5b7cfa] hover:text-white'}`}>Next</button>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <div className="sticky top-24 flex flex-col gap-5">
                        <div className="rounded-3xl border border-[#dbe3ff] bg-white p-5 shadow-sm">
                            <h3 className="mb-2 text-sm font-extrabold uppercase tracking-widest text-gray-900">Your Space</h3>
                            <p className="mb-4 text-sm text-gray-600">Start a helpful discussion or ask a clear question for faster responses.</p>

                            {isVerified ? (
                                <button onClick={() => setIsCreateModalOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5b7cfa] px-6 py-3.5 text-sm font-extrabold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#4a6be0] hover:shadow-lg">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                                    Create Post
                                </button>
                            ) : (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs font-semibold text-amber-800">
                                    You can browse posts now. Complete onboarding and get verified to create posts or vote.
                                </div>
                            )}
                        </div>

                        <div className="rounded-3xl border border-[#dbe3ff] bg-white p-5 shadow-sm">
                            <h3 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-gray-900">Search Community</h3>
                            <form onSubmit={handleSearch} className="relative">
                                <input type="text" placeholder="Search posts..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm font-medium outline-none transition-all focus:border-[#bfd0ff] focus:ring-2 focus:ring-[#dfe7ff]" />
                                <svg className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </form>

                            <div className="mt-3 flex gap-2">
                                <button onClick={handleSearch} className="rounded-lg bg-[#eef2ff] px-3 py-1.5 text-xs font-bold text-[#4965dc] transition-colors hover:bg-[#dde5ff]">
                                    Apply
                                </button>
                                {(keyword || searchInput) && (
                                    <button
                                        onClick={() => {
                                            setKeyword('');
                                            setSearchInput('');
                                            setPage(1);
                                        }}
                                        className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-200"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-[#dbe3ff] bg-white p-5 shadow-sm">
                            <h3 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-gray-900">Topics</h3>
                            <div className="flex flex-wrap gap-2">
                                <button 
                                    onClick={() => handleSubjectChange('')} 
                                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${subjectTag === '' ? 'border-[#5b7cfa] bg-[#5b7cfa] text-white' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                >
                                    All
                                </button>
                                {SUBJECTS.map(sub => (
                                    <button 
                                        key={sub} 
                                        onClick={() => handleSubjectChange(sub)} 
                                        className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${subjectTag === sub ? 'border-[#5b7cfa] bg-[#5b7cfa] text-white' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        {sub}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-[#dbe3ff] bg-white p-5 shadow-sm">
                            <h3 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-gray-900">Tips For Better Replies</h3>
                            <ul className="space-y-2 text-xs font-medium text-gray-600">
                                <li>Use a clear, specific title with the topic and grade level.</li>
                                <li>Add what you have already tried before asking.</li>
                                <li>Attach screenshots or notes for faster, better answers.</li>
                            </ul>
                        </div>
                        
                    </div>
                </div>

            </div>
            </div>
        </div>
    );
};

export default StudyPosts;