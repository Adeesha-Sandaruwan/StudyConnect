import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import CreatePostModal from '../components/CreatePostModal';

const StudyPosts = () => {
    const { user } = useContext(AuthContext); // Bring user in to highlight their active votes
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
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
        fetchPosts();
    }, [page, keyword, subjectTag]);

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            let query = `?page=${page}&limit=9`;
            if (keyword) query += `&keyword=${encodeURIComponent(keyword)}`;
            if (subjectTag) query += `&subjectTag=${encodeURIComponent(subjectTag)}`;

            const res = await api.get(`/studyposts${query}`);
            setPosts(res.data.posts);
            setTotalPages(res.data.pages);
        } catch (error) {
            console.error("Failed to fetch posts:", error);
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

    // NEW: Handle Upvote/Downvote directly from the feed
    const handleVote = async (e, postId, type) => {
        e.preventDefault(); // Prevents the <Link> from triggering navigation
        try {
            const res = await api.put(`/studyposts/${postId}/${type}`);
            // Optimistically update the local state so the UI feels instantaneous
            setPosts(posts.map(p => 
                p._id === postId ? { ...p, upvotes: res.data.upvotes, downvotes: res.data.downvotes } : p
            ));
        } catch (err) {
            console.error(`Failed to ${type} post:`, err);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 font-sans">
            <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onPostCreated={handlePostCreated} />

            <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 mb-8 flex flex-col lg:flex-row justify-between gap-6 items-center">
                <div className="w-full lg:w-auto text-center lg:text-left">
                    <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Study Feed</h1>
                    <p className="text-gray-500 mt-1 text-sm">Discover questions, notes, and study materials.</p>
                </div>
                
                <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
                    <form onSubmit={handleSearch} className="flex-1 sm:min-w-[250px] relative">
                        <input type="text" placeholder="Search posts..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-10 py-3 text-sm focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all" />
                        <button type="submit" className="absolute right-3 top-3 text-gray-400 hover:text-[#5b7cfa]">🔍</button>
                    </form>
                    
                    <select value={subjectTag} onChange={handleSubjectChange} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#5b7cfa] outline-none transition-all appearance-none cursor-pointer text-gray-600">
                        <option value="">All Subjects</option>
                        {SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>

                    <button onClick={() => setIsCreateModalOpen(true)} className="bg-[#5b7cfa] text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-[#4a6be0] hover:-translate-y-0.5 transition-all whitespace-nowrap">
                        + Create Post
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-12 h-12 border-4 border-[#5b7cfa] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : posts.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-sm p-12 text-center">
                    <span className="text-6xl mb-4 block">📭</span>
                    <h2 className="text-xl font-bold text-gray-800">No posts found</h2>
                    <p className="text-gray-500 mt-2">Try adjusting your search or filter criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map(post => {
                        const hasUpvoted = post.upvotes?.includes(user?._id);
                        const hasDownvoted = post.downvotes?.includes(user?._id);

                        return (
                            <Link to={`/posts/${post._id}`} key={post._id} className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col h-full border border-transparent hover:border-blue-50">
                                <div className="flex items-center gap-3 mb-4">
                                    {post.user?.avatar ? (
                                        <img src={post.user.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-[#5b7cfa]/10 flex items-center justify-center text-[#5b7cfa] font-bold">
                                            {post.user?.name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-bold text-sm text-gray-800 leading-tight">{post.user?.name || 'Unknown User'}</p>
                                        <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <span className="inline-block bg-blue-50 text-[#5b7cfa] px-3 py-1 rounded-full text-xs font-bold mb-3">
                                        {post.subjectTag || 'General'}
                                    </span>
                                    <h3 className="text-lg font-extrabold text-gray-800 mb-2 line-clamp-2">{post.title}</h3>
                                    <p className="text-gray-600 text-sm line-clamp-3">{post.description}</p>
                                </div>

                                {/* NEW: Interactive Footer */}
                                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-sm font-semibold text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <button onClick={(e) => handleVote(e, post._id, 'upvote')} className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${hasUpvoted ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'}`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                                            {post.upvotes?.length || 0}
                                        </button>
                                        <button onClick={(e) => handleVote(e, post._id, 'downvote')} className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${hasDownvoted ? 'bg-red-100 text-red-700' : 'hover:bg-gray-100'}`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            {post.downvotes?.length || 0}
                                        </button>
                                    </div>
                                    <span className="flex items-center gap-1">
                                        💬 {post.answers?.length || 0}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {!isLoading && totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-10">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={`px-4 py-2 rounded-xl font-bold transition-all ${page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white shadow-sm text-gray-700 hover:text-[#5b7cfa]'}`}>Prev</button>
                    <span className="text-sm font-bold text-gray-500">Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={`px-4 py-2 rounded-xl font-bold transition-all ${page === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white shadow-sm text-gray-700 hover:text-[#5b7cfa]'}`}>Next</button>
                </div>
            )}
        </div>
    );
};

export default StudyPosts;