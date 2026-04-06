import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import CreatePostModal from '../components/CreatePostModal';

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

    const handleSubjectChange = (e) => {
        setSubjectTag(e.target.value);
        setPage(1); 
    };

    const handlePostCreated = () => {
        setPage(1); 
        fetchPosts(); 
    };

    const handleVote = async (e, postId, type) => {
        e.preventDefault();
        if (!isVerified) {
            alert('You must complete onboarding and be verified by an admin to vote.');
            return;
        }
        try {
            const res = await api.put(`/studyposts/${postId}/${type}`);
            setPosts(posts.map(p => p._id === postId ? { ...p, upvotes: res.data.upvotes, downvotes: res.data.downvotes } : p));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 font-sans">
            <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onPostCreated={handlePostCreated} />

            <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-6 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Study Feed</h1>
                    {isVerified && (
                        <button onClick={() => setIsCreateModalOpen(true)} className="bg-[#5b7cfa] text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-sm hover:bg-[#4a6be0] transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                            Create Post
                        </button>
                    )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                    <form onSubmit={handleSearch} className="flex-1 relative">
                        <input type="text" placeholder="Search discussions..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all" />
                        <svg className="absolute left-4 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <button type="submit" className="hidden">Search</button>
                    </form>
                    
                    <select value={subjectTag} onChange={handleSubjectChange} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all appearance-none cursor-pointer text-gray-700 min-w-[140px]">
                        <option value="">All Subjects</option>
                        {SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <div className="w-10 h-10 border-4 border-[#5b7cfa] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : posts.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                    <h2 className="text-lg font-extrabold text-gray-900">No posts found</h2>
                    <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filter criteria.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {posts.map(post => {
                        const hasUpvoted = post.upvotes?.includes(user?._id);
                        const hasDownvoted = post.downvotes?.includes(user?._id);
                        const voteCount = (post.upvotes?.length || 0) - (post.downvotes?.length || 0);

                        return (
                            <Link to={`/posts/${post._id}`} key={post._id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5 flex flex-col border border-gray-100 cursor-pointer">
                                
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2.5">
                                        {post.user?.avatar ? (
                                            <img src={post.user.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-gray-100" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#5b7cfa] font-bold text-xs">
                                                {post.user?.name?.charAt(0) || '?'}
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-sm text-gray-900">{post.user?.name || 'Unknown User'}</span>
                                                <span className="text-gray-400 text-xs font-medium">• {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider">
                                        {post.subjectTag || 'General'}
                                    </span>
                                </div>

                                <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 mb-2 leading-snug">{post.title}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">{post.description}</p>

                                <div className="flex items-center gap-3 mt-auto pt-1">
                                    <div className="flex items-center bg-gray-50 rounded-full border border-gray-200" onClick={(e) => e.preventDefault()}>
                                        <button onClick={(e) => handleVote(e, post._id, 'upvote')} className={`p-1.5 sm:p-2 rounded-l-full hover:bg-gray-200 transition-colors ${hasUpvoted ? 'text-[#5b7cfa]' : 'text-gray-500'}`}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7"></path></svg>
                                        </button>
                                        <span className={`text-xs font-extrabold min-w-[20px] text-center ${hasUpvoted ? 'text-[#5b7cfa]' : hasDownvoted ? 'text-red-500' : 'text-gray-700'}`}>
                                            {voteCount}
                                        </span>
                                        <button onClick={(e) => handleVote(e, post._id, 'downvote')} className={`p-1.5 sm:p-2 rounded-r-full hover:bg-gray-200 transition-colors ${hasDownvoted ? 'text-red-500' : 'text-gray-500'}`}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full text-gray-600 hover:bg-gray-100 transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                        <span className="text-xs font-bold">{post.answers?.length || 0} Answers</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {!isLoading && totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white shadow-sm text-gray-700 hover:text-[#5b7cfa] border border-gray-200'}`}>Prev</button>
                    <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${page === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white shadow-sm text-gray-700 hover:text-[#5b7cfa] border border-gray-200'}`}>Next</button>
                </div>
            )}
        </div>
    );
};

export default StudyPosts;